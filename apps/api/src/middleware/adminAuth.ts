import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

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
