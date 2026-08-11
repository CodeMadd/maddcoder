import { z } from "zod";
import { Plan } from "@prisma/client";

export const checkoutSchema = z.object({
  plan: z.nativeEnum(Plan),
  // Payment method is captured for UX only. NO card data is ever sent to or
  // stored on the server — this is a dummy/placeholder payment flow.
  method: z.enum(["card", "paypal", "google_pay"]).default("card"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
