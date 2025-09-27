import { PASSWORD_REGEX } from "@/constants";
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

export const changePasswordSchema = z.object({
  password: passwordSchema,
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
