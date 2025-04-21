const jwt = require('jsonwebtoken');
const User = require('../models/user');
const env = require("dotenv");
env.config();
const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header is missing" });
  }
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
   
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
module.exports = authMiddleware;
