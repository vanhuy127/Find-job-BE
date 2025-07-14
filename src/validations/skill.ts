import { z } from "zod";

export const skillSchema = z.object({
  name: z.string().min(3, "Tên kỹ năng phải có ít nhất 3 ký tự"),
});
