import jwt from "jsonwebtoken";
export function signToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }
  return jwt.sign({ id: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}
export function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }
  return jwt.verify(token, process.env.JWT_SECRET);
}
