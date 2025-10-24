import { uploadMixedCloud } from "@/config/cloudinary.config";
import {
  changeStatus,
  getResumeById,
  getResumeByIdForUser,
  getResumes,
  getResumesForUser,
  uploadResume,
} from "@/controllers/resume";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const resumeRouter = express.Router();

resumeRouter.get("/resumes", authenticate, authorize(Role.COMPANY), getResumes);

resumeRouter.get(
  "/resumes/current-user",
  authenticate,
  authorize(Role.USER),
  getResumesForUser
);

resumeRouter.get(
  "/resume/:id/current-user",
  authenticate,
  authorize(Role.USER),
  getResumeByIdForUser
);

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
  uploadMixedCloud.fields([{ name: "file", maxCount: 1 }]),
  uploadResume
);

export default resumeRouter;
