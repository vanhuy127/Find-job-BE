import db from "@/config/db";
import { Request, Response } from "express";
import {
  calculationSkip,
  calculationTotalPages,
  sendListResponse,
  sendResponse,
} from "@/utils";
import {
  MESSAGE_CODES,
  DEFAULT_PAGE,
  MAX_DEFAULT_SIZE,
  DEFAULT_SIZE,
} from "@/constants";
import { skillSchema } from "@/validations/skill";

export const createSkill = async (req: Request, res: Response) => {
  try {
    const parsed = skillSchema.safeParse(req.body);
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

    const { name } = parsed.data;

    const existing = await db.skill.findFirst({ where: { name } });
    if (existing) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.NAME_ALREADY_EXISTS,
      });
      return;
    }

    const skill = await db.skill.create({
      data: {
        name,
      },
    });

    sendResponse(res, {
      status: 201,
      success: true,
      data: skill,
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

export const editSkill = async (req: Request, res: Response) => {
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

    const parsed = skillSchema.safeParse(req.body);
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

    const { name } = parsed.data;

    const existing = await db.skill.findFirst({
      where: { name, id: { not: id } },
    });
    if (existing) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.NAME_ALREADY_EXISTS,
      });
      return;
    }

    const skill = await db.skill.update({
      where: { id },
      data: { name },
    });

    sendResponse(res, {
      status: 200,
      success: true,
      data: skill,
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

export const getSkills = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";

    const whereClause = {
      isDeleted: false,
      ...(search && {
        OR: [{ name: { contains: search } }],
      }),
    };
    const total = await db.skill.count({
      where: whereClause,
    });

    const totalPages = calculationTotalPages(total, size);

    const skills = await db.skill.findMany({
      skip,
      take: size,
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (skills) {
      sendListResponse(res, {
        status: 200,
        success: true,
        data: skills,
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

export const getSkillById = async (req: Request, res: Response) => {
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

    const skill = await db.skill.findUnique({
      where: { id, isDeleted: false },
    });

    if (!skill) {
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
      data: skill,
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

export const deleteSkill = async (req: Request, res: Response) => {
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

    // Kiểm tra xem skill có đang được dùng trong bảng UserSkill không
    const userSkillCount = await db.userSkill.count({
      where: { skillId: id },
    });

    // Kiểm tra xem skill có đang được dùng trong bảng JobSkill không
    const jobSkillCount = await db.jobSkill.count({
      where: { skillId: id },
    });

    if (userSkillCount > 0 || jobSkillCount > 0) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.IN_USE,
      });
      return;
    }

    const skill = await db.skill.update({
      where: { id },
      data: { isDeleted: true },
    });

    sendResponse(res, {
      status: 200,
      success: true,
      message_code: MESSAGE_CODES.SUCCESS.DELETED_SUCCESS,
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
