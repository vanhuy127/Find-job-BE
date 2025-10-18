import db from "@/config/db";
import { Request, Response } from "express";
import {
  sendListResponse,
  sendResponse,
  calculationSkip,
  calculationTotalPages,
} from "@/utils";
import { DEFAULT_PAGE, DEFAULT_SIZE, MESSAGE_CODES } from "@/constants";
import { uploadResumeSchema } from "@/validations";
import { v2 as cloudinary } from "cloudinary";
import { ApplicationStatus } from "@prisma/client";

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

export const uploadResume = async (req: Request, res: Response) => {
  let uploadedPublicId;
  try {
    const fileData = req.file;
    const { jobId, coverLetter } = req.body;
    console.log(fileData);

    const userId = req.user.id;
    if (!fileData) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.FILE_REQUIRED,
      });
      return;
    }

    const parsed = uploadResumeSchema.safeParse({
      ...req.body,
      file: fileData,
    });

    if (!parsed.success) {
      if (fileData && uploadedPublicId)
        await cloudinary.uploader.destroy(uploadedPublicId);

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

    uploadedPublicId = fileData.filename;

    const [user, job] = await Promise.all([
      db.user.findUnique({ where: { accountId: userId } }),
      db.job.findUnique({ where: { id: jobId } }),
    ]);

    if (!user || !job) {
      if (fileData && uploadedPublicId)
        await cloudinary.uploader.destroy(uploadedPublicId);

      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const application = await db.application.create({
      data: {
        userId: user.id,
        jobId,
        coverLetter: coverLetter || null,
        resumePath: fileData.path,
      },
    });

    sendResponse(res, {
      status: 200,
      success: true,
      message_code: MESSAGE_CODES.SUCCESS.CREATED_SUCCESS,
      data: application,
    });
  } catch (error) {
    console.error(error);
    if (uploadedPublicId) await cloudinary.uploader.destroy(uploadedPublicId);

    sendResponse(res, {
      status: 500,
      success: false,
      error_code: MESSAGE_CODES.SEVER.INTERNAL_SERVER_ERROR,
    });
    return;
  }
};

export const getResumesForUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await db.user.findUnique({ where: { accountId: userId } });
    if (!user) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";
    const status = (req.query.status as string)?.trim().toLowerCase() || "";

    const statusValue = Object.values(ApplicationStatus).includes(
      status.toUpperCase() as ApplicationStatus
    )
      ? (status.toUpperCase() as ApplicationStatus)
      : undefined;

    const whereClause: any = {
      userId: user.id,
      job: {
        isDeleted: false,
      },
      ...(status && {
        status: { equals: statusValue },
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
            job: {
              company: {
                name: {
                  contains: search,
                },
              },
            },
          },
        ],
      }),
    };

    const total = await db.application.count({
      where: whereClause,
    });
    const totalPages = calculationTotalPages(total, size);

    const applications = await db.application.findMany({
      where: whereClause,
      skip,
      take: size,
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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

export const getResumeByIdForUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await db.user.findUnique({ where: { accountId: userId } });
    if (!user) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const id = req.params.id;

    if (!id) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.ID_REQUIRED,
      });
      return;
    }

    const application = await db.application.findFirst({
      where: {
        id: id,
        userId: user.id,
        job: {
          isDeleted: false,
        },
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    });
    sendResponse(res, {
      status: 200,
      success: true,
      data: application,
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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
