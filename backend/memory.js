const memoryStore = {};

function getMemory(sessionId) {
  return memoryStore[sessionId] || [];
}

function saveMemory(sessionId, messages) {
  memoryStore[sessionId] = messages;
}

module.exports = { getMemory, saveMemory };