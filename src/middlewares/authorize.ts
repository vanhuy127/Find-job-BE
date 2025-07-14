import { sendResponse } from "@/utils";
import { Request, Response, NextFunction } from "express";

export const authorize =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendResponse(res, {
        status: 401,
        success: false,
        error_code: "UNAUTHORIZED",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendResponse(res, {
        status: 403,
        success: false,
        error_code: "ROLE_NOT_AUTHORIZED",
      });
      return;
    }

    next();
  };
