import jwt, { JwtPayload } from "jsonwebtoken";

const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY;
const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY;

export function generateAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, ACCESS_TOKEN_KEY!, { expiresIn: "1d" });
}

export function verifyAccessToken(token: string): {
  decoded?: JwtPayload;
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_KEY!) as JwtPayload;
    return { decoded };
  } catch (error: any) {
    console.error("Error verifying access token:", error);
    if (error.name === "TokenExpiredError") {
      return { error: "TOKEN_EXPIRED" };
    }

    return { error: "INVALID_TOKEN" };
  }
}

export function generateRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, REFRESH_TOKEN_KEY!, { expiresIn: "7d" });
}

export function verifyRefreshToken(token: string): {
  decoded?: JwtPayload;
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_KEY!) as JwtPayload;
    return { decoded };
  } catch (error: any) {
    console.error("Error verifying access token:", error);
    if (error.name === "TokenExpiredError") {
      return { error: "TOKEN_EXPIRED" };
    }

    return { error: "INVALID_TOKEN" };
  }
}
