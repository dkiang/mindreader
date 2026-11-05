import test from 'node:test';
import assert from 'node:assert/strict';
import { getTokenSequence, getTargetFitScore } from '../js/api.js';

test('browser parser keeps the actual generated token at every position', async () => {
  let request;
  globalThis.fetch = async (_path, options) => {
    request = JSON.parse(options.body);
    return new Response(JSON.stringify({
      choices: [{ logprobs: { content: [
        { token: '.', logprob: Math.log(0.8), top_logprobs: [{ token: '.', logprob: Math.log(0.8) }] },
        { token: ' Next', logprob: Math.log(0.7), top_logprobs: [{ token: ' Next', logprob: Math.log(0.7) }] }
      ] } }]
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  const frames = await getTokenSequence('A test', 2);
  assert.deepEqual([frames[0].chosenToken, frames[1].chosenToken], ['.', ' Next']);
  assert.deepEqual(request, { task: 'tokenSequence', prompt: 'A test', count: 2 });
});

test('invalid fit ratings fail rather than becoming a false zero', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    choices: [{ message: { content: 'probably high' } }]
  }), { status: 200, headers: { 'content-type': 'application/json' } });
  await assert.rejects(getTargetFitScore('A test', 'apology'), /invalid fit score/);
});
