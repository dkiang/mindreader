// js/api.js

const API_URL = "/api/openai-proxy";

export const MindreaderAPI = {
  //------------------------------------
  // Mode 1: Next-token prediction
  //------------------------------------
  async getNextTokenDistribution(promptText) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "mode1",
        prompt: promptText
      })
    });

    if (!response.ok) {
      throw new Error("Mode1 API request failed");
    }

    return await response.json();
  },

  //------------------------------------
  // Mode 2: Probability of target concept
  //------------------------------------
  async getTargetProbability(promptText, targetConcept) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "mode2",
        prompt: promptText,
        target: targetConcept
      })
    });

    if (!response.ok) {
      throw new Error("Mode2 API request failed");
    }

    return await response.json();
  }
};
