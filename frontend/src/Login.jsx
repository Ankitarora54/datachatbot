import { useState } from "react";
import axios from "axios";
import "./Login.css";

const API = import.meta.env.VITE_API_URL;

export default function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("testuser@test.com");
  const [password, setPassword] = useState("testchatbot2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API}/auth/login`,
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", res.data.token);

      setIsAuthenticated(true);
    } catch (err) {
      console.error(err);
      setError("Invalid credentials");
    }

    setLoading(false);
  };
 
  const handleKeyPress = (e) => {if (e.key === "Enter") {handleLogin();}};
 
  return (
    
    <div className="login-page">
      <div className="background-glow glow-1"></div>
      <div className="background-glow glow-2"></div>

      <div className="login-card">
        <div className="brand-section">
          <div className="logo-circle">📈</div>

          <h3>Conversational Investment Intelligence</h3>
          
          <p>
            Ask questions about your portfolio and funds in natural language, and get instant insights powered by AI.
          </p>
        </div>

        <div className="input-group">
          <label>Username</label>

          <input
            type="email"
            placeholder="Enter your username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>

        <div className="input-group">
          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>

        <button
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing In..." : "Login"}
        </button>

        {error && (
          <p className="error-message">{error}</p>
        )}

        <div className="demo-box">
          <strong>Demo Credentials</strong>

          <p>testuser@test.com</p>
          <p>testchatbot2026</p>
        </div>
      </div>
    </div>
  );
}

// import { useState } from "react";
// import axios from "axios";
// import "./Login.css";

// const API = import.meta.env.VITE_API_URL;

// export default function Login({ setIsAuthenticated }) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     setError("");
//     setLoading(true);

//     try {
//       const res = await axios.post(
//         `${API}/auth/login`,
//         {
//           email,
//           password,
//         }
//       );

//       localStorage.setItem("token", res.data.token);

//       setIsAuthenticated(true);

//     } catch (err) {
//       console.error(err);

//       setError("Invalid credentials");
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="login-page">
//       <div className="login-overlay"></div>

//       <div className="login-card">
//         <div className="logo-circle">📊</div>

//         <h1>Fund Accounting AI</h1>

//         <p className="subtitle">
//           Natural Language Investment Intelligence Platform
//         </p>

//         <div className="input-group">
//           <label>Email</label>

//           <input
//             type="email"
//             placeholder="Enter your email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//         </div>

//         <div className="input-group">
//           <label>Password</label>

//           <input
//             type="password"
//             placeholder="Enter your password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//         </div>

//         <button
//           className="login-button"
//           onClick={handleLogin}
//           disabled={loading}
//         >
//           {loading ? "Signing In..." : "Login"}
//         </button>

//         {error && (
//           <p className="error-message">{error}</p>
//         )}

//         <div className="demo-box">
//           <p>
//             <strong>Demo Credentials</strong>
//           </p>

//           <p>Email: admin@test.com</p>
//           <p>Password: admin123</p>
//         </div>
//       </div>
//     </div>
//   );
// }
// // import { useState } from "react";
// // import axios from "axios";
// // import "./Login.css";

// // const API = import.meta.env.VITE_API_URL;

// // export default function Login({ setIsAuthenticated }) {
// //   const [email, setEmail] = useState("");
// //   const [password, setPassword] = useState("");
// //   const [error, setError] = useState("");

// //   const handleLogin = async () => {
// //     try {
// //       const res = await axios.post(
// //         `${API}/auth/login`,
// //         {
// //           email,
// //           password,
// //         }
// //       );

// //       localStorage.setItem(
// //         "token",
// //         res.data.token
// //       );

// //       setIsAuthenticated(true);
// //     } catch (err) {
// //       console.error(err);

// //       setError("Invalid credentials");
// //     }
// //   };

// //   return (
// //     <div className="login-container">
// //       <h1>Fund Accounting Chatbot</h1>

// //       <input
// //         type="email"
// //         placeholder="Email"
// //         value={email}
// //         onChange={(e) => setEmail(e.target.value)}
// //       />

// //       <input
// //         type="password"
// //         placeholder="Password"
// //         value={password}
// //         onChange={(e) => setPassword(e.target.value)}
// //       />

// //       <button onClick={handleLogin}>
// //         Login
// //       </button>

// //       {error && <p>{error}</p>}
// //     </div>
// //   );
// // }
