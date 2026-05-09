// function classifyEntity(question) {

//   const q = question.toLowerCase();

//   // investor-related
//   if (
//     q.includes("investor") ||
//     q.includes("risk exposure")
//   ) {
//     return "investor";
//   }

//   // asset/security-related
//   if (
//     q.includes("holding") ||
//     q.includes("asset")
//   ) {
//     return "asset";
//   }

//   // benchmark-related
//   if (
//     q.includes("nifty") ||
//     q.includes("benchmark")
//   ) {
//     return "benchmark";
//   }

//   return "fund";
// }

function classifyEntity(question) {

  const q = question.toLowerCase();

  // investor-related

  if (
    q.includes("investor") ||
    q.includes("transaction") ||
    q.includes("buy") ||
    q.includes("sell") ||
    q.includes("investment")
  ) {
    return "investor";
  }

  // benchmark-related

  if (
    q.includes("benchmark") ||
    q.includes("outperform") ||
    q.includes("nifty") ||
    q.includes("s&p") ||
    q.includes("ftse") ||
    q.includes("msci")
  ) {
    return "benchmark";
  }

  // fund-related

  if (
    q.includes("fund") ||
    q.includes("portfolio") ||
    q.includes("holding") ||
    q.includes("exposure")
  ) {
    return "fund";
  }

  return "unknown";
}

module.exports = { classifyEntity };