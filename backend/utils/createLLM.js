const { ChatOpenAI } = require("@langchain/openai");

function createLLM(model = "gpt-4o-mini") {

  const config = {
    model,
    apiKey: process.env.OPENAI_API_KEY
  };

  // GPT-5 models don't support custom temperature
  if (model.startsWith("gpt-4")) {
    config.temperature = 0;
  }

  return new ChatOpenAI(config);
}

module.exports = { createLLM };