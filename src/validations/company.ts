import { PASSWORD_REGEX } from "@/constants";
import { z } from "zod";
import { fileSchema } from "./file";

export const createCompanySchema = z.object({
  email: z
    .string()
    .email({ message: "Email invalid." })
    .nonempty({ message: "Email required." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(25, { message: "Password cannot exceed 25 characters." })
    .regex(PASSWORD_REGEX, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
  name: z
    .string()
    .min(3, { message: "Company name must be at least 3 characters long." })
    .max(100, { message: "Company name cannot exceed 100 characters." }),
  description: z.string().optional(),
  address: z
    .string()
    .min(3, { message: "Address must be at least 3 characters long." }),
  provinceId: z.string(),
  website: z
    .string()
    .url({ message: "Please enter a valid website URL." })
    .optional(),
  taxCode: z
    .string()
    .min(5, { message: "Tax code must be at least 5 characters long." }),
  businessLicensePath: fileSchema,
  logo: fileSchema,
});

export const updateCompanySchema = z.object({
  description: z.string().optional(),
  address: z
    .string()
    .min(3, { message: "Address must be at least 3 characters long." }),
  provinceId: z.string(),
  website: z
    .string()
    .url({ message: "Please enter a valid website URL." })
    .optional(),
  logo: z.string().min(3, { message: "Please upload a company logo." }),
});

export const approveCompanySchema = z
  .object({
    status: z.number(),
    reasonReject: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === 0) {
        return data.reasonReject && data.reasonReject.trim().length > 0;
      }
      return true;
    },
    {
      message:
        "Reason for rejection is required when approval is set to false.",
      path: ["reasonReject"],
    }
  );
