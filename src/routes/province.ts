import { getProvinces } from "@/controllers/province";
import express from "express";

const provinceRouter = express.Router();

provinceRouter.get("/provinces", getProvinces);

export default provinceRouter;
