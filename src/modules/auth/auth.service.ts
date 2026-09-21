import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
    organizationMembers,
    organizations,
    roles,
    users,
} from "../../db/schema.js";
import { hashPassword } from "../../utils/password.js";
import type { RegisterInput } from "./auth.validation.js";

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