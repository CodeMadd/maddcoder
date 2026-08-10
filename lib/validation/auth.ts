import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email").max(160),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").max(160),
  password: z.string().min(1, "Password is required").max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
