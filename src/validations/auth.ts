import {
  DOB_REGEX,
  GENDER_ARRAY,
  PASSWORD_REGEX,
  PHONE_REGEX,
} from "@/constants";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(25, "Password must be at most 25 characters")
  .regex(
    PASSWORD_REGEX,
    "Password must include uppercase, lowercase, number, and special character"
  );

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(10, "Full name must be at least 10 characters")
    .max(100, "Full name must be at most 100 characters"),
  email: z.string().email(),
  password: passwordSchema,
  dob: z.string().regex(DOB_REGEX, {
    message: "Date of birth must be in the format dd-MM-yyyy.",
  }),
  phone: z.string().regex(PHONE_REGEX, { message: "Phone invalid." }),
  address: z
    .string()
    .min(3, { message: "Address must be at least 3 characters long." })
    .max(100, { message: "Address cannot exceed 100 characters." }),
  gender: z.enum(GENDER_ARRAY, {
    errorMap: () => ({
      message: "Gender must be one of: MALE, FEMALE, OTHER.",
    }),
  }),
});

export const changePasswordSchema = z.object({
  password: passwordSchema,
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
