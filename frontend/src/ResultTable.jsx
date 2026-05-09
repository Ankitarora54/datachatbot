export default function ResultTable({ data }) {
  if (!data || !data.result?.length) {
    return <p style={styles.empty}>No data returned.</p>;
  }

  const columns = Object.keys(data.result[0]);

  function downloadCSV(rows) {
    const headers = Object.keys(rows[0]);

    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((field) => `"${row[field] ?? ""}"`).join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "query_results.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.tableSection}>
      <div style={styles.tableToolbar}>
        <span style={styles.rowCount}>{data.result.length} rows</span>
        <button onClick={() => downloadCSV(data.result)} style={styles.button}>
          Export CSV
        </button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    ...styles.th,
                    textAlign: isNumericColumn(data.result, col) ? "right" : "left",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.result.map((row, i) => (
              <tr key={i} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                {columns.map((col) => (
                  <td
                    key={col}
                    style={{
                      ...styles.td,
                      textAlign: typeof row[col] === "number" ? "right" : "left",
                    }}
                  >
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isNumericColumn(rows, column) {
  return rows.some((row) => typeof row[column] === "number");
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  return value;
}

const styles = {
  tableSection: {
    width: "100%",
  },

  tableToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },

  rowCount: {
    color: "#60706b",
    fontSize: "13px",
    fontWeight: 750,
  },

  button: {
    height: "34px",
    padding: "0 13px",
    borderRadius: "8px",
    border: "1px solid rgba(31, 61, 52, 0.14)",
    background: "#f8fbf9",
    color: "#18372f",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 800,
    boxShadow: "0 8px 18px rgba(37, 58, 50, 0.07)",
  },

  tableWrapper: {
    width: "100%",
    maxHeight: "460px",
    overflow: "auto",
    borderRadius: "8px",
    border: "1px solid rgba(31, 61, 52, 0.1)",
    boxSizing: "border-box",
    background: "#fff",
  },

  table: {
    width: "100%",
    minWidth: "760px",
    borderCollapse: "separate",
    borderSpacing: 0,
    tableLayout: "auto",
  },

  th: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(31, 61, 52, 0.13)",
    background: "#edf4f1",
    color: "#273a35",
    wordBreak: "break-word",
    whiteSpace: "normal",
    position: "sticky",
    top: 0,
    zIndex: 1,
    fontSize: "12px",
    fontWeight: 850,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  td: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(31, 61, 52, 0.08)",
    color: "#354843",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    maxWidth: "280px",
    whiteSpace: "normal",
    fontSize: "13px",
    lineHeight: 1.45,
  },

  evenRow: {
    background: "#ffffff",
  },

  oddRow: {
    background: "#fbfdfc",
  },

  empty: {
    margin: 0,
    color: "#60706b",
    fontSize: "14px",
  },
};
