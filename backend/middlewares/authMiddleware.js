const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;


    if (token && token.startsWith("Bearer")) {
      token = token.split(" ")[1];
      console.log("Extracted token:", token); // Debug

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded payload:", decoded); // Debug

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }

      next();
    } else {
      res.status(401).json({ message: "Not authorized, no token" });
    }
  } catch (error) {
    console.error("JWT verify error:", error.message); // Debug lỗi
    res.status(401).json({ message: "Token failed", error: error.message });
  }
};


// Middleware for Admin
const adminOnly = (req, res, next) => {
    if(req.user && req.user.role === "admin"){
        next();
    }else{
        res.status(403).json({message: "Access denied, admin only"});
    }
};
module.exports = {protect, adminOnly};
