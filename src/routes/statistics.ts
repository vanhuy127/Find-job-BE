import {
  getApplicationStats,
  getApplicationStatsForCompany,
  getCompanyStats,
  getCompanyTrendByYear,
  getJobStats,
  getJobStatsForCompany,
  getOverview,
  getOverviewForCompany,
  getTopProvinces,
} from "@/controllers/statistics";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const statRouter = express.Router();

statRouter.get(
  "/admin/statistics/overview",
  authenticate,
  authorize(Role.ADMIN),
  getOverview
);

statRouter.get(
  "/admin/statistics/companies",
  authenticate,
  authorize(Role.ADMIN),
  getCompanyStats
);

statRouter.get(
  "/admin/statistics/jobs",
  authenticate,
  authorize(Role.ADMIN),
  getJobStats
);

statRouter.get(
  "/admin/statistics/applications",
  authenticate,
  authorize(Role.ADMIN),
  getApplicationStats
);

statRouter.get(
  "/admin/statistics/top-provinces",
  authenticate,
  authorize(Role.ADMIN),
  getTopProvinces
);

statRouter.get(
  "/company/statistics/overview",
  authenticate,
  authorize(Role.COMPANY),
  getOverviewForCompany
);

statRouter.get(
  "/company/statistics/by-jobs",
  authenticate,
  authorize(Role.COMPANY),
  getJobStatsForCompany
);

statRouter.get(
  "/company/statistics/applications",
  authenticate,
  authorize(Role.COMPANY),
  getApplicationStatsForCompany
);

statRouter.get(
  "/company/statistics/applications-by-year",
  authenticate,
  authorize(Role.COMPANY),
  getCompanyTrendByYear
);

export default statRouter;
