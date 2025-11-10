import {
  createOrder,
  createVipPackage,
  deleteVipPackage,
  getOrderById,
  getVipPackage,
  getVipPackageById,
  getVipPackageForCompany,
  updateVipPackage,
} from "@/controllers/vipPackage";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { Role } from "@prisma/client";
import express from "express";

const vipPackageRouter = express.Router();

vipPackageRouter.get("/admin/vip-packages", getVipPackage);

vipPackageRouter.get("/company/vip-packages", getVipPackageForCompany);

vipPackageRouter.get("/admin/vip-package/:id", getVipPackageById);

vipPackageRouter.post(
  "/admin/vip-package",
  authenticate,
  authorize(Role.ADMIN),
  createVipPackage
);

vipPackageRouter.put(
  "/admin/vip-package/:id",
  authenticate,
  authorize(Role.ADMIN),
  updateVipPackage
);

vipPackageRouter.delete(
  "/admin/vip-package/:id",
  authenticate,
  authorize(Role.ADMIN),
  deleteVipPackage
);

vipPackageRouter.post(
  "/company/order",
  authenticate,
  authorize(Role.COMPANY),
  createOrder
);

vipPackageRouter.get(
  "/company/order/:id",
  authenticate,
  authorize(Role.COMPANY),
  getOrderById
);

export default vipPackageRouter;
