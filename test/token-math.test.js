import test from 'node:test';
import assert from 'node:assert/strict';
import { readTokenPosition, chooseTokenOptions, displayToken, groupVisibleAlternatives, isSpacingToken, percentageTenths } from '../js/token-math.js';

test('the generated punctuation token remains the answer', () => {
  const frame = readTokenPosition({
    token: '"',
    logprob: Math.log(0.6),
    top_logprobs: [
      { token: '"', logprob: Math.log(0.6) },
      { token: 'a', logprob: Math.log(0.25) },
      { token: 'the', logprob: Math.log(0.1) }
    ]
  });
  assert.equal(frame.chosenToken, '"');
  assert.ok(chooseTokenOptions(frame.distribution, frame.chosenToken).some(item => item.token === '"'));
  assert.ok(Math.abs(frame.otherProbability - 0.05) < 1e-10);
});

test('visible alternatives combine leading-space variants without losing probability', () => {
  const frame = readTokenPosition({
    token: ' a',
    logprob: Math.log(0.5),
    top_logprobs: [
      { token: ' a', logprob: Math.log(0.5) },
      { token: 'a', logprob: Math.log(0.3) },
      { token: ' ', logprob: Math.log(0.1) }
    ]
  });
  assert.equal(frame.distribution.length, 3);
  assert.equal(displayToken(' a'), 'a');
  assert.equal(displayToken('a'), 'a');
  assert.equal(isSpacingToken(' '), true);
  const visible = groupVisibleAlternatives(frame.distribution, frame.otherProbability, frame.chosenToken);
  assert.deepEqual(visible.distribution.map(item => item.token), ['a']);
  assert.ok(Math.abs(visible.distribution[0].probability - 0.8) < 1e-10);
  assert.ok(Math.abs(visible.otherProbability - 0.2) < 1e-10);
  assert.equal(percentageTenths([visible.distribution[0].probability, visible.otherProbability]).reduce((a, b) => a + b), 1000);
});

test('a sampled token outside the top list is shown separately from other tokens', () => {
  const frame = readTokenPosition({
    token: 'c',
    logprob: Math.log(0.05),
    top_logprobs: [
      { token: 'a', logprob: Math.log(0.6) },
      { token: 'b', logprob: Math.log(0.2) }
    ]
  });
  assert.equal(frame.distribution.find(item => item.token === 'c').rank, null);
  assert.ok(Math.abs(frame.otherProbability - 0.15) < 1e-10);
  assert.equal(chooseTokenOptions(frame.distribution, 'c').length, 3);
});

test('displayed tenths total 100.0% without renormalizing listed tokens', () => {
  const percentages = percentageTenths([1 / 3, 1 / 3, 1 / 3, 0]);
  assert.equal(percentages.reduce((sum, value) => sum + value, 0), 1000);
  assert.ok(percentages.slice(0, 3).every(value => value >= 333 && value <= 334));
});
