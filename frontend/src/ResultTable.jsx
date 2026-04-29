function downloadCSV(data) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);

  const csvRows = [
    headers.join(","), // header row
    ...data.map(row =>
      headers.map(field => `"${row[field]}"`).join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", "query_results.csv");
  a.click();
}

export default function ResultTable({ data }) {
  if (!data || !data.result?.length) return <p>No data</p>;
  const columns = data?.result?.length ? Object.keys(data.result[0]) : [];
  function downloadCSV(data) {
    const headers = Object.keys(data[0]);
    
    const csvRows = [
      headers.join(","),
      ...data.map(row =>
        headers.map(field => `"${row[field]}"`).join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "query_results.csv";
    a.click();
  } 
  return (
    <div style={{ maxWidth: "600px" }}>
      <button onClick={() => downloadCSV(data.result)} style={styles.button}>
        ⬇️ Download CSV
      </button>

      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  ...styles.th,
                  textAlign: col.toLowerCase().includes("aum") ? "right" : "left",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.result.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td
                  key={col}
                  style={{
                    ...styles.td,
                    textAlign: typeof row[col] === "number" ? "right" : "left",
                  }}
                >
                  {row[col] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px",
    borderBottom: "2px solid #ddd",
    background: "#f9fafb",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #eee",
  },
};

// export default function ResultTable({ data }) {
//   if (!data) return null;

//   return (
//     <div>
//       <h3>SQL</h3>
//       <pre>{data.query}</pre>

//       <h3>Explanation</h3>
//       <p>{data.explanation}</p>

//       <table border="1">
//         <thead>
//           <tr>
//             {Object.keys(data.result[0] || {}).map(col => (
//               <th key={col}>{col}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {data.result.map((row, i) => (
//             <tr key={i}>
//               {Object.values(row).map((val, j) => (
//                 <td key={j}>{val}</td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }