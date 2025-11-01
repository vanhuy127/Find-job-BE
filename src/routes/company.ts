import { uploadMixedCloud } from "@/config/cloudinary.config";
import {
  getCompanies,
  getCompanyById,
  updateCompanyInfo,
  getCompaniesWithoutApproved,
  getCompanyPendingById,
  changeStatusCompany,
  getCompaniesForUser,
  getCompanyByIdForUser,
  getJobsCurrentCompanyById,
  getAccountCompanyStatus,
  getCompanyCurrent,
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

companyRouter.patch(
  "/company/update-info",
  authenticate,
  authorize(Role.COMPANY),
  uploadMixedCloud.fields([{ name: "logo", maxCount: 1 }]),
  updateCompanyInfo
);

companyRouter.get(
  "/company/current",
  authenticate,
  authorize(Role.COMPANY),
  getCompanyCurrent
);

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
