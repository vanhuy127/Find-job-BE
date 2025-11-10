import { paymentWebhook } from "@/controllers/payment";
import express from "express";

const paymentRouter = express.Router();

paymentRouter.post("/payment/sepay-callback", paymentWebhook);

export default paymentRouter;
