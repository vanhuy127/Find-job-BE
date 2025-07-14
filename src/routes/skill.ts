import {
  createSkill,
  deleteSkill,
  editSkill,
  getSkillById,
  getSkills,
} from "@/controllers/skill";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const skillRouter = express.Router();

skillRouter.get("/admin/skills", getSkills);

skillRouter.get("/admin/skill/:id", getSkillById);

skillRouter.post(
  "/admin/skill",
  authenticate,
  authorize(Role.ADMIN),
  createSkill
);

skillRouter.put(
  "/admin/skill/:id",
  authenticate,
  authorize(Role.ADMIN),
  editSkill
);

skillRouter.delete(
  "/admin/skill/:id",
  authenticate,
  authorize(Role.ADMIN),
  deleteSkill
);

export default skillRouter;
