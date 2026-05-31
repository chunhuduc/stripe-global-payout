import Stripe from "stripe";
import { env } from "../config/env.js";

/** Platform Stripe client (v1 API: webhook signature verification). */
export const stripe = new Stripe(env.stripeSecretKey);
