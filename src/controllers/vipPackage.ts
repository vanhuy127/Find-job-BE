import db from "@/config/db";
import { Request, Response } from "express";
import {
  DEFAULT_PAGE,
  DEFAULT_SIZE,
  MESSAGE_CODES,
  VIP_PACKAGE_LEVEL,
} from "@/constants";
import {
  calculationSkip,
  calculationTotalPages,
  sendListResponse,
  sendResponse,
} from "@/utils";
import {
  orderVipPackageSchema,
  vipPackageSchema,
} from "@/validations/vipPackage";

export const createVipPackage = async (req: Request, res: Response) => {
  try {
    const parsed = vipPackageSchema.safeParse(req.body);
    if (!parsed.success) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.VALIDATION_ERROR,
        errors: parsed.error.errors.map((err) => ({
          field: err.path.join("."),
          error_code: err.message,
        })),
      });
      return;
    }

    const { name, description, numPost, price, durationDay, priority } =
      parsed.data;

    const vipPackage = await db.vipPackage.create({
      data: {
        name,
        description,
        numPost,
        price,
        durationDay,
        priority: VIP_PACKAGE_LEVEL[priority as unknown as string],
      },
    });

    sendResponse(res, {
      status: 201,
      success: true,
      data: vipPackage,
      message_code: MESSAGE_CODES.SUCCESS.CREATED_SUCCESS,
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

export const getVipPackage = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";
    const priority = (req.query.priority as string) || "";

    const whereClause = {
      isDeleted: false,
      ...(search && {
        name: { contains: search },
      }),
      ...(priority !== "" && {
        priority: VIP_PACKAGE_LEVEL[priority as unknown as string],
      }),
    };

    const total = await db.vipPackage.count({ where: whereClause });
    const totalPages = calculationTotalPages(total, size);

    const vipPackage = await db.vipPackage.findMany({
      where: whereClause,
      skip,
      take: size,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (vipPackage) {
      sendListResponse(res, {
        status: 200,
        success: true,
        data: vipPackage,
        pagination: {
          total,
          page,
          size,
          totalPages,
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

export const getVipPackageForCompany = async (req: Request, res: Response) => {
  try {
    const vipPackage = await db.vipPackage.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: {
        price: "asc",
      },
    });

    if (vipPackage) {
      sendListResponse(res, {
        status: 200,
        success: true,
        data: vipPackage,
        pagination: {
          total: vipPackage.length,
          page: 1,
          size: vipPackage.length,
          totalPages: 1,
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

export const getVipPackageById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (!id) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.ID_REQUIRED,
      });
      return;
    }

    const vipPackage = await db.vipPackage.findUnique({
      where: { id, isDeleted: false },
    });

    if (!vipPackage) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    sendResponse(res, {
      status: 200,
      success: true,
      data: vipPackage,
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

export const updateVipPackage = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (!id) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.ID_REQUIRED,
      });
      return;
    }

    const parsed = vipPackageSchema.safeParse(req.body);
    if (!parsed.success) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.VALIDATION_ERROR,
        errors: parsed.error.errors.map((err) => ({
          field: err.path.join("."),
          error_code: err.message,
        })),
      });
      return;
    }

    const { name, description, numPost, price, durationDay, priority } =
      parsed.data;

    const existingVipPackage = await db.vipPackage.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingVipPackage) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const now = new Date();
    const activeUsage = await db.company_VipPackage.findFirst({
      where: {
        vipPackageId: id,
        endDate: { gt: now },
      },
    });

    if (activeUsage) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.CANNOT_UPDATE_ACTIVE_PACKAGE,
      });
      return;
    }

    const vipPackage = await db.vipPackage.update({
      where: { id, isDeleted: false },
      data: {
        name,
        description,
        numPost,
        price,
        durationDay,
        priority: VIP_PACKAGE_LEVEL[priority as unknown as string],
      },
    });

    sendResponse(res, {
      status: 200,
      success: true,
      data: vipPackage,
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

export const deleteVipPackage = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (!id) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.ID_REQUIRED,
      });
      return;
    }

    const existingVipPackage = await db.vipPackage.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!existingVipPackage) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const now = new Date();
    const companyVipPackageCount = await db.company_VipPackage.count({
      where: { vipPackageId: id, endDate: { gt: now } },
    });

    if (companyVipPackageCount > 0) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.CANNOT_UPDATE_ACTIVE_PACKAGE,
      });
      return;
    }

    const deletedVipPackage = await db.vipPackage.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });
    sendResponse(res, {
      status: 200,
      success: true,
      data: deletedVipPackage,
      message_code: MESSAGE_CODES.SUCCESS.DELETED_SUCCESS,
    });
    return;
  } catch (error) {
    console.error(error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: MESSAGE_CODES.SEVER.INTERNAL_SERVER_ERROR,
    });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const parsed = orderVipPackageSchema.safeParse(req.body);
    if (!parsed.success) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.VALIDATION_ERROR,
        errors: parsed.error.errors.map((err) => ({
          field: err.path.join("."),
          error_code: err.message,
        })),
      });
      return;
    }

    const companyId = req.user?.id;

    const { vipPackageId } = parsed.data;

    const [company, vipPackage] = await Promise.all([
      db.company.findFirst({
        where: {
          accountId: companyId,
        },
      }),
      db.vipPackage.findFirst({
        where: {
          id: vipPackageId,
          isDeleted: false,
        },
      }),
    ]);

    if (!company || !vipPackage) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }
    const endDate = new Date();
    endDate.setUTCDate(endDate.getUTCDate() + vipPackage.durationDay);
    endDate.setUTCHours(0, 0, 0, 0);

    const vipPackageOrder = await db.company_VipPackage.create({
      data: {
        companyId: company.id,
        vipPackageId: vipPackage.id,
        endDate,
        remainingPosts: vipPackage.numPost,
      },
    });

    sendResponse(res, {
      status: 201,
      success: true,
      data: vipPackageOrder,
      message_code: MESSAGE_CODES.SUCCESS.CREATED_SUCCESS,
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

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (!id) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.ID_REQUIRED,
      });
      return;
    }

    const cvp = await db.company_VipPackage.findUnique({
      where: { id },
      select: {
        id: true,
        endDate: true,
        remainingPosts: true,
        status: true,
        createdAt: true,
        vipPackage: true,
      },
    });

    if (!cvp) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    sendResponse(res, {
      status: 200,
      success: true,
      data: cvp,
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
