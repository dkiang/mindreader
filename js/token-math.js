/** Probability helpers for one generated token position. */

export function displayToken(token) {
  return token
    .replace(/^ +/, '')
    .replace(/\t/g, '⇥')
    .replace(/\r/g, '␍')
    .replace(/\n/g, '↵');
}

export function isSpacingToken(token) {
  return /^ +$/.test(token);
}

const SHORT_WORDS = new Set([
  'a', 'i', 'am', 'an', 'as', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'in', 'is', 'it',
  'me', 'my', 'no', 'of', 'oh', 'on', 'or', 'so', 'to', 'up', 'us', 'we',
  'ace', 'act', 'add', 'age', 'ago', 'aid', 'air', 'all', 'and', 'any', 'are', 'arm', 'art',
  'ask', 'bad', 'bag', 'bar', 'bed', 'big', 'bit', 'box', 'boy', 'bus', 'but', 'buy', 'can',
  'car', 'cat', 'cup', 'cut', 'dad', 'day', 'did', 'dog', 'due', 'eat', 'end', 'eye', 'far',
  'few', 'fit', 'fix', 'fly', 'for', 'fun', 'get', 'got', 'had', 'has', 'hat', 'her', 'him',
  'his', 'hit', 'hot', 'how', 'job', 'key', 'law', 'let', 'lie', 'lot', 'low', 'man', 'map',
  'may', 'mom', 'new', 'not', 'now', 'odd', 'off', 'old', 'one', 'our', 'out', 'own', 'pay',
  'path', 'pen', 'put', 'ran', 'red', 'run', 'sad', 'saw', 'say', 'see', 'set', 'she', 'sit', 'sky',
  'son', 'sun', 'tea', 'the', 'too', 'top', 'try', 'two', 'use', 'war', 'was', 'way', 'who',
  'why', 'win', 'won', 'yes', 'yet', 'you',
  'able', 'back', 'bell', 'call', 'came', 'city', 'cold', 'dark', 'door', 'down', 'drop',
  'fall', 'felt', 'find', 'fire', 'food', 'from', 'game', 'gift', 'girl', 'good', 'home',
  'hour', 'into', 'jump', 'keep', 'late', 'life', 'line', 'look', 'made', 'make', 'many',
  'move', 'much', 'name', 'open', 'over', 'plan', 'play', 'read', 'ring', 'rise', 'road',
  'room', 'said', 'same', 'soar', 'some', 'soon', 'step', 'stop', 'take', 'talk', 'team',
  'that', 'them', 'then', 'they', 'this', 'time', 'turn', 'very', 'wait', 'walk', 'wall',
  'went', 'were', 'what', 'when', 'will', 'with', 'word', 'work'
]);

const TOKEN_FRAGMENTS = new Set([
  'hes', 'im', 'inst', 'st', 're', 'pre', 'spec', 'anal', 'econ', 'indic', 'vol'
]);

export function isPlausibleWordChoice(token, atBoundary = true) {
  if (!isWholeWordCandidate(token, atBoundary)) return false;
  const word = displayToken(token).toLowerCase();
  if (TOKEN_FRAGMENTS.has(word)) return false;
  if (word.length <= 4) return SHORT_WORDS.has(word);
  if (!/[aeiouy]/.test(word)) return false;
  return true;
}

/** Combine tokens that differ only by assumed leading spaces. */
export function groupVisibleAlternatives(distribution, otherProbability, chosenToken, isEligible = () => true) {
  const groups = new Map();
  let hiddenProbability = otherProbability;

  for (const item of distribution) {
    if (isSpacingToken(item.token) || !isEligible(item.token)) {
      hiddenProbability += item.probability;
      continue;
    }
    const label = displayToken(item.token);
    const group = groups.get(label) || { token: label, probability: 0, isChosen: false };
    group.probability += item.probability;
    group.isChosen ||= item.token === chosenToken;
    groups.set(label, group);
  }

  const visible = [...groups.values()].sort((a, b) => b.probability - a.probability);
  visible.forEach((item, index) => { item.rank = index + 1; });
  return { distribution: visible, otherProbability: hiddenProbability };
}

/** A word must start at a boundary and occupy the entire visible token. */
export function isWholeWordCandidate(token, atBoundary) {
  return /^ *\p{L}[\p{L}\p{M}]*(?:['’\-]\p{L}[\p{L}\p{M}]*)*$/u.test(token) &&
    (token.startsWith(' ') || atBoundary);
}

/** Build playable rounds only when the sampled token is a complete word. */
export function buildWholeWordFrames(sequence, maxRounds) {
  const frames = [];
  let precedingText = '';

  for (let index = 0; index < sequence.length && frames.length < maxRounds; index++) {
    const position = sequence[index];
    const previous = sequence[index - 1]?.chosenToken;
    const next = sequence[index + 1]?.chosenToken;
    const atBoundary = index === 0 || !/[\p{L}\p{N}'’\-]$/u.test(previous);
    const completeWord = isPlausibleWordChoice(position.chosenToken, atBoundary) &&
      typeof next === 'string' && /^[^\p{L}\p{N}'’\-]/u.test(next);

    if (completeWord) {
      const visible = groupVisibleAlternatives(
        position.distribution,
        position.otherProbability,
        position.chosenToken,
        token => isPlausibleWordChoice(token, atBoundary)
      );
      if (visible.distribution.length >= 2) {
        frames.push({
          ...position,
          ...visible,
          index,
          chosenLabel: displayToken(position.chosenToken),
          precedingText
        });
        precedingText = '';
        continue;
      }
    }

    precedingText += position.chosenToken;
  }

  return frames;
}

export function readTokenPosition(position) {
  if (typeof position?.token !== 'string' || !Number.isFinite(position.logprob)) {
    throw new Error('The model did not return a generated token with log probabilities');
  }

  const byToken = new Map();
  for (const item of position.top_logprobs || []) {
    if (typeof item.token !== 'string' || !Number.isFinite(item.logprob)) continue;
    const probability = Math.exp(item.logprob);
    byToken.set(item.token, (byToken.get(item.token) || 0) + probability);
  }

  // The sampled token can be outside the returned top alternatives.
  const sampledOutsideTop = !byToken.has(position.token);
  if (sampledOutsideTop) {
    byToken.set(position.token, Math.exp(position.logprob));
  }

  const distribution = [...byToken].map(([token, probability]) => ({
    token,
    probability,
    isChosen: token === position.token,
    sampledOutsideTop: sampledOutsideTop && token === position.token
  }));
  distribution.sort((a, b) => b.probability - a.probability);
  let rank = 0;
  distribution.forEach(item => {
    item.rank = item.sampledOutsideTop ? null : ++rank;
  });

  let listedMass = distribution.reduce((sum, item) => sum + item.probability, 0);
  if (listedMass > 1) {
    if (listedMass > 1.001) throw new Error('Invalid token probabilities from model');
    distribution.forEach(item => { item.probability /= listedMass; });
    listedMass = 1;
  }

  return {
    chosenToken: position.token,
    distribution,
    otherProbability: Math.max(0, 1 - listedMass)
  };
}

export function chooseTokenOptions(distribution, chosenToken) {
  const chosen = distribution.find(item => item.token === chosenToken);
  if (!chosen) throw new Error('Generated token is missing from alternatives');

  const alternatives = distribution.filter(item => item.token !== chosenToken);
  const selected = [chosen];
  for (const index of [0, Math.floor((alternatives.length - 1) / 2), alternatives.length - 1]) {
    const candidate = alternatives[index];
    if (candidate && !selected.includes(candidate)) selected.push(candidate);
  }
  for (const candidate of alternatives) {
    if (selected.length >= 4) break;
    if (!selected.includes(candidate)) selected.push(candidate);
  }

  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  return selected;
}

// Largest-remainder rounding keeps the displayed rows at exactly 100.0%.
export function percentageTenths(probabilities) {
  const scaled = probabilities.map(value => Math.max(0, value) * 1000);
  const units = scaled.map(Math.floor);
  let remaining = 1000 - units.reduce((sum, value) => sum + value, 0);
  const order = scaled.map((value, index) => ({ index, remainder: value - units[index] }))
    .sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < remaining; i++) units[order[i % order.length].index]++;
  return units;
}
