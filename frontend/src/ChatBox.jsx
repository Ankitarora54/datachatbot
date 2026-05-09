import { useState } from "react";
import axios from "axios";

export default function ChatBox({ setData, setLoading, selectedModel }) {
  const [input, setInput] = useState("");

  const API = import.meta.env.VITE_API_URL;

  const suggestedQueries = [
    "Country exposure for Amundi European Equity Fund",
    "Market exposure for Amundi European Equity Fund",
    "Sector exposure for BlackRock US Large Cap Growth Fund",
    "Top holdings for Amundi European Equity Fund",
    "Which UK funds outperformed FTSE 100 last year?",
    "Which US-focused funds outperformed Dow Jones?",
    "Best performing US technology funds over the last year",
    "Funds with highest Sharpe ratio in Europe",
    "Compare BlackRock US Innovation Fund and UBS Europe Sustainable Growth Fund",
    "Funds heavily exposed to Technology sector",
    "Which country contributes most to Samsung Electronics exposure?",
    "Top investors by portfolio value",
    "Funds outperforming MSCI World Index",
    "Top European funds beating DAX 40",
    "Which fund has highest risk-adjusted return?",
    "Which sectors are overexposed across funds?",
    "Funds heavily invested in IT",
    "Which country contributes most to Disney Limited risk exposure?",
    "Compare Disney Limited invested funds against benchmark CAGR",
    "Compare buy and sell transactions for Disney Limited",
    "Show geographic allocation of Disney Limited portfolio",
    "Compare Disney Limited and BlackRock Capital by total investment",
    "Which investor owns the best performing portfolio?",
    "Most diversified funds",
    "Highly concentrated funds",
    "Funds with poor diversification",
    "Which fund has best Sharpe ratio?",
    "Which funds are overexposed to IT sector?",
    "Which fund is safest and well diversified?",
    "Safest fund",
    "Most diversified fund",
    "Best balanced fund",
    "Funds with high risk but low diversification"
  ];

  const send = async () => {
    const question = input.trim();

    if (!question) {
      return;
    }

    setData(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/query`,
        {
          question,
          sessionId: "user1",
          model: selectedModel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching data");
    }

    setLoading(false);
  };

  const handleSuggestionClick = (query) => {
    setInput(query);
  };

  return (
    <div style={styles.chatShell}>
      <textarea
        rows="5"
        style={styles.input}
        placeholder="Ask about AUM, allocation, holdings, transactions, risk, or benchmark performance..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button style={styles.button} onClick={send}>
        <span>Run Analysis</span>
        <span style={styles.buttonArrow}>-&gt;</span>
      </button>

      <div style={styles.divider} />

      <div style={styles.suggestionContainer}>
        <div style={styles.suggestionHeader}>
          <h3 style={styles.suggestionTitle}>Suggested queries</h3>
          <span style={styles.suggestionCount}>{suggestedQueries.length}</span>
        </div>

        <div style={styles.suggestionList}>
          {suggestedQueries.map((query, index) => (
            <button
              key={index}
              type="button"
              style={styles.suggestionCard}
              onClick={() => handleSuggestionClick(query)}
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  chatShell: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },

  input: {
    width: "100%",
    minHeight: "132px",
    padding: "14px 15px",
    borderRadius: "8px",
    border: "1px solid rgba(31, 61, 52, 0.16)",
    marginBottom: "12px",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
    background: "#fbfdfc",
    color: "#1b2926",
    fontSize: "14px",
    lineHeight: 1.5,
    fontFamily: "inherit",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
  },

  button: {
    width: "100%",
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "0 14px",
    background: "linear-gradient(135deg, #17372f, #24604f)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 800,
    boxShadow: "0 16px 30px rgba(25, 56, 47, 0.24)",
  },

  buttonArrow: {
    color: "#f2d48b",
    fontSize: "17px",
    lineHeight: 1,
  },

  divider: {
    height: "1px",
    margin: "20px 0",
    background: "linear-gradient(90deg, transparent, rgba(31, 61, 52, 0.18), transparent)",
  },

  suggestionContainer: {
    minHeight: 0,
  },

  suggestionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "10px",
  },

  suggestionTitle: {
    margin: 0,
    color: "#172722",
    fontSize: "13px",
    fontWeight: 850,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  suggestionCount: {
    minWidth: "26px",
    height: "22px",
    display: "grid",
    placeItems: "center",
    borderRadius: "999px",
    background: "#eef4f1",
    color: "#42635a",
    fontSize: "12px",
    fontWeight: 800,
  },

  suggestionList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  suggestionCard: {
    width: "100%",
    padding: "10px 11px",
    background: "#ffffff",
    border: "1px solid rgba(31, 61, 52, 0.12)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
    fontSize: "12px",
    lineHeight: 1.35,
    color: "#3d4d48",
    textAlign: "left",
    fontFamily: "inherit",
    boxShadow: "0 8px 18px rgba(37, 58, 50, 0.06)",
  },
};
