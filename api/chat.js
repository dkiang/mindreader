/**
 * Vercel Serverless Function - OpenAI API Proxy
 * This function securely proxies requests to OpenAI API
 * while keeping the API key secret on the server side
 */

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

  // Rate limiting (optional but recommended)
  // Simple IP-based rate limiting - can be enhanced with Redis/Vercel KV
  const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

  try {
    const { messages, temperature, max_tokens, logprobs, top_logprobs } = req.body;

    // Validate request body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages required' });
    }

    // Build OpenAI request
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: temperature !== undefined ? temperature : 0.7,
      max_tokens: max_tokens || 50
    };

    // Add logprobs if requested (for Mode 1)
    if (logprobs) {
      requestBody.logprobs = logprobs;
      if (top_logprobs) {
        requestBody.top_logprobs = top_logprobs;
      }
    }

    // Make request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error:', data);

      // Handle specific error types
      if (response.status === 429) {
        return res.status(429).json({ error: 'RATE_LIMIT' });
      } else if (response.status === 401) {
        return res.status(401).json({ error: 'INVALID_API_KEY' });
      } else {
        return res.status(response.status).json({
          error: data.error?.message || 'OpenAI API error'
        });
      }
    }

    // Log usage for monitoring (optional)
    console.log(`Request from ${clientIP}: ${messages[0]?.role || 'unknown'} - ${response.status}`);

    // Return successful response
    return res.status(200).json(data);

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
