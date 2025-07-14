import {
  login,
  logout,
  refreshAccessToken,
  changePassword,
  lockAccount,
  unlockAccount,
  forgotPassword,
  resetPassword,
  createAdminAccount,
  getMe,
} from "@/controllers/auth";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const authRouter = express.Router();

authRouter.post("/auth/login", login);

authRouter.get("/auth/refresh-token", refreshAccessToken);

authRouter.get("/auth/logout", authenticate, logout);

authRouter.get("/auth/me", authenticate, getMe);

authRouter.patch("/auth/change-password", authenticate, changePassword);

authRouter.patch(
  "/auth/lock-account",
  authenticate,
  authorize(Role.ADMIN),
  lockAccount
);

authRouter.patch(
  "/auth/unlock-account",
  authenticate,
  authorize(Role.ADMIN),
  unlockAccount
);

authRouter.post("/auth/forgot-password", forgotPassword);

authRouter.patch("/auth/reset-password", resetPassword);

authRouter.post("/auth/create-admin", createAdminAccount);

export default authRouter;
