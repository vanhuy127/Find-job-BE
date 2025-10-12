import { z } from "zod";
import { fileSchema } from "./file";

export const uploadResumeSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  coverLetter: z
    .string()
    .min(3, "Cover letter must be at least 3 characters")
    .max(1000, "Cover letter must be under 1000 characters")
    .optional()
    .or(z.literal("")),

  file: fileSchema,
});
