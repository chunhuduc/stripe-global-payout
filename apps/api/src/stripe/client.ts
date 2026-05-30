import Stripe from "stripe";
import { env } from "../config/env.js";

/** Platform Stripe client (secret key). Connected-account calls pass stripeAccount in request options. */
export const stripe = new Stripe(env.stripeSecretKey);
