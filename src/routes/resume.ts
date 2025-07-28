import { changeStatus, getResumeById, getResumes } from "@/controllers/resume";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const resumeRouter = express.Router();

resumeRouter.get(
  "/company/resumes",
  authenticate,
  authorize(Role.COMPANY),
  getResumes
);

resumeRouter.get(
  "/company/resume/:id",
  authenticate,
  authorize(Role.COMPANY),
  getResumeById
);

resumeRouter.patch(
  "/company/resume/:id/change-status",
  authenticate,
  authorize(Role.COMPANY),
  changeStatus
);

export default resumeRouter;
