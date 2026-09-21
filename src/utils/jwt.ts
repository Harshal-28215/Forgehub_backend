import jwt, { type SignOptions } from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
}

if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
}

export interface AccessTokenPayload {
    userId: string;
}

export interface RefreshTokenPayload {
    userId: string;
    sessionId: string;
}

export const generateAccessToken = (
    payload: AccessTokenPayload,
): string => {
    const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ?? "15m") as NonNullable<
        SignOptions["expiresIn"]
    >;

    const options: SignOptions = {
        expiresIn,
    };

    return jwt.sign(payload, accessSecret, options);
};

export const generateRefreshToken = (
    payload: RefreshTokenPayload,
): string => {
    const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ?? "30d") as NonNullable<
        SignOptions["expiresIn"]
    >;

    const options: SignOptions = {
        expiresIn,
    };

    return jwt.sign(payload, refreshSecret, options);
};

export const verifyAccessToken = (
    token: string,
): AccessTokenPayload => {
    return jwt.verify(token, accessSecret) as AccessTokenPayload;
};

export const verifyRefreshToken = (
    token: string,
): RefreshTokenPayload => {
    return jwt.verify(token, refreshSecret) as RefreshTokenPayload;
};