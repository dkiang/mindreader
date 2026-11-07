# Deploying MINDREADER

MINDREADER is a static site with a Vercel serverless function at `api/chat`. The browser sends game tasks to that function, which calls OpenAI with a server-side API key.

## Setup

1. Import this repository into a Vercel project.
2. In the Vercel project's environment variables, set `OPENAI_API_KEY` for Production. Also set it for Preview and Development if you use those environments.
3. Deploy the project. Redeploy after changing environment variables so the function uses the new values.
4. Open the deployed site and play a Mode 1 round. The model's returned alternatives and an **All other tokens** row should total 100.0%.

The frontend calls `api/chat` relative to the page URL, so a deployment under `/mindreader/` calls `/mindreader/api/chat`.

## Optional environment variables

- `ALLOWED_ORIGINS`: Comma-separated allowed browser origins. The default allows `https://www.kiang.net`, `https://kiang.net`, and `http://localhost:3000`. The deployment's own Vercel URL is also allowed for preview testing. Set this when using a different domain.
- `OPENAI_MODEL`: Overrides the default model, currently `gpt-4o-mini`. Keep a compatible Chat Completions text model if you change it.
- `OPENAI_TOKEN_SEQUENCE_MODEL`: Optional override just for Mode 1. Only set this after verifying the model supports `logprobs` and `top_logprobs`; otherwise Mode 1 will show "Unable to load model tokens."
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: When both are set, the function enforces 30 requests per IP per minute and 300 per IP per day using Upstash. Without them, it enforces a best-effort 30 requests per IP per minute in each serverless instance's memory.

The origin check limits ordinary cross-site browser requests but does not authenticate users. A script can set its own `Origin` header. The IP limits may affect many students behind one school network address; adjust the limits in `api/chat.js` if that is your use case.

## What is billed

- Mode 1: one Chat Completions request for up to ten generated tokens and their token likelihoods, with up to five visible rounds.
- Mode 2: one request for the starting fit score, two for each story move (continuation and fit score), and an optional analysis request at the end.

Check the OpenAI Usage Dashboard for current charges. The model is configured in `api/chat.js`, defaults to `gpt-4o-mini`, and can be overridden with `OPENAI_MODEL`.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `Server configuration error` | `OPENAI_API_KEY` is absent in the deployment environment. |
| `INVALID_API_KEY` | The deployed key was rejected by OpenAI. |
| `MODEL_UNAVAILABLE` | The configured model is unavailable to the deployment's API project. |
| `RATE_LIMIT` | The app's IP limit or an OpenAI limit was reached. |
| Generic server error | Inspect the Vercel function logs for `api/chat`; the browser receives a deliberately generic error. |

The key is not included in frontend files. Do not add it to `js/`, `index.html`, or a public repository.
