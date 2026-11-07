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
    const completeWord = isWholeWordCandidate(position.chosenToken, atBoundary) &&
      typeof next === 'string' && /^[^\p{L}\p{N}'’\-]/u.test(next);

    if (completeWord) {
      const visible = groupVisibleAlternatives(
        position.distribution,
        position.otherProbability,
        position.chosenToken,
        token => isWholeWordCandidate(token, atBoundary)
      );
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

  const listedMass = distribution.reduce((sum, item) => sum + item.probability, 0);
  if (listedMass > 1.000001) throw new Error('Invalid token probabilities from model');

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
