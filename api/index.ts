/**
 * Vercel serverless entry (see vercel.json rewrites).
 * Build must run first: `npm run build` produces apps/api/dist with default export.
 */
export { default } from "../apps/api/dist/app.js";
