/** Browser requests to the serverless OpenAI endpoint. */

import { CONFIG } from './config.js';
import { readTokenPosition } from './token-math.js';

async function callTask(task, inputs = {}) {
  // Relative to the app directory, so /mindreader/ works as well as /.
  const response = await fetch('api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, ...inputs })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429) throw new Error('RATE_LIMIT');
    if (response.status === 401) throw new Error('INVALID_API_KEY');
    if (errorData.error === 'MODEL_UNAVAILABLE') throw new Error('MODEL_UNAVAILABLE');
    throw new Error(`API Error: ${errorData.error || response.statusText}`);
  }
  return response.json();
}

export async function getTokenSequence(prompt, count = CONFIG.mode1.rounds) {
  const response = await callTask('tokenSequence', { prompt, count });
  const positions = response?.choices?.[0]?.logprobs?.content;
  if (!Array.isArray(positions) || positions.length === 0) {
    throw new Error('The model did not return token probabilities');
  }
  return positions.map(readTokenPosition);
}

/** This is a model rating of target fit, not an event probability. */
export async function getTargetFitScore(context, target) {
  const response = await callTask('targetFitScore', { context, target });
  const content = response?.choices?.[0]?.message?.content?.trim();
  if (!/^(100|[1-9]?\d)%?$/.test(content || '')) {
    throw new Error('The model returned an invalid fit score');
  }
  return Number.parseInt(content, 10);
}

export async function generateNudgeAnalysis(startingPrompt, nudges, scores, target, won) {
  const response = await callTask('nudgeAnalysis', {
    startingPrompt,
    nudges,
    scores,
    target,
    won
  });
  const content = response?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('The model did not return analysis');
  return content;
}
