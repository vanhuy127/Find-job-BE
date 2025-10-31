import db from "@/config/db";
import { JOB_LEVEL_ARRAY, JOB_TYPE_ARRAY, MESSAGE_CODES } from "@/constants";
import { sendResponse } from "@/utils";
import { Request, Response } from "express";

// =================================== statistics for admin ===================================
export const getOverview = async (req: Request, res: Response) => {
  try {
    const [users, companies, jobs, applications] = await Promise.all([
      db.user.count(),
      db.company.count(),
      db.job.count(),
      db.application.count(),
    ]);

    sendResponse(res, {
      status: 200,
      success: true,
      data: {
        usersCount: users,
        companiesCount: companies,
        jobsCount: jobs,
        applicationsCount: applications,
      },
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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

export const getCompanyStats = async (req: Request, res: Response) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      db.company.count({ where: { status: -1 } }),
      db.company.count({ where: { status: 1 } }),
      db.company.count({ where: { status: 0 } }),
    ]);

    const topCompaniesByJobs = await db.company.findMany({
      take: 10,
      orderBy: { jobs: { _count: "desc" } },
      include: { _count: { select: { jobs: true } } },
    });

    sendResponse(res, {
      status: 200,
      success: true,
      data: {
        total: pending + approved + rejected,
        pending,
        approved,
        rejected,
        topCompaniesByJobs: topCompaniesByJobs.map((c) => ({
          id: c.id,
          name: c.name,
          jobsCount: c._count.jobs,
        })),
      },
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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

export const getJobStats = async (req: Request, res: Response) => {
  try {
    const total = await db.job.count();
    const activeJobs = await db.job.count({
      where: { endDate: { gt: new Date() } },
    });

    const byType = Object.fromEntries(
      await Promise.all(
        JOB_TYPE_ARRAY.map(async (type) => [
          type,
          await db.job.count({ where: { jobType: type } }),
        ])
      )
    );

    const byLevel = Object.fromEntries(
      await Promise.all(
        JOB_LEVEL_ARRAY.map(async (level) => [
          level,
          await db.job.count({ where: { level } }),
        ])
      )
    );

    const avg = await db.job.aggregate({
      _avg: { salaryMin: true, salaryMax: true },
    });

    const averageSalary =
      ((avg._avg.salaryMin || 0) + (avg._avg.salaryMax || 0)) / 2;

    sendResponse(res, {
      status: 200,
      success: true,
      data: {
        total,
        activeJobs,
        byType,
        byLevel,
        averageSalary,
      },
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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

export const getApplicationStats = async (req: Request, res: Response) => {
  try {
    const total = await db.application.count();

    const [pending, approved, rejected] = await Promise.all([
      db.application.count({ where: { status: "PENDING" } }),
      db.application.count({ where: { status: "APPROVED" } }),
      db.application.count({ where: { status: "REJECTED" } }),
    ]);

    const acceptanceRate =
      total > 0 ? Number(((approved / total) * 100).toFixed(2)) : 0;

    const rejectRate =
      total > 0 ? Number(((rejected / total) * 100).toFixed(2)) : 0;

    const pendingRate =
      total > 0 ? Number((100 - acceptanceRate - rejectRate).toFixed(2)) : 0;

    sendResponse(res, {
      status: 200,
      success: true,
      data: {
        total,
        approved: {
          num: approved,
          rate: acceptanceRate,
        },
        rejected: {
          num: rejected,
          rate: rejectRate,
        },
        pending: {
          num: pending,
          rate: pendingRate,
        },
      },
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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

export const getTopProvinces = async (req: Request, res: Response) => {
  try {
    const result = await db.$queryRaw<{ province: string; count: number }[]>`
        SELECT 
            p.name AS province,
            COUNT(a.id) AS count
        FROM Application a
        JOIN Job j ON a.jobId = j.id
        LEFT JOIN Province p on j.provinceId = p.id
        GROUP BY j.provinceId
        ORDER BY count DESC
        LIMIT 10;
    `;

    const formatted = result.map((r) => ({
      province: r.province,
      count: Number(r.count), // chuyển BigInt → Number
    }));

    sendResponse(res, {
      status: 200,
      success: true,
      data: formatted,
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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

// =================================== statistics for company ===================================

export const getOverviewForCompany = async (req: Request, res: Response) => {
  try {
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

    const [totalJobs, activeJobs, totalApplications, approvedCount] =
      await Promise.all([
        db.job.count({
          where: { isDeleted: false, company: { accountId: companyId } },
        }),
        db.job.count({
          where: {
            company: { accountId: companyId },
            endDate: { gte: new Date() },
            isDeleted: false,
          },
        }),
        db.application.count({
          where: { job: { company: { accountId: companyId } } },
        }),
        db.application.count({
          where: {
            job: { company: { accountId: companyId }, isDeleted: false },
            status: "APPROVED",
          },
        }),
      ]);
    const acceptedRate =
      totalApplications === 0
        ? 0
        : ((approvedCount / totalApplications) * 100).toFixed(2);

    sendResponse(res, {
      status: 200,
      success: true,
      data: {
        totalJobs,
        activeJobs,
        totalApplications,
        acceptedRate,
      },
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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

export const getJobStatsForCompany = async (req: Request, res: Response) => {
  try {
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

    const byType = Object.fromEntries(
      await Promise.all(
        JOB_TYPE_ARRAY.map(async (type) => [
          type,
          await db.job.count({
            where: {
              jobType: type,
              isDeleted: false,
              company: {
                accountId: companyId,
              },
            },
          }),
        ])
      )
    );

    const byLevel = Object.fromEntries(
      await Promise.all(
        JOB_LEVEL_ARRAY.map(async (level) => [
          level,
          await db.job.count({
            where: {
              level,
              isDeleted: false,
              company: {
                accountId: companyId,
              },
            },
          }),
        ])
      )
    );

    const avg = await db.job.aggregate({
      _avg: { salaryMin: true, salaryMax: true },
    });

    const averageSalary =
      ((avg._avg.salaryMin || 0) + (avg._avg.salaryMax || 0)) / 2;

    sendResponse(res, {
      status: 200,
      success: true,
      data: {
        byType,
        byLevel,
        averageSalary,
      },
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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

export const getApplicationStatsForCompany = async (
  req: Request,
  res: Response
) => {
  try {
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

    const [total, pending, approved, rejected] = await Promise.all([
      db.application.count({
        where: {
          job: { company: { accountId: companyId } },
        },
      }),
      db.application.count({
        where: {
          status: "PENDING",
          job: { company: { accountId: companyId } },
        },
      }),
      db.application.count({
        where: {
          status: "APPROVED",
          job: { company: { accountId: companyId } },
        },
      }),
      db.application.count({
        where: {
          status: "REJECTED",
          job: { company: { accountId: companyId } },
        },
      }),
    ]);

    const acceptanceRate =
      total > 0 ? Number(((approved / total) * 100).toFixed(2)) : 0;

    const rejectRate =
      total > 0 ? Number(((rejected / total) * 100).toFixed(2)) : 0;

    const pendingRate =
      total > 0 ? Number((100 - acceptanceRate - rejectRate).toFixed(2)) : 0;

    sendResponse(res, {
      status: 200,
      success: true,
      data: {
        total,
        approved: {
          num: approved,
          rate: acceptanceRate,
        },
        rejected: {
          num: rejected,
          rate: rejectRate,
        },
        pending: {
          num: pending,
          rate: pendingRate,
        },
      },
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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

export const getCompanyTrendByYear = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.id;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

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

    const result = await db.$queryRaw<{ month: string; count: number }[]>`
      SELECT 
        DATE_FORMAT(a.createdAt, '%Y-%m') as month,
        COUNT(a.id) as count
      FROM Application a
      JOIN Job j ON a.jobId = j.id
      JOIN Company c ON j.companyId = c.id
      WHERE c.accountId = ${companyId}
        AND YEAR(a.createdAt) = ${year}
      GROUP BY month
      ORDER BY month ASC;
    `;

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: `${year}-${String(i + 1).padStart(2, "0")}`,
      count: 0,
    }));

    result.forEach((r) => {
      const monthIndex = months.findIndex((m) => m.month === r.month);
      if (monthIndex !== -1) {
        months[monthIndex].count = Number(r.count);
      }
    });

    sendResponse(res, {
      status: 200,
      success: true,
      data: months,
      message_code: MESSAGE_CODES.SUCCESS.GET_SUCCESS,
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
