import {
  pgTable,
  uuid,
  index,
  varchar,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: varchar("email", {
    length: 255,
  }).notNull().unique(),

  passwordHash: varchar("password_hash", {
    length: 255
  }).notNull().unique(),

  firstName: varchar("first_name", {
    length: 100
  }).notNull(),

  lastName: varchar("last_name", {
    length: 100
  }).notNull(),

  avatarUrl: varchar("avatar_url", {
    length: 500
  }).notNull().default(""),

  emailVerifiedAt: timestamp("email_verified_at", {
    withTimezone: true
  }),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});



export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", {
    length: 150,
  }).notNull(),

  slug: varchar("slug", {
    length: 150,
  }).notNull().unique(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});



export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", {
    length: 50,
  }).notNull(),

  description: varchar("description", {
    length: 255,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});



export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", {
    length: 100,
  }).notNull().unique(),

  description: varchar("description", {
    length: 255,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});



export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),

    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    unique("organization_members_org_user_unique").on(
      table.organizationId,
      table.userId,
    ),
  ],
);



export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, {
        onDelete: "cascade",
      }),

    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    unique("role_permissions_role_permission_unique").on(
      table.roleId,
      table.permissionId,
    ),
  ],
);


export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    refreshTokenHash: varchar("refresh_token_hash", {
      length: 255,
    }).notNull(),

    userAgent: varchar("user_agent", {
      length: 500,
    }),

    ipAddress: varchar("ip_address", {
      length: 100,
    }),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
  ],
);