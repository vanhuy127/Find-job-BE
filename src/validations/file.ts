import { z } from "zod";

export const fileSchema = z
  .any()
  .refine((file) => !!file, "File is required") // phải có file
  .refine(
    (file) =>
      file?.mimetype === "application/pdf" ||
      file?.mimetype?.startsWith("image/"),
    "Only PDF or image files are allowed"
  )
  .refine(
    (file) => file?.size <= 5 * 1024 * 1024,
    "File size must be under 5MB"
  );
