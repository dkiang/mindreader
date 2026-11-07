import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import handler from '../api/chat.js';

test('server requests one continuation with per-position log probabilities', async t => {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push(JSON.parse(body));
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { content: 'a path' }, logprobs: { content: [] } }] }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  process.env.OPENAI_API_KEY = 'sk-test-only';
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${server.address().port}/v1`;
  delete process.env.OPENAI_MODEL;
  delete process.env.OPENAI_TOKEN_SEQUENCE_MODEL;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  const req = {
    method: 'POST',
    headers: { origin: 'https://www.kiang.net', 'x-forwarded-for': 'local-test' },
    body: { task: 'tokenSequence', prompt: 'The map revealed', count: 5 }
  };
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler(req, res);

  assert.equal(res.code, 200);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].model, 'gpt-4o-mini');
  assert.equal(requests[0].reasoning_effort, undefined);
  assert.equal(requests[0].max_tokens, 5);
  assert.equal(requests[0].logprobs, true);
  assert.equal(requests[0].top_logprobs, 10);
  assert.equal(requests[0].messages[1].content, 'The map revealed');

  const scoreReq = {
    ...req,
    body: { task: 'targetFitScore', context: 'The map revealed a secret', target: 'discovery' }
  };
  const scoreRes = { status: res.status, json: res.json };
  await handler(scoreReq, scoreRes);
  assert.equal(scoreRes.code, 200);
  assert.equal(requests[1].model, 'gpt-4o-mini');
  assert.equal(requests[1].reasoning_effort, undefined);
  assert.equal(requests[1].logprobs, undefined);
  assert.match(requests[1].messages[0].content, /not a probability/);
  assert.match(requests[1].messages[0].content, /full scale/);
  assert.match(requests[1].messages[1].content, /Target concept: discovery/);

  const beatRes = { status: res.status, json: res.json };
  await handler({
    ...req,
    body: { task: 'storyBeat', context: 'The map revealed a secret. Someone opened it.', move: 'Someone opened it.' }
  }, beatRes);
  assert.equal(beatRes.code, 200);
  assert.match(requests[2].messages[0].content, /collaborative story partner/);
  assert.ok(!requests[2].messages[1].content.includes('discovery'));

  const analysisRes = { status: res.status, json: res.json };
  await handler({
    ...req,
    body: {
      task: 'nudgeAnalysis', startingPrompt: 'The map revealed', target: 'discovery',
      nudges: ['Someone opened it.'], beats: ['A hidden cave appeared.'],
      scores: [30, 45], won: false
    }
  }, analysisRes);
  assert.equal(analysisRes.code, 200);
  assert.match(requests[3].messages[0].content, /player knows the target/);
  assert.match(requests[3].messages[1].content, /A hidden cave appeared/);
});
