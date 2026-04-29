import { useState } from "react";
import ChatBox from "./ChatBox.jsx";
import ResultTable from "./ResultTable.jsx";
import ChartView from "./ChartView.jsx";

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <h2>💬 Ask Your Data</h2>
        <ChatBox setData={setData} setLoading={setLoading} data={data} />
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
  );
}

const styles = {
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

// import { useState } from "react";
// import ChatBox from "./ChatBox";
// import ResultTable from "./ResultTable";
// import ChartView from "./ChartView";

// // function App() {
// //   return <h1>App is working</h1>;
// // }

// function App() {
//   const [data, setData] = useState(null);
  
//   return (
//     <div>
//       <h1>Chat with Data</h1>
//       <ChatBox setData={setData} />
//       <ResultTable data={data} />
//       <ChartView data={data} />
//     </div>
//   );
// }

// export default App;