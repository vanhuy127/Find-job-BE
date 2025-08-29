import db from "@/config/db";
import { Request, Response } from "express";
import {
  sendListResponse,
  sendResponse,
  parseDate,
  calculationSkip,
  calculationTotalPages,
} from "@/utils";
import { isValid, min } from "date-fns";
import { DATE_FORMAT } from "@/constants/date";
import { DEFAULT_PAGE, DEFAULT_SIZE, MESSAGE_CODES } from "@/constants";
import { jobSchema } from "@/validations";
import { JobLevel, JobType } from "@prisma/client";

export const createJob = async (req: Request, res: Response) => {
  try {
    const parsed = jobSchema.safeParse(req.body);
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

    const {
      title,
      description,
      address,
      province,
      jobType,
      level,
      numApplications,
      salaryMin,
      salaryMax,
      endDate,
      skills,
    } = parsed.data;

    const parsedEndDate = parseDate(endDate, DATE_FORMAT);
    if (!isValid(parsedEndDate)) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.INVALID_DATE_FORMAT,
      });
      return;
    }

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
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const job = await db.job.create({
      data: {
        title,
        description,
        address,
        jobType,
        level,
        salaryMin,
        salaryMax,
        endDate: parsedEndDate,
        company: { connect: { id: company.id } },
        numApplications,
        province: { connect: { id: province } },
        skills: {
          create: skills.map((skill) => ({
            skill: { connect: { id: skill } },
          })),
        },
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    sendResponse(res, {
      status: 201,
      success: true,
      data: job,
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

export const getJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";
    const province = (req.query.province as string)?.trim().toLowerCase() || "";
    const jobType = (req.query.jobType as string)?.trim().toLowerCase() || "";
    const level = (req.query.level as string)?.trim().toLowerCase() || "";

    const jobTypeValue = Object.values(JobType).includes(
      jobType.toUpperCase() as JobType
    )
      ? (jobType.toUpperCase() as JobType)
      : undefined;

    const levelValue = Object.values(JobLevel).includes(
      level.toUpperCase() as JobLevel
    )
      ? (level.toUpperCase() as JobLevel)
      : undefined;

    const whereClause = {
      isDeleted: false,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { address: { contains: search } },
        ],
      }),
      ...(province && {
        province: {
          name: {
            contains: province,
          },
        },
      }),
      ...(jobType && {
        jobType: {
          equals: jobTypeValue,
        },
      }),
      ...(level && {
        level: {
          equals: levelValue,
        },
      }),
    };

    const total = await db.job.count({
      where: whereClause,
    });
    const totalPages = calculationTotalPages(total, size);

    const jobs = await db.job.findMany({
      where: whereClause,
      skip,
      take: size,
      include: {
        province: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
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

export const getJobsForUser = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";
    const province = (req.query.province as string)?.trim().toLowerCase() || "";
    const jobType = (req.query.jobType as string)?.trim().toLowerCase() || "";
    const level = (req.query.level as string)?.trim().toLowerCase() || "";
    const minSalaryParam = req.query.minSalary
      ? parseInt(req.query.minSalary as string)
      : undefined;

    const maxSalaryParam = req.query.maxSalary
      ? parseInt(req.query.maxSalary as string)
      : undefined;

    let skills: string[] = [];

    const rawSkills = req.query["skills[]"];

    if (rawSkills) {
      if (Array.isArray(rawSkills)) {
        // ép kiểu từng phần tử sang string
        skills = rawSkills.map((s) => String(s).trim());
      } else {
        // chỉ có 1 giá trị
        skills = [String(rawSkills).trim()];
      }
    }

    const jobTypeValue = Object.values(JobType).includes(
      jobType.toUpperCase() as JobType
    )
      ? (jobType.toUpperCase() as JobType)
      : undefined;

    const levelValue = Object.values(JobLevel).includes(
      level.toUpperCase() as JobLevel
    )
      ? (level.toUpperCase() as JobLevel)
      : undefined;

    const whereClause = {
      isDeleted: false,
      endDate: {
        gte: new Date(), // endDate >= ngày hiện tại
      },
      ...(search && {
        OR: [
          { title: { contains: search } },
          { address: { contains: search } },
          {
            company: {
              name: { contains: search },
            },
          },
        ],
      }),
      ...(province && {
        province: {
          name: {
            contains: province,
          },
        },
      }),
      ...(jobType && {
        jobType: {
          equals: jobTypeValue,
        },
      }),
      ...(level && {
        level: {
          equals: levelValue,
        },
      }),
      ...(minSalaryParam && {
        salaryMax: { gt: minSalaryParam },
      }),
      ...(maxSalaryParam && {
        salaryMin: { lt: maxSalaryParam },
      }),
      ...(skills.length > 0 && {
        skills: {
          some: {
            skill: {
              name: { in: skills },
            },
          },
        },
      }),
    };

    const total = await db.job.count({
      where: whereClause,
    });
    const totalPages = calculationTotalPages(total, size);

    const jobs = await db.job.findMany({
      where: whereClause,
      skip,
      take: size,
      include: {
        province: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
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

export const getJobsCurrentCompany = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const size = parseInt(req.query.size as string) || DEFAULT_SIZE;
    const skip = calculationSkip(page, size);
    const search = (req.query.search as string)?.trim().toLowerCase() || "";
    const province = (req.query.province as string)?.trim().toLowerCase() || "";
    const jobType = (req.query.jobType as string)?.trim().toLowerCase() || "";
    const level = (req.query.level as string)?.trim().toLowerCase() || "";

    const jobTypeValue = Object.values(JobType).includes(
      jobType.toUpperCase() as JobType
    )
      ? (jobType.toUpperCase() as JobType)
      : undefined;

    const levelValue = Object.values(JobLevel).includes(
      level.toUpperCase() as JobLevel
    )
      ? (level.toUpperCase() as JobLevel)
      : undefined;

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
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const whereClause = {
      isDeleted: false,
      company: {
        accountId: companyId,
      },
      ...(search && {
        OR: [
          { title: { contains: search } },
          { address: { contains: search } },
        ],
      }),
      ...(province && {
        province: {
          name: {
            contains: province,
          },
        },
      }),
      ...(jobType && {
        jobType: {
          equals: jobTypeValue,
        },
      }),
      ...(level && {
        level: {
          equals: levelValue,
        },
      }),
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
            accountId: true,
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
        data: jobs,
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

export const getJobById = async (req: Request, res: Response) => {
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

    const job = await db.job.findUnique({
      where: { id, isDeleted: false },
      include: {
        province: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    const approvedCount = await db.application.count({
      where: {
        jobId: id,
        status: "APPROVED",
      },
    });

    if (!job) {
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
      data: {
        ...job,
        numApplicationsApproved: approvedCount,
        skills: job.skills.map((js) => js.skill),
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

export const updateJob = async (req: Request, res: Response) => {
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

    const parsed = jobSchema.safeParse(req.body);
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

    const {
      title,
      description,
      address,
      province,
      jobType,
      numApplications,
      level,
      salaryMin,
      salaryMax,
      endDate,
      skills,
    } = parsed.data;

    const parsedEndDate = parseDate(endDate, DATE_FORMAT);
    if (!isValid(parsedEndDate)) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.INVALID_DATE_FORMAT,
      });
      return;
    }

    //check if company exists
    const existingJob = await db.job.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        applications: true,
      },
    });
    if (!existingJob) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }
    //số lương đơn đã nộp
    const applicationCount = existingJob.applications.length;

    if (applicationCount > existingJob.numApplications) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.INVALID_NUM_APPLICATIONS,
      });
      return;
    }

    // 🟢 Transaction để đảm bảo atomic update
    const updatedJob = await db.$transaction(async (tx) => {
      // update job fields
      const job = await tx.job.update({
        where: { id, isDeleted: false },
        data: {
          title,
          description,
          address,
          jobType,
          level,
          numApplications,
          salaryMin,
          salaryMax,
          endDate: parsedEndDate,
          provinceId: province,
        },
      });

      if (skills && Array.isArray(skills)) {
        // xóa skills cũ
        await tx.jobSkill.deleteMany({
          where: { jobId: id },
        });

        // tạo lại skills mới
        await tx.jobSkill.createMany({
          data: skills.map((skillId: string) => ({
            jobId: id,
            skillId,
          })),
        });
      }

      return job;
    });

    const jobWithSkills = await db.job.findUnique({
      where: { id },
      include: {
        skills: { include: { skill: true } },
      },
    });

    sendResponse(res, {
      status: 200,
      success: true,
      data: jobWithSkills,
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

export const deleteJob = async (req: Request, res: Response) => {
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

    const existingJob = await db.job.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!existingJob) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    //kiểm tra xem khóa chính có tồn tại ở bảng khác hay không
    const applicationCount = await db.application.count({
      where: { jobId: id },
    });

    const jobSkillCount = await db.jobSkill.count({
      where: { jobId: id },
    });

    if (applicationCount > 0 || jobSkillCount > 0) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.VALIDATION.IN_USE,
      });
      return;
    }

    const deletedJob = await db.job.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });
    if (deletedJob) {
      sendResponse(res, {
        status: 200,
        success: true,
        data: deletedJob,
        message_code: MESSAGE_CODES.SUCCESS.DELETED_SUCCESS,
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
