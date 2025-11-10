import { VIP_PACKAGE_LEVEL_ARRAY } from "@/constants";
import { z } from "zod";

export const vipPackageSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  numPost: z.number().min(1, "Num post of posts must be > 0"),
  price: z.number().min(1000, "Price must be >= 1000"),
  durationDay: z.number().min(1, "Duration day must be > 0"),
  priority: z.enum(VIP_PACKAGE_LEVEL_ARRAY, {
    errorMap: () => ({ message: "Invalid VIP package level" }),
  }),
});

export const orderVipPackageSchema = z.object({
  vipPackageId: z.string().uuid("Invalid VIP Package ID"),
});
