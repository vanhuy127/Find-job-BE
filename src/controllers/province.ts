import db from "@/config/db";
import { Request, Response } from "express";
import { sendListResponse, sendResponse } from "@/utils";
import { MESSAGE_CODES, DEFAULT_PAGE, MAX_DEFAULT_SIZE } from "@/constants";

export const getProvinces = async (req: Request, res: Response) => {
  try {
    const page = DEFAULT_PAGE;
    const total = await db.province.count();
    const provinces = await db.province.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    if (provinces) {
      sendListResponse(res, {
        status: 200,
        success: true,
        data: provinces,
        pagination: {
          total,
          page,
          size: MAX_DEFAULT_SIZE,
          totalPages: page,
        },
        message_code: MESSAGE_CODES.SUCCESS.GET_ALL_SUCCESS,
      });
      return;
    }
    sendResponse(res, {
      status: 404,
      success: true,
      data: [],
      error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: MESSAGE_CODES.SEVER.INTERNAL_SERVER_ERROR,
    });
    return;
  }
};
