/**
 * Configuration settings for MINDREADER
 * All game parameters and constants are defined here
 */

export const CONFIG = {
  // Mode 1 Settings - "Guess the Next Token"
  mode1: {
    rounds: 5,                    // Number of rounds per game
    logprobCount: 10,             // Number of logprobs to request from API
    temperature: 0,               // Temperature 0 = deterministic (always chooses #1 token)

    // Token selection thresholds for creating 4 options
    tokenSelection: {
      top: 1,                     // Always include rank #1
      midMin: 2,                  // Mid-prob token: ranks 2-5
      midMax: 5,
      lowMin: 6,                  // Low-but-plausible: ranks 6-15
      lowMax: 15,
      veryLowMin: 20,             // Very unlikely: rank 20+
      veryLowMax: 50
    },

    // Starting prompts for Mode 1
    startingPrompts: [
      "The stock market was about to",
      "After years of research, the scientist finally",
      "The door creaked open and inside they found",
      "On the first day of school, the teacher",
      "The detective looked at the evidence and",
      "When the phone rang at midnight, she",
      "The ancient map revealed a path to",
      "As the storm approached, the captain decided to"
    ]
  },

  // Mode 2 Settings - "Steer the Hidden Narrative"
  mode2: {
    maxTurns: 10,                 // Maximum number of user turns
    silentTokens: 30,             // Length of silent model continuation
    maxNudgeWords: 6,             // Maximum words in a user nudge
    temperature: 0.3,             // Temperature for narrative generation

    // Target concepts to be guessed
    targets: [
      "accident",
      "argument",
      "apology",
      "confession",
      "crime",
      "surprise",
      "revelation",
      "betrayal",
      "discovery",
      "reunion"
    ],

    // Starting prompts for Mode 2
    startingPrompts: [
      "Sarah walked into the office that morning, not knowing that",
      "The letter had been sitting unopened for three days. When he finally read it,",
      "They had been friends for years, but tonight something felt different.",
      "The phone call came at exactly 9:47 PM. The voice on the other end said,",
      "She found the old photograph in the attic. It showed",
      "The meeting was supposed to be routine, but then someone mentioned"
    ],

    // Probability increase thresholds for feedback
    feedback: {
      strongIncrease: 15,         // >= 15% increase
      smallIncrease: 5,           // >= 5% increase
      smallDecrease: -5,          // <= -5% decrease
      strongDecrease: -15         // <= -15% decrease
    },

    // Probability calculation settings
    calculation: {
      lookAheadTokens: 20,        // How many tokens ahead to check
      semanticThreshold: 0.6      // Threshold for semantic similarity (0-1)
    }
  },

  // OpenAI API Settings
  api: {
    model: "gpt-3.5-turbo",       // Model to use (can be changed to gpt-4)
    maxTokens: 50,                // Maximum tokens per generation
    endpoint: "https://api.openai.com/v1/chat/completions"
  },

  // UI Settings
  ui: {
    animationDuration: 300,       // Duration for animations (ms)
    minLoadingTime: 500,          // Minimum time to show loading state (ms)
    feedbackDisplayTime: 2000     // How long to show feedback messages (ms)
  },

  // Local Storage Keys
  storage: {
    apiKey: "mindreader_api_key"
  }
};

// Helper function to get a random item from an array
export function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get a random starting prompt for a mode
export function getRandomPrompt(mode) {
  if (mode === 'mode1') {
    return getRandomItem(CONFIG.mode1.startingPrompts);
  } else if (mode === 'mode2') {
    return getRandomItem(CONFIG.mode2.startingPrompts);
  }
  return '';
}

// Helper function to validate API key format
export function isValidApiKey(key) {
  return typeof key === 'string' && key.startsWith('sk-') && key.length > 20;
}

// Helper function to count words in a string
export function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Helper function to format probability as percentage
export function formatProbability(prob) {
  return `${(prob * 100).toFixed(1)}%`;
}

// Helper function to clamp a value between min and max
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
