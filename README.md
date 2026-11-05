# MINDREADER

An interactive app for exploring model tokens and testing how short clues change a model's rating of a story prompt.

## What the numbers mean

### Mode 1: Guess the Next Token

The server asks `gpt-4o-mini` to continue a starting prompt and requests up to five generated tokens with log probabilities. Each round asks you to identify the token the model actually generated at that position in **the same response**. A token can be a word, a word fragment, punctuation, or whitespace. The game marks spaces as `␠` and newlines as `↵` in choices and tables.

After each guess, the table shows all alternatives returned by the API for that token position, plus the sampled token if it was outside the returned top list. Each probability is `exp(logprob)`. **All other tokens** is the remaining probability mass. The displayed values are rounded to tenths of a percent and allocated so the table totals 100.0%. The app does not rescale the listed tokens to pretend they are the entire distribution.

These likelihoods are conditional on the app's continuation instruction, the prompt, and the tokens already generated. They are not a universal probability for the next word of the starting sentence. The score at the end is simply the fraction of generated tokens you guessed correctly.

### Mode 2: Find the Hidden Concept

The app chooses a concept, shows a starting passage, and lets you add up to ten short nudges. After a baseline rating and each nudge, the model gives a **fit score from 0 to 100** for how strongly the passage points toward the concept. This is a subjective model rating, **not a measured probability** that the concept will appear in a future continuation. The scores across turns are independent ratings and do not add to 100.

The app does not secretly generate a narrative. The displayed passage consists of the starting prompt and your nudges. Typing the exact hidden concept in a nudge wins; otherwise the concept is revealed after ten turns or when you end the game. Scores can vary between model calls, so a change does not prove that a nudge caused it. The target is hidden from the normal interface, though it is sent to the server for scoring and is not protected against browser inspection.

## Running the app

The static frontend calls a Vercel serverless function at `api/chat`. Configure `OPENAI_API_KEY` in the Vercel project and deploy the repository. The key stays on the server; users do not enter one. See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment steps.

For local testing, install dependencies and use `vercel dev` with a development `OPENAI_API_KEY`. A plain static file server cannot run `api/chat`.

## Configuration and usage

- Starting prompts, round count, target concepts, and nudge limit are in `js/config.js`.
- The model and request parameters are in `api/chat.js`. Mode 1 requests 10 alternative tokens per position and uses temperature 0.
- Mode 1 makes one model call per game. Mode 2 makes one call for the baseline, one per submitted nudge, and one optional analysis call at the end. Check the OpenAI Usage Dashboard for actual costs.

## Source of token probabilities

The [OpenAI Chat Completions API reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create) describes `logprobs`, `top_logprobs`, the generated token, and the fact that fewer alternatives than requested may be returned.
