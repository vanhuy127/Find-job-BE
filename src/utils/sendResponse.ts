import { Response } from "express";

export interface FieldError {
  field: string;
  error_code: string;
}

export interface IResponse<T> {
  success: boolean;
  message_code: string | null;
  data: T | null;
  accessToken: string | null;
  error_code: string | null;
  errors: FieldError[];
}

export function sendResponse<T>(
  res: Response,
  {
    status = 200,
    success = true,
    data = null,
    message_code = null,
    error_code = null,
    errors = [],
  }: {
    status?: number;
    success?: boolean;
    data?: T | null;
    message_code?: string | null;
    error_code?: string | null;
    errors?: FieldError[];
  }
): Response<IResponse<T>> {
  return res.status(status).json({
    success,
    message_code,
    data,
    error_code,
    errors,
  });
}

export interface IListResponse<T> {
  success: boolean;
  message_code: string | null;
  data: {
    data: T | null;
    pagination: {
      total: number;
      page: number;
      size: number;
      totalPages: number;
    };
  };
  error_code: string | null;
  errors: FieldError[];
}

export function sendListResponse<T>(
  res: Response,
  {
    status = 200,
    success = true,
    data = null,
    pagination = {
      total: 0,
      page: 1,
      size: 10,
      totalPages: 1,
    },
    message_code = null,
    error_code = null,
    errors = [],
  }: {
    status?: number;
    success?: boolean;
    data?: T | null;
    pagination?: {
      total: number;
      page: number;
      size: number;
      totalPages: number;
    };
    message_code?: string | null;
    error_code?: string | null;
    errors?: FieldError[];
  }
): Response<IListResponse<T>> {
  return res.status(status).json({
    success,
    message_code,
    data: {
      data,
      pagination,
    },
    error_code,
    errors,
  });
}
