import type { Request, Response } from "express";
import { registerSchema } from "./auth.validation.js";
import { registerUser } from "./auth.service.js";

export const register = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid request data",
                details: parsed.error.flatten(),
            },
        });

        return;
    }

    try {
        const result = await registerUser(parsed.data);

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "User with this email already exists"
        ) {
            res.status(409).json({
                success: false,
                error: {
                    code: "EMAIL_ALREADY_EXISTS",
                    message: error.message,
                },
            });

            return;
        }

        console.error(error);

        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong",
            },
        });
    }
};