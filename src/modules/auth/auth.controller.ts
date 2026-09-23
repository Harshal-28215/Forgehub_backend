import type { Request, Response } from "express";
import { registerSchema } from "./auth.validation.js";
import { getCurrentUser, logoutAllSession, logoutSession, refreshUser, registerUser } from "./auth.service.js";
import { loginSchema } from "./auth.validation.js";
import { loginUser } from "./auth.service.js";
import { AppError } from "../../utils/app-error.js";
// `user` is added to Express `Request` via global augmentation in `src/types/express.d.ts`

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




export const login = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);

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
        const result = await loginUser(
            parsed.data,
            req.get("user-agent"),
            req.ip,
        );

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
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

export const refresh = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const refreshToken = req.body?.refreshToken;

    if (typeof refreshToken !== "string" || refreshToken.trim().length === 0) {
        res.status(400).json({
            success: false,
            error: {
                code: "INVALID_REFRESH_TOKEN",
                message: "Invalid refresh token",
            },
        });

        return;
    }

    try {
        const result = await refreshUser(refreshToken);
        res.status(200).json({
            success: true,
            data: result,
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
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
}



export const logout = async (
    req: Request,
    res: Response
) => {
    const refreshToken = req.body.refreshToken

    if (typeof refreshToken !== "string" || refreshToken.length === 0) {
        res.status(400).json({
            success: false,
            error: {
                code: "REFRESH_TOKEN_REQUIRED",
                message: "Refresh token is required",
            },
        })

        return
    }

    try {
        await logoutSession(refreshToken);

        res.status(200).json({
            success: true,
            data: {
                message: "Logged out successfully",
            },
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
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
}


export const logoutAll = async (
    req: Request,
    res: Response
): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({
            success: false,
            error: {
                code: "AUTHENTICATION_REQUIRED",
                message: "Authentication is required",
            },
        });

        return;
    }

    try {
        await logoutAllSession(userId)

        res.status(200).json({
            success: true,
            data: {
                message: "All sessions logged out successfully",
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong",
            },
        });
    }
}


export const getMe = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Authentication is required",
                },
            });

            return;
        }

        const user = await getCurrentUser(userId)

        res.status(200).json({
            success: true,
            data: user
        })
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
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
}