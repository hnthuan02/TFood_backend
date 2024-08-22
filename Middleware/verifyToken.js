const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const USER_SERVICE = require("../Services/User/User.Service");

dotenv.config();

const verifyToken = async (req, res, next) => {
  const authHeader = req.header("authorization");
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "authorization token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user_id = decoded.userId;
    const user_info = await USER_SERVICE.getUserInfo(decoded.userId);
    req.user = user_info;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

const verifyTokenAdmin = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authorization token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user_info = await USER_SERVICE.getUserInfo(decoded.userId);
    req.user = user_info;
    console.log(user_info);

    if (!user_info) {
      return res.status(404).json({ message: "User not found." });
    }

    const isAdmin = user_info.ROLE.IS_ADMIN;
    if (!isAdmin) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = { verifyToken, verifyTokenAdmin };
