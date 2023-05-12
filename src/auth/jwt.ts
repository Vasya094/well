import { IUser } from "../models/db/user.db";
import jwt from "jsonwebtoken";

const jwtKey = "keyyyy";

export const generateAuthToken = (user: IUser): string => {
  const token = jwt.sign({ _id: user._id, email: user.email }, jwtKey, {
    expiresIn: "2h",
  });

  return token;
};

export const verifyToken = (token: string): { _id: string; email: string } => {
  try {
    const tokenData = jwt.verify(token, jwtKey);
    return tokenData as { _id: string; email: string };
  } catch (error) {
    throw error;
  }
};
