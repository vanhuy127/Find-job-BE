import { getJobsForUser } from "./../controllers/job";
import {
  createJob,
  getJobs,
  getJobsCurrentCompany,
  getJobById,
  updateJob,
  deleteJob,
} from "@/controllers/job";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const jobRouter = express.Router();

jobRouter.get("/admin/jobs", authenticate, authorize(Role.ADMIN), getJobs);

jobRouter.get("/jobs", getJobsForUser);

jobRouter.get(
  "/company/jobs/current-company",
  authenticate,
  authorize(Role.COMPANY),
  getJobsCurrentCompany
);

jobRouter.get("/admin/job/:id", getJobById);

jobRouter.post(
  "/company/job",
  authenticate,
  authorize(Role.COMPANY),
  createJob
);

jobRouter.put(
  "/company/job/:id",
  authenticate,
  authorize(Role.COMPANY),
  updateJob
);

jobRouter.patch(
  "/company/job/:id",
  authenticate,
  authorize(Role.COMPANY),
  deleteJob
);

export default jobRouter;
