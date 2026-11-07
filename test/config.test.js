import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, getRandomPrompt } from '../js/config.js';

test('mode prompts do not repeat until the available prompts are exhausted', () => {
  const seen = new Set();

  for (let i = 0; i < CONFIG.mode1.startingPrompts.length; i++) {
    const prompt = getRandomPrompt('mode1');
    assert.ok(CONFIG.mode1.startingPrompts.includes(prompt));
    assert.equal(seen.has(prompt), false);
    seen.add(prompt);
  }

  assert.equal(seen.size, CONFIG.mode1.startingPrompts.length);
});
