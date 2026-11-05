# MINDREADER

An interactive app for exploring model tokens and collaboratively steering a short story.

## What the numbers mean

### Mode 1: Guess the Next Token

The server asks `gpt-4o-mini` to continue a starting prompt and requests up to ten generated tokens with log probabilities. Each round asks you to identify the visible text of the token the model actually generated at that position in **the same response**. A token can be a word, a word fragment, or punctuation. Space-only tokens are skipped as rounds. Leading spaces are hidden, and alternatives that differ only by leading spaces share one choice and one probability row.

After each guess, the table shows the visible alternatives returned by the API for that token position, plus the sampled token if it was outside the returned top list. Each raw token probability is `exp(logprob)`; probabilities of alternatives with the same visible text are added. **All other tokens** includes the remaining probability mass and any space-only alternatives. The displayed values are rounded to tenths of a percent and allocated so the table totals 100.0%. The app does not rescale the listed tokens to pretend they are the entire distribution. The model's generated choice is labeled only when it is not the highest-probability visible choice.

These likelihoods are conditional on the app's continuation instruction, the prompt, and the tokens already generated. They are not a universal probability for the next word of the starting sentence. The score at the end is simply the fraction of visible token choices you guessed correctly.

### Mode 2: Steer the Story

The app shows a story goal from the beginning. You can write a move of up to 20 words, choose an idea to get started, and play up to six turns. After each move, a model that does not receive the goal writes one sentence showing a consequence of your move. The story visibly changes whether or not its rating changes.

A separate model call gives a **fit score from 0 to 100** for how strongly the whole story points toward the visible goal. This is a subjective rating, **not a measured probability** that the goal will appear in a future continuation. The scorer is instructed to use the full range rather than only 25-point steps, but scores can still remain flat or vary between calls. A score change describes the combined player move and AI continuation; it is not proof that one phrase alone caused the change. Reaching 80/100 after a turn ends the game early. The summary includes the player's moves, the AI's continuations, and a specific example of how the story changed. An optional AI analysis is prompted to recognize that the player knew the goal throughout.

## Running the app

The static frontend calls a Vercel serverless function at `api/chat`. Configure `OPENAI_API_KEY` in the Vercel project and deploy the repository. The key stays on the server; users do not enter one. See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment steps.

For local testing, install dependencies and use `vercel dev` with a development `OPENAI_API_KEY`. A plain static file server cannot run `api/chat`.

## Configuration and usage

- Starting prompts, round count, story goals, ideas, and move limit are in `js/config.js`.
- The model and request parameters are in `api/chat.js`. Mode 1 requests 10 alternative tokens per position and uses temperature 0.
- Mode 1 makes one model call per game. Mode 2 makes one call for the baseline, two per submitted story move (continuation and rating), and one optional analysis call at the end. Check the OpenAI Usage Dashboard for actual costs.

## Source of token probabilities

The [OpenAI Chat Completions API reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create) describes `logprobs`, `top_logprobs`, the generated token, and the fact that fewer alternatives than requested may be returned.
