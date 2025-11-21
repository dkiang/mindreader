/**
 * Vercel Serverless Function - Simple OpenAI API Proxy
 * This function proxies OpenAI chat completion requests
 */

import OpenAI from "openai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variable
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('OPENAI_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { messages, temperature, max_tokens, logprobs, top_logprobs } = req.body;

    // Validate request body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages required' });
    }

    // Initialize OpenAI client
    const client = new OpenAI({
      apiKey: apiKey
    });

    // Build OpenAI request
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: temperature !== undefined ? temperature : 0.7,
      max_tokens: max_tokens || 50
    };

    // Add logprobs if requested
    if (logprobs) {
      requestBody.logprobs = logprobs;
      if (top_logprobs) {
        requestBody.top_logprobs = top_logprobs;
      }
    }

    // Make request to OpenAI
    const response = await client.chat.completions.create(requestBody);

    // Return the full OpenAI response
    return res.status(200).json(response);

  } catch (error) {
    console.error('OpenAI API Error:', error);

    // Handle specific error types
    if (error.status === 429) {
      return res.status(429).json({ error: 'RATE_LIMIT' });
    } else if (error.status === 401) {
      return res.status(401).json({ error: 'INVALID_API_KEY' });
    } else {
      return res.status(500).json({
        error: error.message || 'OpenAI API error'
      });
    }
  }
}
