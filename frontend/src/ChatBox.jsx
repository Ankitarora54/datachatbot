import { useState } from "react";
import axios from "axios";

export default function ChatBox({ setData, setLoading }) {
  const [input, setInput] = useState("");
  
  const API = import.meta.env.VITE_API_URL;

  const send = async () => {
    setLoading(true);

    try {
      // const res = await axios.post("/query", {
      console.log("API URL:", API);
      const res = await axios.post(`${API}/query`, {
        question: input,
        sessionId: "user1",
      });

      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching data");
    }

    setLoading(false);
  };

  return (
    <div>
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
    </div>
  );
}

const styles = {
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

// import { useState } from "react";
// import axios from "axios";

// export default function ChatBox({ setData }) {
//   const [input, setInput] = useState("");

//   const send = async () => 
//     {
//       try
//       {
//         const res = await axios.post(`${import.meta.env.VITE_API_URL}/query`, {
//           question: input,
//           sessionId: "user1",
//         });

//         setData(res.data);
//       }
//       catch(err)
//       {
//         console.error("FRONTEND ERROR:", err.response?.data);
//         alert("An error occurred: " + err.message);
//       }
//     };

//   return (
//     <div>
//       <input value={input} onChange={e => setInput(e.target.value)} />
//       <button onClick={send}>Ask</button>
//     </div>
//   );
// }