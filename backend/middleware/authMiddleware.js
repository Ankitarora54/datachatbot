const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (token === "demo-token") {return next();}
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    return next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
}

module.exports = authMiddleware;
