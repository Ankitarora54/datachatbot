require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors({origin: [
    "http://localhost:5173",
    "https://datachatbot-gamma.vercel.app"
  ],}));
// app.use(cors());
app.use(express.json());

/* HEALTH ROUTE */
app.get("/", (req, res) => {
  res.status(200).send("Backend Running");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
   
});

const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const queryRoute = require("./routes/query");
app.use("/auth", authRoutes);
app.use("/query", authMiddleware, queryRoute);