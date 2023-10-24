import jwt from "jsonwebtoken";

const config = process.env;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_KEY);
    req.user = decoded;
  } catch (err) {
    if (err.message === "jwt expired") {
      return res.status(401).json({ msg: "Token has expired" });
    }
    return res.status(401).send(err.message);
  }

  return next();
};

export default verifyToken;
