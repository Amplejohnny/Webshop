import jwt from "jsonwebtoken";
import UserRefreshToken from "../model/userRefreshToken.js";

const verifyRefreshToken = async (refreshToken) => {
  const privateKey = process.env.REFRESH_TOKEN_KEY;
  try {
    const data = await UserRefreshToken.findOne({ token: refreshToken });
    if (!data) 
      throw { err: true, message: "Invalid refresh token" };
    const tokenDetails = jwt.verify(refreshToken, privateKey);
    return {
      tokenDetails,
      error: false,
      message: "Valid refresh token",
    };
  } catch (err) {
    throw new Error("Invalid refresh token");
  }
};



export default verifyRefreshToken;
