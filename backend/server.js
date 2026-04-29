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
  res.send("Backend Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("DB URL:", process.env.DATABASE_URL);
});

const queryRoute = require("./routes/query");
app.use("/query", queryRoute);

// app.listen(5000, () => console.log("Server running on 5000"));