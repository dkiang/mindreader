import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { mode, prompt, target } = req.body;

    if (!mode || !prompt) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // -----------------------------
    // MODE 1 — Next-token prediction
    // -----------------------------
    if (mode === "mode1") {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1,
        temperature: 0,
        logprobs: true,
        top_logprobs: 10
      });

      const choice = response.choices[0];
      const logprobs = choice.logprobs.content[0];

      const topToken = logprobs.top_logprobs[0].token;
      const topLogProbList = logprobs.top_logprobs;

      return res.status(200).json({
        type: "mode1",
        topToken,
        tokenDistribution: topLogProbList,
        raw: response
      });
    }

    // -----------------------------
    // MODE 2 — Probability estimation
    // -----------------------------
    if (mode === "mode2") {
      if (!target) {
        return res.status(400).json({
          error: "Mode2 requires a target concept."
        });
      }

      // We ask the LLM to estimate the probability (0–100)
      const probabilityPrompt = `
Given the context below, estimate the probability (0–100%) that the concept "${target}" will appear in the next 20 tokens of the model's natural continuation. Respond ONLY with a number.

Context:
${prompt}
`;

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: probabilityPrompt }],
        max_tokens: 5,
        temperature: 0.2
      });

      const text = response.choices[0].message.content.trim();
      const percent = parseInt(text.replace(/[^0-9]/g, ""), 10);

      const safePercent = isNaN(percent) ? 0 : Math.min(100, Math.max(0, percent));

      return res.status(200).json({
        type: "mode2",
        probability: safePercent,
        rawResponse: text
      });
    }

    return res.status(400).json({ error: "Invalid mode." });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
}
