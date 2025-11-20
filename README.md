# MINDREADER - Next-Token Prediction Simulator

An interactive web application that teaches users how language models predict and select next tokens in text sequences. Built with vanilla HTML, CSS, and JavaScript.

## Features

### Mode 1: "Guess the Next Token"
- Predict which token an AI is most likely to choose next
- See real probability distributions from the language model
- Learn how AI favors common, safe continuations
- Track your score across multiple rounds

### Mode 2: "Steer the Hidden Narrative"
- Try to guide an AI narrative toward a hidden target concept
- Insert "nudges" to influence the model's direction
- Watch the probability meter respond to your inputs
- Experience how difficult it is to steer AI without explicit signals

## Quick Start

### For Educators (Recommended)

**Deploy to Vercel with Secure API Key Management:**

1. Get an OpenAI API key at https://platform.openai.com/api-keys
2. Follow the comprehensive **[Deployment Guide](DEPLOYMENT.md)** to deploy to Vercel
3. Share the deployed URL with your students
4. Students can use the app without needing their own API keys! 🎉

This approach keeps your API key secure on the server side and allows all students to access the app. 

### For Local Development/Testing

1. Clone or download this repository
2. Serve the files using a local HTTP server (required for ES6 modules):
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser
4. For testing, you'll need to temporarily add API key handling back (see DEPLOYMENT.md)

## Project Structure

```
mindreader/
├── index.html          # Main HTML file
├── api/
│   └── chat.js         # Vercel serverless function (proxies to OpenAI)
├── css/
│   └── styles.css      # All styling (mobile-first, responsive)
├── js/
│   ├── main.js         # App initialization and coordination
│   ├── config.js       # Configuration constants
│   ├── api.js          # Frontend API calls (calls /api/chat)
│   ├── ui.js           # DOM manipulation helpers
│   ├── mode1.js        # "Guess the Next Token" game logic
│   └── mode2.js        # "Steer the Hidden Narrative" game logic
├── vercel.json         # Vercel deployment configuration
├── .env.example        # Example environment variables
├── DEPLOYMENT.md       # Comprehensive deployment guide
└── README.md           # This file
```

## Configuration

You can customize game settings in `js/config.js`:

### Mode 1 Settings
- `rounds`: Number of rounds per game (default: 5)
- `logprobCount`: Number of token probabilities to fetch (default: 10)
- `temperature`: AI temperature setting (default: 0.2)

### Mode 2 Settings
- `maxTurns`: Maximum number of nudge attempts (default: 10)
- `maxNudgeWords`: Maximum words per nudge (default: 6)
- `targets`: List of possible hidden target concepts

### API Settings
- `model`: OpenAI model to use (default: "gpt-3.5-turbo")
- Change to "gpt-4" for better results (higher cost)

## Usage

### Mode 1: Guess the Next Token
1. Click "Start Game"
2. Read the text fragment
3. Choose which token you think the AI will select
4. See if you were correct and view the probability distribution
5. Continue for 5 rounds
6. Review your score and insights

### Mode 2: Steer the Hidden Narrative
1. Click "Start Game"
2. Try to infer what the hidden target concept might be
3. Type short nudges (max 6 words) to steer the narrative
4. Watch the probability meter respond
5. Try to reach 100% probability within 10 turns
6. See the hidden target and review your approach

## Educational Objectives

This tool helps users understand:
- How language models predict text token-by-token
- Why LLMs favor high-frequency, safe continuations
- The difficulty of steering AI outputs without explicit signals
- Probability distributions and model "momentum"
- Token-level prediction vs. high-level concepts

## API Costs

This application makes API calls to OpenAI for each interaction:
- Mode 1: ~5-10 calls per game (one per round)
- Mode 2: ~10-20 calls per game (initial + each nudge)

Using GPT-3.5-turbo, each game typically costs less than $0.01. Monitor your usage at https://platform.openai.com/usage.

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Notes

✅ **Secure Architecture:** This application uses Vercel serverless functions to keep your API key secure on the server side. Students never see or handle the API key.

**Security Features:**
- API key stored as Vercel environment variable (server-side only)
- No API key in frontend code or browser
- HTTPS encryption by default
- Optional rate limiting and access codes (see DEPLOYMENT.md)

For production deployment, see **[DEPLOYMENT.md](DEPLOYMENT.md)** for additional security options like rate limiting and access codes.

## Troubleshooting

### "Server configuration error"
- Ensure `OPENAI_API_KEY` environment variable is set in Vercel
- Check that the key is valid and starts with "sk-"
- Redeploy after adding/updating environment variables

### "Invalid API key" or "API Error"
- Verify your OpenAI API key in Vercel environment variables
- Check that your key is active at https://platform.openai.com/api-keys
- Ensure you have available API credits
- Check Vercel function logs for detailed error messages

### "Rate limit reached" error
- OpenAI rate limit reached - wait a few moments
- Check your rate limits at https://platform.openai.com/account/limits
- Consider implementing rate limiting (see DEPLOYMENT.md)

### Slow responses
- Consider using GPT-3.5-turbo instead of GPT-4 for faster responses
- Check your internet connection
- Check Vercel function performance in dashboard

### UI not loading
- Ensure JavaScript is enabled in your browser
- Check the browser console for errors (F12)
- Verify deployment succeeded in Vercel dashboard

## Future Enhancements

Potential additions (not in current version):
- Dark mode
- Teacher dashboard with aggregated results
- Shareable challenge links
- Session export to JSON
- Free play mode with real-time probability display
- Advanced rate limiting with Redis/Vercel KV

## License

MIT License - Feel free to use and modify for educational purposes.

## Contributing

This is an educational project. Contributions, suggestions, and feedback are welcome!

## Acknowledgments

Built following vanilla JavaScript best practices with ES6 modules. No frameworks or dependencies required.
