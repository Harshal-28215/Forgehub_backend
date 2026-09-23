import crypto from "node:crypto";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { AppError } from "../../utils/app-error.js";
import { db } from "../../db/index.js";
import {
    organizationMembers,
    organizations,
    roles,
    users,
} from "../../db/schema.js";
import { hashPassword } from "../../utils/password.js";
import type { RegisterInput } from "./auth.validation.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../../utils/jwt.js";
import { verifyPassword } from "../../utils/password.js";
import { sessions } from "../../db/schema.js";
import type { LoginInput } from "./auth.validation.js";
import argon2 from "argon2"
import { error } from "node:console";

export const registerUser = async (input: RegisterInput) => {
    const existingUser = await db
        .select({
            id: users.id,
        })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

    if (existingUser.length > 0) {
        throw new Error("User with this email already exists");
    }

    const ownerRole = await db
        .select({
            id: roles.id,
            name: roles.name,
        })
        .from(roles)
        .where(eq(roles.name, "OWNER"))
        .limit(1);

    if (ownerRole.length === 0) {
        throw new Error("OWNER role is not configured");
    }

    const owner = ownerRole[0];

    if (!owner) {
        throw new Error("OWNER role is not configured");
    }

    const passwordHash = await hashPassword(input.password);

    return db.transaction(async (tx) => {
        const [user] = await tx
            .insert(users)
            .values({
                email: input.email,
                passwordHash,
                firstName: input.firstName,
                lastName: input.lastName,
            })
            .returning({
                id: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
            });

        if (!user) {
            throw new Error("Failed to create user");
        }

        const slug = `${input.organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;

        const [organization] = await tx
            .insert(organizations)
            .values({
                name: input.organizationName,
                slug,
            })
            .returning({
                id: organizations.id,
                name: organizations.name,
                slug: organizations.slug,
            });

        if (!organization) {
            throw new Error("Failed to create organization");
        }

        await tx.insert(organizationMembers).values({
            organizationId: organization.id,
            userId: user.id,
            roleId: owner.id,
        });

        return {
            user,
            organization,
            role: "OWNER",
        };
    });
};



export const loginUser = async (
    input: LoginInput,
    userAgent?: string,
    ipAddress?: string,
) => {
    const result = await db
        .select({
            id: users.id,
            email: users.email,
            passwordHash: users.passwordHash,
            firstName: users.firstName,
            lastName: users.lastName,
            isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

    const user = result[0];

    if (!user) {
        throw new AppError(
            "Invalid email or password",
            401,
            "INVALID_CREDENTIALS",
        );
    }

    if (!user.isActive) {
        throw new AppError(
            "User account is inactive",
            403,
            "ACCOUNT_INACTIVE",
        );
    }

    const passwordValid = await verifyPassword(
        input.password,
        user.passwordHash,
    );

    if (!passwordValid) {
        throw new AppError(
            "Invalid email or password",
            401,
            "INVALID_CREDENTIALS",
        );
    }

    const session = await db
        .insert(sessions)
        .values({
            userId: user.id,
            refreshTokenHash: "PENDING",
            userAgent,
            ipAddress,
            expiresAt: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
            ),
        })
        .returning({
            id: sessions.id,
        });

    const createdSession = session[0];

    if (!createdSession) {
        throw new AppError(
            "Failed to create session",
            500,
            "SESSION_CREATION_FAILED",
        );
    }

    const accessToken = generateAccessToken({
        userId: user.id,
    });

    const refreshToken = generateRefreshToken({
        userId: user.id,
        sessionId: createdSession.id,
    });

    const refreshTokenHash = await argon2.hash(refreshToken, {
        type: argon2.argon2id,
    });

    await db
        .update(sessions)
        .set({
            refreshTokenHash,
            updatedAt: new Date(),
        })
        .where(eq(sessions.id, createdSession.id));

    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        },
        accessToken,
        refreshToken,
    };
};


export const refreshUser = async (refreshToken: string) => {
    let payload;

    try {
        payload = verifyRefreshToken(refreshToken);
    } catch {
        throw new AppError(
            "Invalid refresh token",
            401,
            "INVALID_REFRESH_TOKEN",
        );
    }

    return db.transaction(async (tx) => {
        const result = await tx
            .select({
                sessionId: sessions.id,
                sessionUserId: sessions.userId,
                refreshTokenHash: sessions.refreshTokenHash,
                expiresAt: sessions.expiresAt,
                revokedAt: sessions.revokedAt,

                userId: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                isActive: users.isActive,
            })
            .from(sessions)
            .innerJoin(users, eq(users.id, sessions.userId))
            .where(
                and(
                    eq(sessions.id, payload.sessionId),
                    eq(sessions.userId, payload.userId),
                ),
            )
            .for("update")
            .limit(1);

        const session = result[0];

        if (!session) {
            throw new AppError(
                "Invalid refresh token",
                401,
                "INVALID_REFRESH_TOKEN",
            );
        }

        if (session.revokedAt) {
            throw new AppError(
                "Session has been revoked",
                401,
                "SESSION_REVOKED",
            );
        }

        if (session.expiresAt <= new Date()) {
            throw new AppError(
                "Session has expired",
                401,
                "SESSION_EXPIRED",
            );
        }

        if (!session.isActive) {
            throw new AppError(
                "User account is inactive",
                403,
                "ACCOUNT_INACTIVE",
            );
        }

        const tokenValid = await argon2.verify(
            session.refreshTokenHash,
            refreshToken,
        );

        if (!tokenValid) {
            throw new AppError(
                "Invalid refresh token",
                401,
                "INVALID_REFRESH_TOKEN",
            );
        }

        const newAccessToken = generateAccessToken({
            userId: session.userId,
        });

        const newRefreshToken = generateRefreshToken({
            userId: session.userId,
            sessionId: session.sessionId,
        });

        const newRefreshTokenHash = await argon2.hash(
            newRefreshToken,
            {
                type: argon2.argon2id,
            },
        );

        await tx
            .update(sessions)
            .set({
                refreshTokenHash: newRefreshTokenHash,
                updatedAt: new Date(),
            })
            .where(eq(sessions.id, session.sessionId));

        return {
            user: {
                id: session.userId,
                email: session.email,
                firstName: session.firstName,
                lastName: session.lastName,
            },
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    });
};


export const logoutSession = async (refreshToken: string) => {
    let payload
    try {
        payload = verifyRefreshToken(refreshToken)
    } catch (error) {
        throw new AppError(
            "Invalid refresh token",
            401,
            "INVALID_REFRESH_TOKEN",
        );
    }

    const userSession = await db.select({
        sessionId: sessions.id,
    })
        .from(sessions)
        .where(
            and(
                eq(sessions.id, payload.sessionId),
                eq(sessions.userId, payload.userId),
                isNull(sessions.revokedAt)
            )
        )
        .limit(1)

    if (userSession.length === 0) {
        return
    }

    await db
        .update(sessions)
        .set({
            revokedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(sessions.id, payload.sessionId));
}


export const logoutAllSession = async (userId: string) => {
    await db.update(sessions)
        .set({
            revokedAt: new Date(),
            updatedAt: new Date()
        })
        .where(
            and(
                eq(sessions.userId, userId),
                isNull(sessions.revokedAt)
            )
        )
}


export const getCurrentUser = async (userId: string) => {
    const result = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
        emailVerifiedAt: users.emailVerifiedAt,
        isActive: users.isActive,
        createdAt: users.createdAt
    })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

    const user = result[0]

    if (!user) {
        throw new AppError(
            "User account is inactive",
            403,
            "USER_INACTIVE",
        )
    }

    const organizationsResult = await db.select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        role: roles.name
    })
        .from(organizationMembers)
        .innerJoin(
            organizations,
            eq(organizationMembers.organizationId, organizations.id)
        )
        .innerJoin(
            roles,
            eq(organizationMembers.roleId, roles.id)
        )
        .where(
            eq(organizationMembers.userId, userId)
        )


    return {
        ...user,
        organizations: organizationsResult
    }
}