import { useState, useEffect } from "react";
import ChatBox from "./ChatBox.jsx";
import ResultTable from "./ResultTable.jsx";
import ChartView from "./ChartView.jsx";
import Login from "./Login";


function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");


  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // show login first
  if (!isAuthenticated) {
    return (
      <Login
        setIsAuthenticated={setIsAuthenticated}
      />
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>

        <div style={styles.modelContainer}>
          <div style={styles.warningText}>
          ⚠️ If you face errors while asking questions,
        switch the model to <strong>GPT-5 Mini / GPT 5</strong>.
        GPT-4 versions may occasionally generate
        incorrect SQL for complex portfolio queries.
        </div>

          <label style={styles.modelLabel}>
            Model
          </label>

          <select
            value={selectedModel}
            onChange={(e) =>
              setSelectedModel(e.target.value)
            }
            style={styles.modelSelect}
          >
            <option value="gpt-4o-mini">
              GPT-4o Mini
            </option>

            <option value="gpt-5-mini">
              GPT-5 Mini
            </option>

            <option value="gpt-5">
              GPT-5
            </option>
          </select>
        </div>
        
        <button
          style={styles.logoutButton}
          onClick={() => {
            localStorage.removeItem("token");
            window.location.reload();
          }}
        >
          Logout
        </button>
      </div>

    <div style={styles.container}>
      <div style={styles.left}>
        <h2>💬 Ask Your Data</h2>
        {/* <ChatBox setData={setData} setLoading={setLoading} data={data} /> */}
        <ChatBox setData={setData} setLoading={setLoading} data={data} 
        selectedModel={selectedModel}/>
      </div>
  
      <div style={styles.right}>
        {loading && <p>⏳ Generating...</p>}

        {data && (
          <>
            <div style={styles.card}>
              <h3 style={{ marginBottom: "10px", color: "#111827" }}>🧾 SQL Query</h3>
              <pre style={styles.sqlBox}>{data.query}</pre>
            </div>

            <div style={styles.card}>
              <h3 style={{ marginBottom: "10px", color: "#111827" }}>🧠 Explanation</h3>
              <p>{data.explanation}</p>
            </div>

            <div style={styles.card}>
              <h3 style={{ marginBottom: "10px", color: "#111827" }}>📊 Results</h3>
              <ResultTable data={data} />
            </div>
            <div style={styles.card}>
              <h3 style={{ marginBottom: "10px", color: "#111827" }}>💡 AI Insight</h3>
              <p>{data.insight}</p>
            </div>
            <div style={styles.card}>
              <h3 style={{ marginBottom: "10px", color: "#111827" }}>📈 Chart</h3>
              <ChartView data={data} />
            </div>

          </>
        )}
      </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
  height: "100vh",
  background: "#f5f7fb",
},

topBar: {
  width: "100%",
  display: "flex",
  justifyContent: "flex-end",
  padding: "15px 25px 0px 25px",
  boxSizing: "border-box",
},

modelContainer: {
  display: "flex",
  alignItems: "center",
  gap: "10px",
},

modelLabel: {
  fontWeight: "600",
  color: "#111827",
  fontSize: "14px",
},

modelSelect: {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: "14px",
  cursor: "pointer",
  outline: "none",
},


logoutButton: {
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "600",
  transition: "0.3s ease",
},

warningText: {
  fontSize: "13px",
  color: "#92400e",
  background: "#fef3c7",
  padding: "6px 8px",
  borderRadius: "10px",
  border: "1px solid #fcd34d",
  fontWeight: "500",
},

  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Inter, sans-serif",
    background: "#f5f7fb",
  },

  left: {
    width: "28%",
    padding: "20px",
    borderRight: "1px solid #e5e7eb",
    background: "#ffffff",
  },

  right: {
    width: "72%",
    padding: "25px",
    overflowY: "auto",
  },

  card: {
    background: "#ffffff",
    padding: "18px",
    marginBottom: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  sqlBox: {
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "break-word",
  overflowX: "auto",
  maxWidth: "100%",
  fontSize: "14px",
  lineHeight: "1.5",
  fontFamily: "monospace",
  background: "#f3f4f6",
  padding: "12px",
  borderRadius: "8px",
  boxSizing: "border-box",
  },
};

export default App;