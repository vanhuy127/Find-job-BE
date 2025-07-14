import { MESSAGE_CODES } from "@/constants";
import { verifyAccessToken, sendResponse } from "@/utils";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      sendResponse(res, {
        status: 401,
        success: false,
        error_code: MESSAGE_CODES.AUTH.UNAUTHORIZED,
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      sendResponse(res, {
        status: 401,
        success: false,
        error_code: MESSAGE_CODES.AUTH.TOKEN_REQUIRED,
      });
      return;
    }

    if (!process.env.ACCESS_TOKEN_KEY) {
      sendResponse(res, {
        status: 500,
        success: false,
        error_code: MESSAGE_CODES.AUTH.JWT_SECRET_NOT_SET,
      });
      return;
    }
    const { decoded, error } = verifyAccessToken(token);
    if (error === "TOKEN_EXPIRED") {
      sendResponse(res, {
        status: 410,
        success: false,
        error_code: "TOKEN_EXPIRED",
      });
    }

    if (error === "INVALID_TOKEN") {
      sendResponse(res, {
        status: 410,
        success: false,
        error_code: "TOKEN_EXPIRED",
      });
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    console.error("Authentication error:", err);

    sendResponse(res, {
      status: 401,
      success: false,
      error_code: MESSAGE_CODES.AUTH.INVALID_TOKEN,
    });
  }
};
