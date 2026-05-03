import { useState } from "react";
import axios from "axios";

export default function ChatBox({ setData, setLoading, data  }) {
  const [input, setInput] = useState("");
  
  const API = import.meta.env.VITE_API_URL;

  const suggestedQueries = [
  "Country exposure for HDFC Large Cap Opportunities Fund",
  "Market exposure for HDFC Large Cap Opportunities Fund",
  "Top 10 holdings for ICICI Fund",
  "Which funds outperformed NIFTY last year?",
  "Which fund has highest risk-adjusted return?",
  "Which sectors are overexposed across funds?",
  "Funds heavily invested in IT",
  "Which country contributes most to Disney Limited risk exposure?",
  "Compare Disney Limited invested funds against benchmark CAGR",
  "Compare buy and sell transactions for Disney Limited",
  "Show geographic allocation of Disney Limited portfolio",
  "Compare Disney Limited and BlackRock Capital by total investment",
  "Which investor owns the best performing portfolio?",
  ];

  const send = async () => {
    setData(null); // clear old results
    setLoading(true);

    try {
      // const res = await axios.post("/query", {
      const token = localStorage.getItem("token");
      console.log("API URL:", API);
      const res = await axios.post(`${API}/query`, {
        question: input,
        sessionId: "user1",
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
  
  const handleSuggestionClick = (query) => {setInput(query);};

  return (
    <div>
      {/* <button
        style={styles.logoutButton}
        onClick={() => {
          localStorage.removeItem("token");
          window.location.reload();
        }}
      >
        Logout
    </button> */}
      <textarea
        rows="4"
        style={styles.input}
        placeholder="Ask something like: Top 5 funds by AUM"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button style={styles.button} onClick={send}>
        Ask
      </button>
      <div style={styles.suggestionContainer}>
        <h3 style={styles.suggestionTitle}>
          Suggested Queries
        </h3>

        <div style={styles.suggestionList}>
          {suggestedQueries.map((query, index) => (
            <div
              key={index}
              style={styles.suggestionCard}
              onClick={() =>
                handleSuggestionClick(query)
              }
            >
              {query}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  // logoutButton: {
  // width: "100%",
  // padding: "10px",
  // background: "#ef4444",
  // color: "#fff",
  // border: "none",
  // borderRadius: "8px",
  // cursor: "pointer",
  // marginBottom: "15px",
  // },
    suggestionContainer: {
    marginTop: "25px",
  },

  suggestionTitle: {
  marginBottom: "10px",
  color: "#111827",
  fontSize: "15px",
  fontWeight: "600",
},

  suggestionList: {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
},

  suggestionCard: {
  padding: "8px 10px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "0.2s ease",
  fontSize: "12px",
  lineHeight: "1.3",
  color: "#374151",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
},
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "10px",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
