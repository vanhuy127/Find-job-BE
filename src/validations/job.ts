import { DOB_REGEX, JOB_LEVEL_ARRAY, JOB_TYPE_ARRAY } from "@/constants";
import { z } from "zod";

export const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(3, "Address must be at least 3 characters"),
  province: z.string().min(2, "Province is required"),
  jobType: z.enum(JOB_TYPE_ARRAY, {
    errorMap: () => ({ message: "Invalid job type" }),
  }),
  level: z.enum(JOB_LEVEL_ARRAY, {
    errorMap: () => ({ message: "Invalid level" }),
  }),
  numApplications: z.number().min(0, "Number of applications must be >= 0"),
  salaryMin: z.number().min(0, "Minimum salary must be >= 0"),
  salaryMax: z.number().min(0, "Maximum salary must be >= 0"),
  endDate: z.string().regex(DOB_REGEX, "End date must be in dd-MM-yyyy format"),
});
