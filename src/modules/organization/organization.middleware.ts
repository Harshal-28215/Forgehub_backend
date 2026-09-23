import { Request, Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { organizationMembers } from "../../db/schema.js";

export const requireOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const organizationId = req.header("x-organization-id");

        if (!organizationId) {
            return res.status(400).json({
                message: "x-organization-id header is required",
            });
        }

        if (!req.user?.id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const membership = await db.select({
            organizationId: organizationMembers.organizationId,
            userId: organizationMembers.userId,
            roleId: organizationMembers.roleId,
        })
            .from(organizationMembers)
            .where(
                and(
                    eq(organizationMembers.organizationId, organizationId),
                    eq(organizationMembers.userId, req.user.id)
                )
            )

        if (!membership) {
            return res.status(403).json({
                message: "You are not a member of this organization",
            });
        }

        // Make the verified organization available to controllers
        req.organization = { id: organizationId, roleId: membership[0]?.roleId || null };

        next();
    } catch (error) {
        next(error);
    }
};
