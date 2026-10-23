/**
 * Vercel Serverless Function - task-based OpenAI API endpoint
 */

import OpenAI from 'openai';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const MODEL = 'gpt-3.5-turbo';
const DEFAULT_ALLOWED_ORIGINS = 'https://www.kiang.net,https://kiang.net,http://localhost:3000';
const memoryRateLimits = new Map();
let upstashLimiters;

function getAllowedOrigins() {
  return new Set((process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
    .split(',').map(origin => origin.trim()).filter(Boolean));
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  return typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : 'unknown';
}

function getUpstashLimiters() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!upstashLimiters) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });
    upstashLimiters = {
      minute: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '60 s'),
        prefix: 'mindreader:minute'
      }),
      day: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(300, '1 d'),
        prefix: 'mindreader:day'
      })
    };
  }
  return upstashLimiters;
}

async function isRateLimited(ip) {
  const limiters = getUpstashLimiters();
  if (limiters) {
    const [minute, day] = await Promise.all([
      limiters.minute.limit(ip),
      limiters.day.limit(ip)
    ]);
    return !minute.success || !day.success;
  }

  // This fallback is per-instance and best-effort only; serverless instances do not share memory.
  const now = Date.now();
  const entry = memoryRateLimits.get(ip);
  if (!entry || now - entry.startedAt >= 60_000) {
    memoryRateLimits.set(ip, { count: 1, startedAt: now });
    return false;
  }
  entry.count += 1;
  return entry.count > 30;
}

function readString(value, name, maxLength) {
  if (typeof value !== 'string') throw new Error(`${name} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new Error(`${name} is too long`);
  return trimmed;
}

function readNumberArray(value, name) {
  if (!Array.isArray(value) || value.length > 15 ||
      value.some(item => typeof item !== 'number' || !Number.isFinite(item))) {
    throw new Error(`${name} must contain at most 15 finite numbers`);
  }
  return value;
}

function buildTaskRequest(body) {
  switch (body.task) {
    case 'nextToken': {
      const prompt = readString(body.prompt, 'prompt', 2000);
      return {
        messages: [{
          role: 'user',
          content: `Continue this sentence with natural text. Only provide the continuation, no explanation: "${prompt}"`
        }],
        temperature: 0,
        max_tokens: 1,
        logprobs: true,
        top_logprobs: Math.max(1, Math.min(20, 10))
      };
    }
    case 'continuation': {
      const prompt = readString(body.prompt, 'prompt', 2000);
      if (typeof body.tokens !== 'number' || !Number.isFinite(body.tokens)) {
        throw new Error('tokens must be a finite number');
      }
      return {
        messages: [{ role: 'user', content: `Continue this narrative naturally: "${prompt}"` }],
        temperature: 0.3,
        max_tokens: Math.max(1, Math.min(50, Math.trunc(body.tokens)))
      };
    }
    case 'targetLogprobs': {
      const context = readString(body.context, 'context', 2000);
      readString(body.target, 'target', 100);
      return {
        messages: [{ role: 'user', content: `Continue this narrative: "${context}"` }],
        temperature: 0.3,
        max_tokens: 5,
        logprobs: true,
        top_logprobs: 20
      };
    }
    case 'probabilityEstimate': {
      const context = readString(body.context, 'context', 2000);
      const target = readString(body.target, 'target', 100);
      return {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that estimates probabilities. Respond with only a number between 0 and 100.'
          },
          {
            role: 'user',
            content: `Given the context below, estimate the probability (0-100) that the concept "${target}" will naturally appear or be implied in the next 20 tokens of the narrative continuation.\n\nContext: "${context}"\n\nRespond with only a number.`
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      };
    }
    case 'nudgeAnalysis': {
      const startingPrompt = readString(body.startingPrompt, 'startingPrompt', 2000);
      const target = readString(body.target, 'target', 100);
      if (!Array.isArray(body.nudges) || body.nudges.length > 15) {
        throw new Error('nudges must contain at most 15 items');
      }
      const nudges = body.nudges.map((nudge, index) =>
        readString(nudge, `nudges[${index}]`, 100));
      const probabilities = readNumberArray(body.probabilities, 'probabilities');
      if (typeof body.won !== 'boolean') throw new Error('won must be a boolean');

      let narrative = startingPrompt;
      const nudgeDetails = nudges.map((nudge, index) => {
        const prevProb = probabilities[index] || 0;
        const newProb = probabilities[index + 1] || 0;
        const change = newProb - prevProb;
        narrative += ' ' + nudge;
        return `Turn ${index + 1}: "${nudge}" → Probability changed from ${Math.round(prevProb)}% to ${Math.round(newProb)}% (${change > 0 ? '+' : ''}${Math.round(change)}%)`;
      }).join('\n');

      return {
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing narrative steering and language model behavior. Provide insightful, specific feedback directly to the user about how effectively they steered the narrative toward the target concept. Always use second person (you, your) when addressing the user. Remember: the user did NOT know the target concept at the start - they had to discover it through experimentation and probability feedback.'
          },
          {
            role: 'user',
            content: `Analyze this attempt to steer an AI narrative toward a HIDDEN target concept.

CRITICAL CONTEXT: The user did NOT know the target "${target}" at the beginning. They had to figure it out by observing how their nudges affected the probability meter. The challenge was to infer the hidden target while simultaneously steering toward it.

Starting prompt: "${startingPrompt}"

The user's nudges and probability feedback:
${nudgeDetails}

Final narrative: "${narrative}"

${body.won ? 'The user successfully reached 100% probability and discovered the target!' : `The user reached ${Math.round(probabilities[probabilities.length - 1])}% probability but did not hit 100%.`}

Provide a personalized analysis speaking directly to the user in second person with:
1. **Overall Strategy**: Assess their detective work and steering approach (2-3 sentences). Consider how well they used probability feedback to infer the target and adapt their strategy. Talk TO them using "you" and "your".
2. **Most Effective Nudge**: Identify which of their nudges had the biggest positive impact and explain why it worked in moving toward the hidden target. Address them directly.
3. **Least Effective Nudge**: Identify which nudge was least helpful in the context of discovering and steering toward the unknown target. Explain why. Use second person.
4. **Key Insight**: One specific learning point about the challenge of steering AI narratives when you don't know the destination. Frame it as something they discovered or should understand.
5. **Suggestion**: One concrete suggestion for how they could improve their detective work and steering next time. Give direct advice using "you should" or similar.

IMPORTANT:
- Write the entire analysis in second person, as if you're speaking directly to the user. Use "you", "your", "you're" throughout. Never use "the user" or "they/their" - always address the user directly.
- Remember they were DISCOVERING the target, not just steering toward a known goal.
- Praise good detective work when they adapted their nudges based on probability changes.
- Don't criticize them for "deviating" - they were EXPLORING to figure out what the target was.

Keep the tone encouraging but analytical. Be specific about semantic relationships and why certain words/phrases moved the probability.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      };
    }
    case 'ping':
      return {
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 5
      };
    default:
      throw new Error('Unknown task');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Origin checks are only a speed bump, not real authentication, because scripts can fake Origin.
  const origin = req.headers.origin;
  if (!origin || !getAllowedOrigins().has(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    if (await isRateLimited(getClientIp(req))) {
      return res.status(429).json({ error: 'RATE_LIMIT' });
    }
  } catch (error) {
    console.error('Rate limiter error:', error);
    return res.status(500).json({ error: 'Server error' });
  }

  let taskRequest;
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw new Error('Request body must be an object');
    }
    taskRequest = buildTaskRequest(req.body);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({ model: MODEL, ...taskRequest });
    return res.status(200).json(response);
  } catch (error) {
    console.error('OpenAI API Error:', error);
    if (error.status === 429) return res.status(429).json({ error: 'RATE_LIMIT' });
    if (error.status === 401) return res.status(401).json({ error: 'INVALID_API_KEY' });
    return res.status(500).json({ error: 'Server error' });
  }
}
