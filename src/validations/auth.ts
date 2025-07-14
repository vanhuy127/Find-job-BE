import { PASSWORD_REGEX } from "@/constants";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(6)
    .max(25)
    .regex(
      PASSWORD_REGEX,
      "Password must include uppercase, lowercase, number, and special character"
    ),
});

export const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6)
    .max(25)
    .regex(
      PASSWORD_REGEX,
      "Password must include uppercase, lowercase, number, and special character"
    ),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
