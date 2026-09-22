import { Router } from "express";
import { register, login, refresh } from "./auth.controller.js";
import { logoutAllSession, logoutSession } from "./auth.service.js";
import { requireAuth } from "./auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login)
router.post("/refresh", refresh)
router.post("/logout", logoutSession)
router.post("/logout-all", requireAuth, logoutAllSession)

export default router;