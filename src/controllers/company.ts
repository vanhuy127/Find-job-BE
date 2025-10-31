import db from "@/config/db";
import { Request, Response } from "express";
import {
  sendListResponse,
  sendResponse,
  calculationSkip,
  calculationTotalPages,
  DATE_SETTINGS,
} from "@/utils";
import { MESSAGE_CODES, DEFAULT_PAGE, DEFAULT_SIZE } from "@/constants";
import { updateCompanySchema } from "@/validations/company";

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";
    const status = parseInt(req.query.status as string) ?? -1; // -1 for all, 0 for active, 1 for locked
    const province = (req.query.province as string)?.trim().toLowerCase() || "";

    let accountCondition: any = {};
    if (status === 0) {
      accountCondition = { isLocked: true };
    } else if (status === 1) {
      accountCondition = { isLocked: false };
    }

    const whereClause = {
      status: 1, // 1 for active companies
      ...(search && {
        OR: [{ email: { contains: search } }, { name: { contains: search } }],
      }),
      ...(status !== -1 && {
        account: {
          ...accountCondition,
        },
      }),
      ...(province && {
        province: {
          name: {
            contains: province,
          },
        },
      }),
    };

    const total = await db.company.count({ where: whereClause });
    const totalPages = calculationTotalPages(total, size);

    const companies = await db.company.findMany({
      where: whereClause,
      skip,
      take: size,
      select: {
        id: true,
        email: true,
        name: true,
        description: true,
        address: true,
        website: true,
        logo: true,
        taxCode: true,
        businessLicensePath: true,
        status: true,
        reasonReject: true,
        createdAt: true,
        updatedAt: true,
        accountId: true,
        account: {
          select: {
            isLocked: true,
          },
        },
        province: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (companies) {
      sendListResponse(res, {
        status: 200,
        success: true,
        data: companies,
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

export const getCompaniesForUser = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";
    const province = (req.query.province as string)?.trim().toLowerCase() || "";

    const whereClause = {
      status: 1, // 1 for active companies
      account: {
        isLocked: false,
      },
      ...(search && {
        OR: [{ email: { contains: search } }, { name: { contains: search } }],
      }),
      ...(province && {
        province: {
          name: {
            contains: province,
          },
        },
      }),
    };

    const total = await db.company.count({ where: whereClause });
    const totalPages = calculationTotalPages(total, size);

    const companiesRaw = await db.company.findMany({
      where: whereClause,
      skip,
      take: size,
      select: {
        id: true,
        email: true,
        name: true,
        description: true,
        address: true,
        website: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
        accountId: true,
        account: {
          select: {
            isLocked: true,
          },
        },
        province: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            jobs: {
              where: {
                isDeleted: false,
                endDate: {
                  gte: DATE_SETTINGS.todayStart,
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const companies = companiesRaw.map((c) => ({
      ...c,
      jobCount: c._count.jobs,
      _count: undefined, // muốn bỏ hẳn _count
    }));

    if (companies) {
      sendListResponse(res, {
        status: 200,
        success: true,
        data: companies,
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

export const getCompanyByIdForUser = async (req: Request, res: Response) => {
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

    const companyRaw = await db.company.findUnique({
      where: {
        id: id,
        status: 1, // 1 for active companies
      },
      select: {
        id: true,
        email: true,
        name: true,
        description: true,
        address: true,
        website: true,
        logo: true,
        taxCode: true,
        businessLicensePath: true,
        status: true,
        reasonReject: true,
        createdAt: true,
        updatedAt: true,
        accountId: true,
        account: {
          select: {
            isLocked: true,
          },
        },
        province: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            jobs: {
              where: {
                isDeleted: false,
                endDate: {
                  gte: DATE_SETTINGS.todayStart,
                },
              },
            },
          },
        },
      },
    });
    const company = {
      ...companyRaw,
      jobCount: companyRaw?._count.jobs,
      _count: undefined,
    };

    if (!company) {
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
      data: company,
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

export const getJobsCurrentCompanyById = async (
  req: Request,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);

    const id = req.params.id;

    const company = await db.company.findUnique({
      where: {
        id: id,
        status: 1,
      },
    });

    if (!company) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const whereClause = {
      isDeleted: false,
      company: {
        id: id,
      },
      endDate: {
        gte: DATE_SETTINGS.todayStart,
      },
    };

    const total = await db.job.count({
      where: whereClause,
    });

    const totalPages = calculationTotalPages(total, size);

    const jobs = await db.job.findMany({
      where: whereClause,
      skip,
      take: size,
      select: {
        id: true,
        title: true,
        description: true,
        address: true,
        jobType: true,
        level: true,
        numApplications: true,
        salaryMin: true,
        salaryMax: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        province: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (jobs) {
      sendListResponse(res, {
        status: 200,
        success: true,
        data: jobs.map((job) => ({
          ...job,
          skills: job.skills.map((skill) => ({
            id: skill.skill.id,
            name: skill.skill.name,
          })),
        })),
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

export const getCompanyById = async (req: Request, res: Response) => {
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

    const company = await db.company.findUnique({
      where: {
        id: id,
        status: 1, // 1 for active companies
      },
      select: {
        id: true,
        email: true,
        name: true,
        description: true,
        address: true,
        website: true,
        logo: true,
        taxCode: true,
        businessLicensePath: true,
        status: true,
        reasonReject: true,
        createdAt: true,
        updatedAt: true,
        accountId: true,
        account: {
          select: {
            isLocked: true,
          },
        },
        province: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!company) {
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
      data: company,
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

export const getCompanyPendingById = async (req: Request, res: Response) => {
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

    const company = await db.company.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        description: true,
        address: true,
        website: true,
        logo: true,
        taxCode: true,
        businessLicensePath: true,
        status: true,
        reasonReject: true,
        createdAt: true,
        updatedAt: true,
        accountId: true,
        account: {
          select: {
            isLocked: true,
          },
        },
        province: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!company) {
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
      data: company,
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

export const updateCompany = async (req: Request, res: Response) => {
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

    const parsed = updateCompanySchema.safeParse(req.body);
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

    const { description, address, provinceId, website, logo } = parsed.data;

    //check if company exists
    const existingCompany = await db.company.findUnique({
      where: {
        id,
        status: 1,
      },
    });
    if (!existingCompany) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const updatedCompany = await db.company.update({
      where: {
        id,
      },
      data: {
        description,
        address,
        provinceId,
        website,
        logo,
      },
    });
    if (updatedCompany) {
      sendResponse(res, {
        status: 200,
        success: true,
        data: updatedCompany,
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

export const getCompaniesWithoutApproved = async (
  req: Request,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";
    const province = (req.query.province as string)?.trim().toLowerCase() || "";
    const status = (req.query.status as string)?.trim().toLowerCase() || "all";

    let companyCondition: any = {};
    if (status === "pending") {
      companyCondition = { status: -1 };
    } else if (status === "rejected") {
      companyCondition = { status: 0 };
    }

    const whereClause = {
      status: { in: [-1, 0] },
      ...(search && {
        OR: [{ email: { contains: search } }, { name: { contains: search } }],
      }),
      ...(province && {
        province: {
          name: {
            contains: province,
          },
        },
      }),
      ...(status !== "all" && {
        ...companyCondition,
      }),
    };

    const total = await db.company.count({ where: whereClause });
    const totalPages = calculationTotalPages(total, size);

    const companies = await db.company.findMany({
      where: whereClause,
      skip,
      take: size,
      select: {
        id: true,
        email: true,
        name: true,
        description: true,
        address: true,
        website: true,
        logo: true,
        taxCode: true,
        businessLicensePath: true,
        status: true,
        reasonReject: true,
        createdAt: true,
        updatedAt: true,
        accountId: true,
        province: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (companies) {
      sendListResponse(res, {
        status: 200,
        success: true,
        data: companies,
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

export const changeStatusCompany = async (req: Request, res: Response) => {
  try {
    const companyId = req.params.id;

    const { status, reasonReject } = req.body;

    if (!companyId) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.ID_REQUIRED,
      });
      return;
    }

    const company = await db.company.findUnique({
      where: { id: companyId, status: -1 },
    });

    if (!company) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const updatedCompany = await db.company.update({
      where: { id: companyId },
      data: {
        status,
        reasonReject: status === 0 ? reasonReject : null,
      },
    });

    sendResponse(res, {
      status: 200,
      success: true,
      data: updatedCompany,
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

export const getAccountCompanyStatus = async (req: Request, res: Response) => {
  try {
    const email =
      typeof req.query.email === "string" ? req.query.email : undefined;

    if (!email) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.EMAIL_REQUIRED,
      });
      return;
    }

    const companyExisting = await db.company.findUnique({
      where: {
        email,
      },
      include: {
        province: true,
      },
    });

    if (!companyExisting) {
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
      data: companyExisting,
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
