import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
} from "@/controllers/user";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const userRouter = express.Router();

userRouter.post("/admin/user", createUser);

userRouter.get("/admin/users", authenticate, authorize(Role.ADMIN), getUsers);

userRouter.get(
  "/admin/user/:id",
  authenticate,
  authorize(Role.ADMIN),
  getUserById
);

userRouter.put(
  "/admin/user/:id",
  authenticate,
  authorize(Role.USER),
  updateUser
);

export default userRouter;
