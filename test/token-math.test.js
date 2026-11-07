import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWholeWordFrames, readTokenPosition, chooseTokenOptions, displayToken, groupVisibleAlternatives, isSpacingToken, isWholeWordCandidate, isPlausibleWordChoice, percentageTenths } from '../js/token-math.js';

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

test('tiny logprob rounding overflow does not reject a valid model response', () => {
  const frame = readTokenPosition({
    token: ' weeks',
    logprob: -0.01860809326171875,
    top_logprobs: [
      { token: ' weeks', logprob: -0.01860809326171875 },
      { token: ' months', logprob: -4.143608093261719 },
      { token: ' days', logprob: -6.018608093261719 },
      { token: ' sessions', logprob: -8.893608093261719 },
      { token: ' times', logprob: -13.893608093261719 },
      { token: ' trading', logprob: -15.643608093261719 },
      { token: ' week', logprob: -15.893608093261719 },
      { token: 'weeks', logprob: -16.14360809326172 },
      { token: ' quarters', logprob: -16.39360809326172 },
      { token: ' years', logprob: -16.51860809326172 }
    ]
  });

  const listedMass = frame.distribution.reduce((sum, item) => sum + item.probability, 0);
  assert.ok(listedMass <= 1);
  assert.equal(frame.otherProbability, 0);
});

test('word rounds skip generated fragments while keeping the passage intact', () => {
  const position = (token, alternatives) => readTokenPosition({
    token,
    logprob: Math.log(0.5),
    top_logprobs: [
      { token, logprob: Math.log(0.5) },
      ...alternatives.map(([word, probability]) => ({ token: word, logprob: Math.log(probability) }))
    ]
  });
  const sequence = [
    position('Im', [[' In', 0.2]]),
    position('port', [[' any', 0.2]]),
    position('ant', [[' this', 0.2]]),
    position(' plan', [[' path', 0.2], ['.', 0.1], [' ', 0.05], ['ning', 0.05]]),
    position(' works', [[' helps', 0.2]])
  ];

  const frames = buildWholeWordFrames(sequence, 5);
  assert.equal(frames.length, 1);
  assert.equal(frames[0].index, 3);
  assert.equal(frames[0].chosenLabel, 'plan');
  assert.equal(frames[0].precedingText, 'Important');
  assert.deepEqual(frames[0].distribution.map(item => item.token), ['plan', 'path']);
  assert.ok(Math.abs(frames[0].otherProbability - 0.3) < 1e-10);
  assert.ok(chooseTokenOptions(frames[0].distribution, frames[0].chosenLabel)
    .every(item => isWholeWordCandidate(item.token, true)));
});

test('mode 1 choices hide token fragments that are not plausible words', () => {
  const position = readTokenPosition({
    token: 'open',
    logprob: Math.log(0.3),
    top_logprobs: [
      { token: 'open', logprob: Math.log(0.3) },
      { token: 'experience', logprob: Math.log(0.2) },
      { token: 'make', logprob: Math.log(0.15) },
      { token: 'inst', logprob: Math.log(0.12) },
      { token: 're', logprob: Math.log(0.1) },
      { token: 'w', logprob: Math.log(0.08) }
    ]
  });
  const next = readTokenPosition({
    token: '.',
    logprob: Math.log(0.9),
    top_logprobs: [{ token: '.', logprob: Math.log(0.9) }]
  });

  const [frame] = buildWholeWordFrames([position, next], 1);
  assert.deepEqual(frame.distribution.map(item => item.token), ['open', 'experience', 'make']);
  assert.ok(chooseTokenOptions(frame.distribution, frame.chosenLabel)
    .every(item => isPlausibleWordChoice(item.token, true)));
});

test('a token that could continue at the end of the response is not a word round', () => {
  const sequence = [
    readTokenPosition({ token: ' walk', logprob: Math.log(0.6), top_logprobs: [
      { token: ' walk', logprob: Math.log(0.6) }, { token: ' run', logprob: Math.log(0.2) }
    ] }),
    readTokenPosition({ token: 'ing', logprob: Math.log(0.7), top_logprobs: [
      { token: 'ing', logprob: Math.log(0.7) }, { token: 'ed', logprob: Math.log(0.1) }
    ] })
  ];
  assert.deepEqual(buildWholeWordFrames(sequence, 5), []);
  assert.equal(isWholeWordCandidate('ing', false), false);
  assert.equal(isWholeWordCandidate('!', true), false);
  assert.equal(isWholeWordCandidate('2024', true), false);
  assert.equal(isWholeWordCandidate(" can't", false), true);
});
