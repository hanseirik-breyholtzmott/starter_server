import jwt from "jsonwebtoken";
import sessionModel from "../models/session.model";

const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET);
};

const storeRefreshToken = async (userId: string, refreshToken: string) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 Days

  const token = new sessionModel({
    userId: userId,
    token: refreshToken,
    expiresAt: expiresAt,
  });
  await token.save();
};

export default { generateAccessToken, generateRefreshToken, storeRefreshToken };
