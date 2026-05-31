import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

/**
 * Admin routes require header X-Admin-Key matching ADMIN_API_KEY.
 * Replace with session or OAuth when the admin UI (apps/web) is added.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = req.header("x-admin-key");
  if (!key || key !== env.adminApiKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
