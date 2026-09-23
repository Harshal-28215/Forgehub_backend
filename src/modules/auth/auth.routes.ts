import { Router } from "express";
import { register, login, refresh, getMe, logout, logoutAll } from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login)
router.post("/refresh", refresh)
router.post("/logout", logout)
router.post("/logout-all", requireAuth, logoutAll)
router.get("/me", requireAuth, getMe)

export default router;