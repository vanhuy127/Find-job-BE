import db from "@/config/db";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailHTML,
  sendResponse,
} from "@/utils";
import { addMinutes } from "date-fns";
import { Resend } from "resend";
import { MESSAGE_CODES } from "@/constants";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
} from "@/validations";
import crypto from "crypto";
import { Role } from "@prisma/client";

const resend = new Resend(process.env.MAIL_API_KEY);

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
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

    const { email, password } = parsed.data;

    const account = await db.account.findFirst({
      where: { email: email.trim() },
    });

    if (!account || !(await bcrypt.compare(password, account.password))) {
      sendResponse(res, {
        status: 401,
        success: false,
        error_code: MESSAGE_CODES.AUTH.INVALID_CREDENTIALS,
        errors: [{ field: "email", error_code: "invalid email or password" }],
      });
      return;
    }

    if (account.isLocked) {
      sendResponse(res, {
        status: 403,
        success: false,
        error_code: MESSAGE_CODES.AUTH.ACCOUNT_IS_LOCKED,
      });
      return;
    }

    if (account.role === Role.COMPANY) {
      const company = await db.company.findUnique({
        where: { accountId: account.id },
      });

      if (!company) {
        sendResponse(res, {
          status: 404,
          success: false,
          error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
        });

        return;
      }

      if (company.status !== 1) {
        sendResponse(res, {
          status: 403,
          success: false,
          error_code: MESSAGE_CODES.AUTH.COMPANY_NOT_APPROVED,
        });
        return;
      }
    }

    const userInfo = {
      id: account.id,
      email: account.email,
      role: account.role,
    };

    const accessToken = generateAccessToken({
      id: account.id,
      email: account.email,
      role: account.role,
    });

    const refreshToken = generateRefreshToken({
      id: account.id,
      email: account.email,
      role: account.role,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth/refresh-token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
      status: 200,
      success: true,
      data: { ...userInfo, accessToken },
      message_code: "LOGIN_SUCCESS",
    });
  } catch (error) {
    console.error("Error during user authorization:", error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: "INTERNAL_SERVER_ERROR",
    });
    return;
  }
};

export const refreshAccessToken = (req: Request, res: Response) => {
  try {
    const token = req.cookies.refresh_token;
    if (!token) {
      sendResponse(res, {
        status: 401,
        success: false,
        error_code: "REFRESH_TOKEN_MISSING",
      });
      return;
    }

    const { decoded, error } = verifyRefreshToken(token);

    if (error) {
      const errorCode =
        error === "TOKEN_EXPIRED"
          ? "REFRESH_TOKEN_EXPIRED"
          : "INVALID_REFRESH_TOKEN";

      sendResponse(res, {
        status: 401,
        success: false,
        error_code: errorCode,
      });
      return;
    }

    if (!decoded || !decoded.id || !decoded.email || !decoded.role) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: "INVALID_REFRESH_TOKEN_PAYLOAD",
      });
      return;
    }

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    sendResponse(res, {
      status: 200,
      success: true,
      message_code: "REFRESH_TOKEN_SUCCESS",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    sendResponse(res, {
      status: 401,
      success: false,
      error_code: "INVALID_REFRESH_TOKEN",
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const { id, email, role } = req.user;

    const userInfo = {
      id,
      email,
      role,
    };

    if (!userInfo) {
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
      data: userInfo,
      message_code: "GET_ME_SUCCESS",
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: MESSAGE_CODES.SEVER.INTERNAL_SERVER_ERROR,
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
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

    const { newPassword } = parsed.data;

    const { id } = req.user;

    //check if user exists
    const existingUser = await db.account.findUnique({
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

    //hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    //update user password
    const updatedUser = await db.account.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });
    if (updatedUser) {
      sendResponse(res, {
        status: 200,
        success: true,
        data: { email: updatedUser.email },
        message_code: MESSAGE_CODES.SUCCESS.UPDATED_SUCCESS,
      });
    }
  } catch (error) {
    console.log(error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: MESSAGE_CODES.SEVER.INTERNAL_SERVER_ERROR,
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("refresh_token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/v1/auth/refresh-token",
    });
    sendResponse(res, {
      status: 200,
      success: true,
      message_code: "LOGGED_OUT",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const lockAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    console.log(id);
    if (!id) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.ID_REQUIRED,
      });
      return;
    }

    const account = await db.account.update({
      where: {
        id,
      },
      data: {
        isLocked: true,
      },
    });

    if (account) {
      sendResponse(res, {
        status: 200,
        success: true,
        message_code: MESSAGE_CODES.SUCCESS.UPDATED_SUCCESS,
      });
      return;
    }
  } catch (error) {
    console.log(error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: MESSAGE_CODES.SEVER.INTERNAL_SERVER_ERROR,
    });
  }
};

export const unlockAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    if (!id) {
      sendResponse(res, {
        status: 400,
        success: false,
        message_code: MESSAGE_CODES.VALIDATION.ID_REQUIRED,
      });
      return;
    }

    const account = await db.account.update({
      where: {
        id,
      },
      data: {
        isLocked: false,
      },
    });

    if (account) {
      sendResponse(res, {
        status: 200,
        success: true,
        message_code: MESSAGE_CODES.SUCCESS.UPDATED_SUCCESS,
      });
      return;
    }
  } catch (error) {
    console.log(error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: MESSAGE_CODES.SEVER.INTERNAL_SERVER_ERROR,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);

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

    const { email } = parsed.data;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendResponse(res, {
        status: 404,
        success: false,
        error_code: MESSAGE_CODES.SUCCESS.NOT_FOUND,
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = addMinutes(new Date(), 30);

    await db.account.update({
      where: { id: user.accountId! },
      data: {
        resetToken,
        resetExpires,
      },
    });

    const resetLink = `${process.env.FRONT_END_URL}/${resetToken}`;
    const name = user.fullName;
    const emailHTML = generateEmailHTML({
      name,
      resetLink,
    });
    const { data, error } = await resend.emails.send({
      from: process.env.MY_EMAIL || "",
      to: email,
      subject: "Password Reset Request",
      html: emailHTML,
    });

    if (error) {
      console.error(error);
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.FAIL.EMAIL_SEND_FAILED,
        errors: [{ field: "email", error_code: "Email send fail" }],
      });

      return;
    }

    sendResponse(res, {
      status: 200,
      success: true,
      message_code: MESSAGE_CODES.SUCCESS.PASSWORD_RESET_EMAIL_SENT,
      data: { email, resetToken },
    });
  } catch (error) {
    console.error("Error during forgot password:", error);
    sendResponse(res, {
      status: 500,
      success: false,
      error_code: MESSAGE_CODES.SEVER.INTERNAL_SERVER_ERROR,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  try {
    const account = await db.account.findFirst({
      where: {
        resetToken: token,
        resetExpires: { gte: new Date() },
      },
    });

    if (!account) {
      sendResponse(res, {
        status: 400,
        success: false,
        error_code: MESSAGE_CODES.AUTH.INVALID_OR_EXPIRED_TOKEN,
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.account.update({
      where: { id: account.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
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

export const createAdminAccount = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await db.account.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    sendResponse(res, {
      status: 200,
      success: true,
      data: admin,
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
