import { z } from "zod";

export const registerSchema = z.object({
    email: z
        .string()
        .trim()
        .email()
        .transform((value) => value.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must not exceed 128 characters"),

    firstName: z
        .string()
        .trim()
        .min(1, "First name is required")
        .max(100),

    lastName: z
        .string()
        .trim()
        .min(1, "Last name is required")
        .max(100),

    organizationName: z
        .string()
        .trim()
        .min(2, "Organization name must be at least 2 characters")
        .max(150),
});

export type RegisterInput = z.infer<typeof registerSchema>;