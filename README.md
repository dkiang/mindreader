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

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- An OpenAI API key (get one at https://platform.openai.com/api-keys)

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Enter your OpenAI API key when prompted
4. Start learning!

**Note:** This is a fully client-side application - no server required. Your API key is stored locally in your browser and is only sent to OpenAI's servers.

## Project Structure

```
mindreader/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styling (mobile-first, responsive)
├── js/
│   ├── main.js         # App initialization and coordination
│   ├── config.js       # Configuration constants
│   ├── api.js          # OpenAI API integration
│   ├── ui.js           # DOM manipulation helpers
│   ├── mode1.js        # "Guess the Next Token" game logic
│   └── mode2.js        # "Steer the Hidden Narrative" game logic
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

⚠️ **Important:** This application stores your API key in browser localStorage. For production use, consider:
- Moving to a backend server to keep API keys secure
- Implementing proper authentication
- Adding rate limiting

## Troubleshooting

### "Invalid API key" error
- Verify your API key starts with "sk-"
- Check that your key is active at https://platform.openai.com/api-keys
- Ensure you have available API credits

### "Rate limit reached" error
- Wait a few seconds before trying again
- Check your rate limits at https://platform.openai.com/account/limits

### Slow responses
- Consider using GPT-3.5-turbo instead of GPT-4 for faster responses
- Check your internet connection

### UI not loading
- Ensure JavaScript is enabled in your browser
- Check the browser console for errors (F12)
- Make sure all files are in the correct directory structure

## Future Enhancements

Potential additions (not in current version):
- Dark mode
- Teacher dashboard with aggregated results
- Shareable challenge links
- Session export to JSON
- Free play mode with real-time probability display
- Backend server for secure API key management

## License

MIT License - Feel free to use and modify for educational purposes.

## Contributing

This is an educational project. Contributions, suggestions, and feedback are welcome!

## Acknowledgments

Built following vanilla JavaScript best practices with ES6 modules. No frameworks or dependencies required.
