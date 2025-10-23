import {
  DOB_REGEX,
  GENDER_ARRAY,
  PASSWORD_REGEX,
  PHONE_REGEX,
} from "@/constants";
import { z } from "zod";

export const createUserSchema = z.object({
  email: z
    .string()
    .email({ message: "Email invalid." })
    .nonempty({ message: "Email is required." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(25, { message: "Password cannot exceed 25 characters." })
    .regex(PASSWORD_REGEX, {
      message:
        "Password must include uppercase, lowercase, a number, and a special character.",
    }),
  fullName: z
    .string()
    .min(3, { message: "Full name must be at least 3 characters long." })
    .max(50, { message: "Full name cannot exceed 50 characters." }),
  dob: z.string().regex(DOB_REGEX, {
    message: "Date of birth must be in the format dd-MM-yyyy.",
  }),
  phone: z
    .string()
    .regex(PHONE_REGEX, { message: "Please enter a valid phone number." }),
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

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "Full name must be at least 3 characters long." })
    .max(50, { message: "Full name cannot exceed 50 characters." }),
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
