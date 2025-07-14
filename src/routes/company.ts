import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  approveCompany,
} from "@/controllers/company";

import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const companyRouter = express.Router();

companyRouter.post("/admin/company", createCompany);

companyRouter.get(
  "/admin/companies",
  authenticate,
  authorize(Role.ADMIN),
  getCompanies
);

companyRouter.get(
  "/admin/company/:id",
  authenticate,
  authorize(Role.ADMIN),
  getCompanyById
);

companyRouter.put(
  "/admin/company/:id",
  authenticate,
  authorize(Role.COMPANY),
  updateCompany
);

companyRouter.patch(
  "/admin/company/:id/approval",
  authenticate,
  authorize(Role.ADMIN),
  approveCompany
);

export default companyRouter;
