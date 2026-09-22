import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../../utils/jwt.js";

export interface AuthenticationRequest extends Request {
    user: {
        id: string;
    }
}

export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        res.status(401).json({
            success: false,
            error: {
                code: "AUTHENTICATION_REQUIRED",
                message: "Authentication is required"
            }
        })

        return;
    }

    try {
        const payload = verifyAccessToken(authorization);

        (req as AuthenticationRequest).user = {
            id: payload.userId
        }

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: "INVALID_ACCESS_TOKEN",
                message: "Invalid or expired access token",
            },
        });
    }
}