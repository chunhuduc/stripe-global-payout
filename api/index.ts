/**
 * Vercel serverless entry: all routes rewrite here (see vercel.json).
 * Run `npm run build` before deploy so dist/app.js exists.
 */
import { createApp } from "../apps/api/dist/app.js";

export default createApp();
