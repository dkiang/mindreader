# MINDREADER Deployment Guide

This guide explains how to deploy MINDREADER to Vercel with serverless functions that securely handle your OpenAI API key.

## Architecture

The app now uses a **backend proxy architecture**:

```
Students → Frontend (HTML/CSS/JS) → Vercel Serverless Function → OpenAI API
                                    (stores your API key securely)
```

**Benefits:**
- ✅ Your API key is never exposed to students
- ✅ Students don't need their own API keys
- ✅ You can monitor and control usage
- ✅ Rate limiting can be added if needed

---

## Prerequisites

1. **Vercel Account** (free): [Sign up at vercel.com](https://vercel.com)
2. **OpenAI API Key**: [Get from OpenAI Platform](https://platform.openai.com/api-keys)
3. **Git/GitHub**: Code should be in a GitHub repository

---

## Deployment Steps

### Step 1: Push Code to GitHub

If you haven't already, push this code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit of MINDREADER"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mindreader.git
git push -u origin main
```

### Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (`mindreader`)
4. Vercel will automatically detect the configuration

### Step 3: Configure Environment Variables

**IMPORTANT:** Before deploying, add your OpenAI API key:

1. In the Vercel project settings, go to **"Environment Variables"**
2. Add a new variable:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key (starts with `sk-...`)
   - **Environments:** Select all (Production, Preview, Development)
3. Click **"Save"**

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete (~2 minutes)
3. Visit your live URL: `https://your-project-name.vercel.app`

---

## Testing Your Deployment

1. Open your deployed app URL
2. Click **"Start Game"** for Mode 1
3. Try playing a round
4. If everything works, your API key is configured correctly! 🎉

### Troubleshooting

**If you see "references Secret which does not exist":**
- This is already fixed in the latest `vercel.json` (no `env` section needed)
- Environment variables added through the dashboard are automatically available
- Redeploy after pushing the updated `vercel.json`

**If you see "Server configuration error":**
- Check that `OPENAI_API_KEY` environment variable is set in Vercel
- Make sure the key starts with `sk-` and is complete
- Redeploy after adding the environment variable
- Verify it's added to all environments (Production, Preview, Development)

**If you see "API Error":**
- Verify your OpenAI API key is valid
- Check your OpenAI account has available credits
- Check Vercel function logs: Project Settings → Functions → View logs

---

## File Structure

```
mindreader/
├── api/
│   └── chat.js              # Serverless function (proxies to OpenAI)
├── js/
│   ├── main.js              # App initialization
│   ├── api.js               # Frontend API calls (now calls /api/chat)
│   ├── mode1.js             # Mode 1 game logic
│   ├── mode2.js             # Mode 2 game logic
│   ├── ui.js                # UI helpers
│   └── config.js            # Configuration
├── css/
│   └── styles.css           # Styles
├── index.html               # Entry point
├── vercel.json              # Vercel configuration
└── .env.example             # Example environment variables
```

---

## Security Features

### Current Implementation:
- ✅ API key stored as Vercel environment variable (server-side only)
- ✅ No API key in frontend code
- ✅ HTTPS encryption by default (Vercel)
- ✅ Error messages don't expose sensitive info

### Optional Enhancements:

#### 1. **Rate Limiting** (Prevent Abuse)

Add to `api/chat.js`:

```javascript
// Simple in-memory rate limiting (resets on function restart)
const requestCounts = new Map();
const RATE_LIMIT = 50; // requests per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

export default async function handler(req, res) {
  const clientIP = req.headers['x-forwarded-for'] || 'unknown';

  // Check rate limit
  const now = Date.now();
  const record = requestCounts.get(clientIP) || { count: 0, resetTime: now + RATE_WINDOW };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + RATE_WINDOW;
  }

  if (record.count >= RATE_LIMIT) {
    return res.status(429).json({ error: 'RATE_LIMIT' });
  }

  record.count++;
  requestCounts.set(clientIP, record);

  // ... rest of function
}
```

#### 2. **Access Code** (School-Only Access)

Add to `api/chat.js`:

```javascript
const VALID_ACCESS_CODE = process.env.STUDENT_ACCESS_CODE || 'school2024';

export default async function handler(req, res) {
  const accessCode = req.headers['x-access-code'];

  if (accessCode !== VALID_ACCESS_CODE) {
    return res.status(403).json({ error: 'Invalid access code' });
  }

  // ... rest of function
}
```

Then update frontend to include the code:
```javascript
// js/api.js
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Access-Code': 'school2024'  // Students need this code
  },
  body: JSON.stringify(requestBody)
});
```

#### 3. **Usage Logging** (Monitor Costs)

The serverless function already logs basic usage:
```javascript
console.log(`Request from ${clientIP}: ${messages[0]?.role || 'unknown'} - ${response.status}`);
```

View logs in Vercel:
- Go to your project → **Functions** tab
- Click on `/api/chat` → **View Logs**

---

## Cost Management

### Estimated Costs (OpenAI GPT-3.5-turbo)

- **Mode 1** (Guess the Next Token): ~$0.001 per round
- **Mode 2** (Steer the Hidden Narrative): ~$0.002 per round

**For 100 students:**
- Each playing 10 rounds of Mode 1 = 1,000 rounds × $0.001 = **$1.00**
- Each playing 5 rounds of Mode 2 = 500 rounds × $0.002 = **$1.00**
- **Total: ~$2-5** depending on usage

### Monitor Usage:
1. Check [OpenAI Usage Dashboard](https://platform.openai.com/usage)
2. Set usage limits in OpenAI account settings
3. Consider implementing rate limiting (see above)

---

## Updating Your Deployment

When you make changes to the code:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel will automatically redeploy! 🚀

---

## Custom Domain (Optional)

1. Go to Vercel project → **Settings** → **Domains**
2. Add your custom domain (e.g., `mindreader.yourschool.edu`)
3. Follow DNS configuration instructions
4. Students can access via your custom URL

---

## Support

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Server configuration error" | Add `OPENAI_API_KEY` to Vercel env vars |
| "RATE_LIMIT" error | OpenAI rate limit reached; wait a moment |
| "INVALID_API_KEY" | Check API key in Vercel settings |
| App not loading | Check browser console for errors |

**Need Help?**
- Check Vercel function logs
- Review OpenAI API status: [status.openai.com](https://status.openai.com)
- Verify environment variables are set correctly

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test with students
3. 🎯 Monitor usage and costs
4. 🎯 Add rate limiting if needed
5. 🎯 Consider custom domain for branding

Enjoy teaching your students about AI! 🎓
