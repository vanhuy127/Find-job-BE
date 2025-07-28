import db from "@/config/db";
import { Request, Response } from "express";
import {
  sendListResponse,
  sendResponse,
  calculationSkip,
  calculationTotalPages,
} from "@/utils";
import { DEFAULT_PAGE, DEFAULT_SIZE, MESSAGE_CODES } from "@/constants";

export const getResumes = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";
    const status = (req.query.status as string)?.trim().toUpperCase() || "";

    const companyId = req.user?.id;

    const company = await db.company.findUnique({
      where: {
        accountId: companyId,
        status: 1,
      },
    });

    if (!company) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.COMPANY_NOT_FOUND,
      });
      return;
    }

    const whereClause: any = {
      job: {
        companyId: company.id,
        isDeleted: false,
      },
      ...(status && {
        status,
      }),
      ...(search && {
        OR: [
          {
            job: {
              title: {
                contains: search,
              },
            },
          },
          {
            user: {
              email: {
                contains: search,
              },
            },
          },
        ],
      }),
    };

    const total = await db.application.count({ where: whereClause });
    const totalPages = calculationTotalPages(total, size);

    const applications = await db.application.findMany({
      where: whereClause,
      skip,
      take: size,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        job: {
          createdAt: "desc",
        },
      },
    });

    sendListResponse(res, {
      status: 200,
      success: true,
      data: applications,
      pagination: {
        total,
        page,
        size,
        totalPages,
      },
      message_code: MESSAGE_CODES.SUCCESS.GET_ALL_SUCCESS,
    });
    return;
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

export const getResumeById = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const id = req.params.id;

    const company = await db.company.findUnique({
      where: {
        accountId: companyId,
        status: 1,
      },
    });

    if (!company) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.COMPANY_NOT_FOUND,
      });
      return;
    }

    if (!id) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.ID_REQUIRED,
      });
      return;
    }

    const application = await db.application.findUnique({
      where: { id, job: { isDeleted: false } },
      include: {
        user: true,
        job: {
          include: {
            company: {
              select: {
                accountId: true,
              },
            },
            skills: {
              select: {
                skill: true,
              },
            },
          },
        },
      },
    });

    if (application?.job.company.accountId !== companyId) {
      sendResponse(res, {
        status: 403,
        success: false,
        error_code: MESSAGE_CODES.AUTH.FORBIDDEN,
      });
      return;
    }

    if (!application) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const approvedCount = await db.application.count({
      where: {
        jobId: id,
        status: "APPROVED",
      },
    });

    sendResponse(res, {
      status: 200,
      success: true,
      data: {
        ...application,
        job: {
          ...application.job,
          numApplicationsApproved: approvedCount,
          skills: application.job.skills.map((js) => js.skill),
        },
      },
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

export const changeStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!id) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.ID_REQUIRED,
      });
      return;
    }

    const existingResume = await db.application.findUnique({
      where: {
        id,
      },
    });

    if (!existingResume) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const validStatuses = ["APPROVED", "REJECTED"];

    let changeStatus = null;

    if (existingResume.status === "PENDING" && validStatuses.includes(status)) {
      changeStatus = await db.application.update({
        where: { id },
        data: { status },
      });
    }

    if (changeStatus) {
      sendResponse(res, {
        status: 200,
        success: true,
        data: changeStatus,
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
