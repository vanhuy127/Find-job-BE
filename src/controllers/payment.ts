import { MESSAGE_CODES } from "@/constants";
import { normalizeUUID, sendResponse } from "@/utils";
import db from "@/config/db";
import { Request, Response } from "express";

export const paymentWebhook = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Apikey ")) {
      sendResponse(res, {
        status: 401,
        success: false,
        error_code: MESSAGE_CODES.AUTH.UNAUTHORIZED,
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      sendResponse(res, {
        status: 401,
        success: false,
        error_code: MESSAGE_CODES.AUTH.TOKEN_REQUIRED,
      });
      return;
    }

    if (token !== process.env.SEPAY_API_KEY) {
      sendResponse(res, {
        status: 401,
        success: false,
        error_code: MESSAGE_CODES.AUTH.TOKEN_REQUIRED,
      });
      return;
    }
    const { content, transferType, transferAmount } = req.body;
    console.log(content, transferType, transferAmount);
    const rawOrderCode = content.trim().split(/\s+/)[2];
    const orderId = normalizeUUID(rawOrderCode);
    const order = await db.company_VipPackage.findFirst({
      where: {
        id: orderId || "",
      },
      include: {
        vipPackage: true,
      },
    });
    if (
      transferType !== "in" ||
      !order ||
      Number(transferAmount) !== Number(order.vipPackage.price)
    ) {
      await db.company_VipPackage.update({
        where: {
          id: orderId || "",
        },
        data: {
          status: "FAILED",
        },
      });
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.VALIDATION_ERROR,
      });
      return;
    }

    await db.company_VipPackage.update({
      where: {
        id: orderId || "",
      },
      data: {
        status: "SUCCESS",
      },
    });
    sendResponse(res, {
      status: 200,
      success: true,
      message_code: MESSAGE_CODES.SUCCESS.UPDATED_SUCCESS,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: MESSAGE_CODES.SEVER.INTERNAL_SERVER_ERROR,
    });
  }
};
