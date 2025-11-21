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
      "As the storm approached, the captain decided to",
      "The package arrived three days late and contained",
      "Breaking news: scientists have discovered that",
      "The restaurant critic took one bite and",
      "In the final seconds of the game, the player",
      "The email attachment wouldn't open until she",
      "According to the weather forecast, tomorrow will be",
      "The job interview was going well until the manager",
      "His grandmother's recipe called for exactly",
      "The museum curator carefully examined the painting and",
      "When the lights came back on, everyone saw",
      "The car wouldn't start because the",
      "After reading the contract, the lawyer warned them about",
      "The hiking trail ended at a cliff where they could see",
      "The password reset email said to",
      "In her acceptance speech, the winner thanked",
      "The flight attendant announced that passengers should",
      "According to the instructions, the first step was to"
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
      "The meeting was supposed to be routine, but then someone mentioned",
      "Marcus hadn't seen his brother in ten years. When the doorbell rang,",
      "The email subject line simply read 'We need to talk.' Opening it, she saw",
      "After the concert ended, two people stayed behind. One of them whispered,",
      "The diary entry was dated 1987. It began with the words,",
      "Everyone at the dinner table went silent when Tom said,",
      "The voicemail was from a number she didn't recognize. The message began,",
      "He had been keeping the secret for months, but now his wife had asked him directly:",
      "The package on the doorstep had no return address. Inside was",
      "When she arrived at the café, her old college roommate looked completely different.",
      "The text message arrived at 2 AM: 'I know what you did.' He replied,",
      "Walking through the parking lot, Jennifer noticed someone watching her from",
      "The family had gathered for Thanksgiving when Dad cleared his throat and announced,",
      "After years apart, they ran into each other at the grocery store.",
      "The police officer's expression changed when she checked his license.",
      "He opened his laptop to find an unfamiliar document on the desktop titled",
      "The retirement party was winding down when the CEO pulled her aside and",
      "She thought she was alone in the house until she heard footsteps",
      "The news report showed a familiar face. Her husband turned up the volume as",
      "They were sorting through Mom's belongings when they found a box labeled 'Do Not Open.'"
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
