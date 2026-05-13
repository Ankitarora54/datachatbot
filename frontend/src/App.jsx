import { useState, useEffect } from "react";
import ChatBox from "./ChatBox.jsx";
import ResultTable from "./ResultTable.jsx";
import ChartView from "./ChartView.jsx";
import Login from "./Login";

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const DEMO_MODE = true;
  const [isAuthenticated, setIsAuthenticated] =
    useState(
      DEMO_MODE ||
      Boolean(localStorage.getItem("token"))
    );
  // const [isAuthenticated, setIsAuthenticated] = useState(() =>
  //   Boolean(localStorage.getItem("token"))
  // );
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL;

    const pingServer = async () => {
      try {
        await fetch(API);
        console.log("Render keep-alive ping sent");
      } catch (err) {
        console.error("Keep-alive ping failed", err);
      }
    };

    pingServer();

    const interval = setInterval(pingServer, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) {
    return <Login setIsAuthenticated={setIsAuthenticated} />;
  }

  return (
    <div className="app-page" style={styles.page}>
      <header className="app-topbar" style={styles.topBar}>
        <div className="app-brand" style={styles.brandCluster}>
          <div style={styles.brandMark}>WM</div>
          <div>
            <p style={styles.eyebrow}>Wealth Intelligence Desk</p>
            <h1 style={styles.title}>Portfolio Data Assistant</h1>
          </div>
        </div>

        <div className="app-toolbar" style={styles.toolbar}>
          <div style={styles.notice}>
            <span style={styles.noticeIcon}>!</span>
            <span>
              For complex portfolio queries, use <strong>GPT-5 Mini</strong> or{" "}
              <strong>GPT-5</strong>.
            </span>
          </div>

          <label style={styles.modelGroup}>
            <span style={styles.modelLabel}>Model</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={styles.modelSelect}
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-5-mini">GPT-5 Mini</option>
              <option value="gpt-5">GPT-5</option>
            </select>
          </label>

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
      </header>

      <main className="app-workspace" style={styles.workspace}>
        <aside className="app-left-panel" style={styles.left}>
          <div style={styles.panelHeader}>
            <p style={styles.panelKicker}>Ask in plain English</p>
            <h2 style={styles.panelTitle}>Query your portfolios</h2>
          </div>

          <ChatBox
            setData={setData}
            setLoading={setLoading}
            data={data}
            selectedModel={selectedModel}
          />
        </aside>

        <section className="app-results" style={styles.right}>
          {loading && (
            <div style={styles.loadingCard}>
              <div style={styles.loadingPulse} />
              <div>
                <h3 style={styles.loadingTitle}>Generating analysis</h3>
                <p style={styles.loadingText}>
                  Reviewing portfolio data, SQL, and insight output.
                </p>
              </div>
            </div>
          )}

          {!loading && !data && (
            <div style={styles.emptyState}>
              <p style={styles.emptyKicker}>Ready for analysis</p>
              <h2 style={styles.emptyTitle}>
                Ask a question to surface holdings, risk, returns, and
                allocation trends.
              </h2>
              <p style={styles.emptyText}>
                Results will appear here as structured SQL, narrative explanation,
                tabular output, AI insight, and chart visualizations.
              </p>
            </div>
          )}

          {data && (
            <div className="results-grid" style={styles.resultsGrid}>
              <ResultSection title="SQL Query" tone="code">
                <pre style={styles.sqlBox}>{data.query}</pre>
              </ResultSection>

              <ResultSection title="Explanation">
                <p style={styles.bodyText}>{data.explanation}</p>
              </ResultSection>

              <ResultSection title="Results" wide>
                <ResultTable data={data} />
              </ResultSection>

              <ResultSection title="AI Insight" wide>
                <p style={styles.bodyText}>{data.insight}</p>
              </ResultSection>

              <ResultSection title="Chart" wide>
                <div style={styles.chartFrame}>
                  <ChartView data={data} />
                </div>
              </ResultSection>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ResultSection({ title, children, wide = false, tone = "default" }) {
  return (
    <article
      style={{
        ...styles.card,
        ...(wide ? styles.wideCard : {}),
        ...(tone === "code" ? styles.codeCard : {}),
      }}
    >
      <div style={styles.cardHeader}>
        <span style={styles.cardRule} />
        <h3 style={styles.cardTitle}>{title}</h3>
      </div>
      {children}
    </article>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background:
      "linear-gradient(135deg, #eef3f1 0%, #f8faf8 45%, #edf4f7 100%)",
    color: "#18211f",
  },

  topBar: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    padding: "22px 32px",
    boxSizing: "border-box",
    borderBottom: "1px solid rgba(38, 64, 55, 0.12)",
    background: "rgba(255, 255, 255, 0.78)",
    backdropFilter: "blur(18px)",
  },

  brandCluster: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
  },

  brandMark: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    background: "linear-gradient(145deg, #15372f, #245a4d)",
    color: "#f6d98d",
    fontSize: "14px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    boxShadow: "0 14px 28px rgba(25, 56, 47, 0.22)",
  },

  eyebrow: {
    margin: 0,
    color: "#687671",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },

  title: {
    margin: "2px 0 0",
    color: "#13231f",
    fontSize: "24px",
    lineHeight: 1.1,
    fontWeight: 750,
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },

  notice: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    maxWidth: "410px",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(189, 144, 45, 0.34)",
    background: "#fff7df",
    color: "#735311",
    fontSize: "12px",
    lineHeight: 1.35,
    fontWeight: 550,
  },

  noticeIcon: {
    width: "18px",
    height: "18px",
    display: "grid",
    placeItems: "center",
    borderRadius: "999px",
    background: "#d39b2a",
    color: "#fff",
    fontWeight: 800,
    flex: "0 0 auto",
  },

  modelGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  modelLabel: {
    fontWeight: 700,
    color: "#34443f",
    fontSize: "13px",
  },

  modelSelect: {
    height: "38px",
    padding: "0 34px 0 12px",
    borderRadius: "8px",
    border: "1px solid rgba(31, 61, 52, 0.18)",
    background: "#fff",
    color: "#1b2926",
    fontSize: "13px",
    fontWeight: 650,
    cursor: "pointer",
    outline: "none",
    boxShadow: "0 8px 18px rgba(31, 61, 52, 0.07)",
  },

  logoutButton: {
    height: "38px",
    padding: "0 16px",
    borderRadius: "8px",
    border: "1px solid rgba(31, 61, 52, 0.16)",
    background: "#18372f",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 750,
    fontSize: "13px",
    boxShadow: "0 12px 24px rgba(24, 55, 47, 0.2)",
  },

  workspace: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 390px) minmax(0, 1fr)",
    gap: "22px",
    height: "calc(100vh - 93px)",
    padding: "22px 32px 28px",
    boxSizing: "border-box",
  },

  left: {
    minHeight: 0,
    padding: "22px",
    border: "1px solid rgba(31, 61, 52, 0.12)",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.86)",
    boxShadow: "0 24px 50px rgba(37, 58, 50, 0.11)",
    overflowY: "auto",
  },

  panelHeader: {
    paddingBottom: "18px",
    marginBottom: "18px",
    borderBottom: "1px solid rgba(31, 61, 52, 0.1)",
  },

  panelKicker: {
    margin: 0,
    color: "#8a6a1d",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },

  panelTitle: {
    margin: "5px 0 0",
    color: "#14231f",
    fontSize: "22px",
    lineHeight: 1.2,
    fontWeight: 780,
  },

  right: {
    minWidth: 0,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: "4px",
  },

  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },

  card: {
    minWidth: 0,
    background: "rgba(255, 255, 255, 0.92)",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid rgba(31, 61, 52, 0.11)",
    boxShadow: "0 18px 42px rgba(37, 58, 50, 0.09)",
    boxSizing: "border-box",
  },

  wideCard: {
    gridColumn: "1 / -1",
  },

  codeCard: {
    background: "linear-gradient(145deg, #fbfcfa 0%, #f3f7f5 100%)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
  },

  cardRule: {
    width: "4px",
    height: "18px",
    borderRadius: "999px",
    background: "#c99b35",
    boxShadow: "0 0 0 4px rgba(201, 155, 53, 0.12)",
  },

  cardTitle: {
    margin: 0,
    color: "#13231f",
    fontSize: "15px",
    fontWeight: 800,
    letterSpacing: "0.01em",
  },

  bodyText: {
    margin: 0,
    color: "#465652",
    fontSize: "14px",
    lineHeight: 1.65,
    textAlign: "left",
  },

  sqlBox: {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    overflowX: "auto",
    maxWidth: "100%",
    fontSize: "13px",
    lineHeight: 1.55,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    color: "#d8efe6",
    background: "#13231f",
    padding: "16px",
    borderRadius: "8px",
    boxSizing: "border-box",
    textAlign: "left",
  },

  chartFrame: {
    height: "360px",
    minHeight: "280px",
  },

  loadingCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px",
    borderRadius: "8px",
    border: "1px solid rgba(31, 61, 52, 0.12)",
    background: "#ffffff",
    boxShadow: "0 18px 42px rgba(37, 58, 50, 0.09)",
  },

  loadingPulse: {
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    background: "#c99b35",
    boxShadow: "0 0 0 10px rgba(201, 155, 53, 0.15)",
  },

  loadingTitle: {
    margin: 0,
    color: "#13231f",
    fontSize: "15px",
    fontWeight: 800,
  },

  loadingText: {
    margin: "2px 0 0",
    color: "#687671",
    fontSize: "13px",
  },

  emptyState: {
    minHeight: "calc(100vh - 158px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "48px",
    borderRadius: "8px",
    border: "1px solid rgba(31, 61, 52, 0.12)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.88), rgba(245,249,247,0.9))",
    boxShadow: "0 24px 50px rgba(37, 58, 50, 0.09)",
    boxSizing: "border-box",
    textAlign: "left",
  },

  emptyKicker: {
    margin: 0,
    color: "#8a6a1d",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },

  emptyTitle: {
    maxWidth: "720px",
    margin: "10px 0 12px",
    color: "#13231f",
    fontSize: "34px",
    lineHeight: 1.12,
    fontWeight: 780,
  },

  emptyText: {
    maxWidth: "620px",
    margin: 0,
    color: "#60706b",
    fontSize: "15px",
    lineHeight: 1.7,
  },
};

export default App;
