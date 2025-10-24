import {
  getCompanies,
  getCompanyById,
  updateCompany,
  getCompaniesWithoutApproved,
  getCompanyPendingById,
  changeStatusCompany,
  getCompaniesForUser,
  getCompanyByIdForUser,
  getJobsCurrentCompanyById,
  getAccountCompanyStatus,
} from "@/controllers/company";

import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const companyRouter = express.Router();

companyRouter.get(
  "/admin/companies",
  authenticate,
  authorize(Role.ADMIN),
  getCompanies
);

companyRouter.get("/company/verification-status", getAccountCompanyStatus);

companyRouter.get("/companies", getCompaniesForUser);

companyRouter.get("/company/:id", getCompanyByIdForUser);

companyRouter.get("/company/:id/jobs", getJobsCurrentCompanyById);

companyRouter.get(
  "/admin/company/:id",
  authenticate,
  authorize(Role.ADMIN),
  getCompanyById
);

companyRouter.get(
  "/admin/company/pending/:id",
  authenticate,
  authorize(Role.ADMIN),
  getCompanyPendingById
);

companyRouter.put(
  "/admin/company/:id",
  authenticate,
  authorize(Role.COMPANY),
  updateCompany
);

companyRouter.patch(
  "/admin/company/:id/change-status",
  authenticate,
  authorize(Role.ADMIN),
  changeStatusCompany
);

companyRouter.get(
  "/admin/companies/pending",
  authenticate,
  authorize(Role.ADMIN),
  getCompaniesWithoutApproved
);

export default companyRouter;
