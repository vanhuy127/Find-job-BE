import db from "@/config/db";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  sendListResponse,
  sendResponse,
  parseDate,
  calculationSkip,
  calculationTotalPages,
} from "@/utils";
import { isValid } from "date-fns";
import { DATE_FORMAT } from "@/constants/date";
import { DEFAULT_PAGE, DEFAULT_SIZE, MESSAGE_CODES } from "@/constants";
import { createUserSchema, updateUserSchema } from "@/validations";

export const createUser = async (req: Request, res: Response) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
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

    const { email, password, fullName, dob, phone, address, gender } =
      parsed.data;

    const existingEmail = await db.account.findFirst({
      where: {
        email,
      },
    });

    if (existingEmail) {
      sendResponse(res, {
        status: 409,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.EMAIL_ALREADY_EXISTS,
        errors: [
          {
            field: "email",
            error_code: MESSAGE_CODES.VALIDATION.EMAIL_ALREADY_EXISTS,
          },
        ],
      });
      return;
    }

    const existingPhone = await db.user.findUnique({
      where: {
        phone,
      },
    });

    if (existingPhone) {
      sendResponse(res, {
        status: 409,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.PHONE_ALREADY_EXISTS,
        errors: [
          {
            field: "phone",
            error_code: MESSAGE_CODES.VALIDATION.PHONE_ALREADY_EXISTS,
          },
        ],
      });
      return;
    }

    let parsedDob = parseDate(dob, DATE_FORMAT);
    if (!isValid(parsedDob)) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.INVALID_DATE_FORMAT,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        fullName,
        phone,
        address,
        dob: parsedDob,
        gender: gender as any,
        account: {
          create: {
            email,
            password: hashedPassword,
          },
        },
      },
    });

    sendResponse(res, {
      status: 201,
      success: true,
      data: user,
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

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";
    const status = parseInt(req.query.status as string) ?? -1; // -1 for all, 0 for active, 1 for locked

    let accountCondition: any = {};
    if (status === 0) {
      accountCondition = { isLocked: true };
    } else if (status === 1) {
      accountCondition = { isLocked: false };
    }

    const whereClause: any = {
      ...(search && {
        OR: [
          { email: { contains: search } },
          { fullName: { contains: search } },
        ],
      }),
      ...(status !== -1 && {
        account: {
          ...accountCondition,
        },
      }),
    };

    const total = await db.user.count({ where: whereClause });
    const totalPages = calculationTotalPages(total, size);

    const users = await db.user.findMany({
      where: whereClause,
      skip,
      take: size,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        dob: true,
        address: true,
        gender: true,
        accountId: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            isLocked: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (users) {
      sendListResponse(res, {
        status: 200,
        success: true,
        data: users,
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

export const getUserById = async (req: Request, res: Response) => {
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

    const user = await db.user.findUnique({
      where: {
        id: id,
      },
    });
    if (!user) {
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
      data: user,
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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

export const updateUser = async (req: Request, res: Response) => {
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

    const parsed = updateUserSchema.safeParse(req.body);
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

    const { fullName, phone, dob, gender, address } = parsed.data;

    //check if user exists
    const existingUser = await db.user.findUnique({
      where: {
        id,
      },
    });
    if (!existingUser) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const existingPhone = await db.user.findUnique({
      where: {
        phone,
        NOT: {
          id,
        },
      },
    });

    if (existingPhone) {
      sendResponse(res, {
        status: 409,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.PHONE_ALREADY_EXISTS,
        errors: [
          {
            field: "phone",
            error_code: MESSAGE_CODES.VALIDATION.PHONE_ALREADY_EXISTS,
          },
        ],
      });
      return;
    }

    let parsedDob = parseDate(dob, DATE_FORMAT);
    if (!isValid(parsedDob)) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.INVALID_DATE_FORMAT,
      });
    }

    const updatedUser = await db.user.update({
      where: {
        id,
      },
      data: {
        fullName,
        phone,
        dob: parsedDob,
        gender: gender as any,
        address,
      },
    });
    if (updatedUser) {
      sendResponse(res, {
        status: 200,
        success: true,
        data: updatedUser,
        message_code: MESSAGE_CODES.SUCCESS.UPDATED_SUCCESS,
      });
      return;
    }
  } catch (error) {
    console.error(error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: MESSAGE_CODES.SEVER.INTERNAL_SERVER_ERROR,
    });
  }
};
