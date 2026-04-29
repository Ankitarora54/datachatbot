function isSafeQuery(query) {
  const forbidden = ["drop", "delete", "update", "insert", "truncate"];
  const lower = query.toLowerCase();

  return !forbidden.some(word => lower.includes(word));
}

module.exports = { isSafeQuery };