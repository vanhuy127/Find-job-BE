import { uploadCloud } from "@/config/cloudinary.config";
import {
  changeStatus,
  getResumeById,
  getResumes,
  uploadResume,
} from "@/controllers/resume";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const resumeRouter = express.Router();

resumeRouter.get("/resumes", authenticate, authorize(Role.COMPANY), getResumes);

resumeRouter.get(
  "/resume/:id",
  authenticate,
  authorize(Role.COMPANY),
  getResumeById
);

resumeRouter.patch(
  "/resume/:id/change-status",
  authenticate,
  authorize(Role.COMPANY),
  changeStatus
);

resumeRouter.post(
  "/upload-resume",
  authenticate,
  authorize(Role.USER),
  uploadCloud.single("file"),
  uploadResume
);

export default resumeRouter;
