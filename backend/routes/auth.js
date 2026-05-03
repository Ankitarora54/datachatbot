const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const router = express.Router();
console.log(process.env.JWT_SECRET);
// demo user
// const demoUser = {
//   email: "admin@test.com",
//   password: bcrypt.hashSync("admin123", 10),
// };

const demoUser = {
  email: "testuser@test.com",
  password: "testchatbot2026",
};

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== demoUser.email) {
      return res.status(401).json({
        error: "Invalid email",
      });
    }

    // const validPassword = await bcrypt.compare(
    // password,
    // demoUser.password
    //     );

    if (password !== demoUser.password) {
      return res.status(401).json({
        error: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user: {
        email,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Login failed",
    });
  }
});

module.exports = router;
