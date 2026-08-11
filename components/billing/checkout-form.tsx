"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CreditCard,
  Check,
  Lock,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Method = "card" | "paypal" | "google_pay";

const METHODS: { id: Method; label: string; icon: typeof CreditCard }[] = [
  { id: "card", label: "Credit / debit card", icon: CreditCard },
  { id: "paypal", label: "PayPal", icon: Wallet },
  { id: "google_pay", label: "Google Pay", icon: Wallet },
];

export function CheckoutForm({
  plan,
  planName,
  price,
  period,
  features,
}: {
  plan: string;
  planName: string;
  price: string;
  period: string;
  features: string[];
}) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("card");
  const [processing, setProcessing] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  function formatCardNumber(v: string) {
    return v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  function validateCard(): string | null {
    if (method !== "card") return null;
    if (cardName.trim().length < 2) return "Enter the name on the card.";
    if (cardNumber.replace(/\s/g, "").length < 15) return "Enter a valid card number.";
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Enter a valid expiry (MM/YY).";
    if (!/^\d{3,4}$/.test(cvc)) return "Enter a valid CVC.";
    return null;
  }

  async function pay() {
    const err = validateCard();
    if (err) {
      toast.error(err);
      return;
    }
    setProcessing(true);
    try {
      // NOTE: card details are intentionally NOT sent to the server.
      await apiFetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan, method }),
      });
      router.push(`/dashboard/billing/success?plan=${plan}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      setProcessing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4 text-primary" /> Payment details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
            Demo checkout — no real payment is processed and no card data is
            stored. Use any test details, e.g. card 4242 4242 4242 4242.
          </div>

          <div>
            <Label className="mb-2 block">Payment method</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    method === m.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  <m.icon className="size-4" /> {m.label}
                </button>
              ))}
            </div>
          </div>

          {method === "card" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cardName">Name on card</Label>
                <Input
                  id="cardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Jordan Lee"
                  autoComplete="cc-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cardNumber">Card number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="pr-10"
                  />
                  <CreditCard className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input
                    id="expiry"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              You&apos;ll be redirected to {method === "paypal" ? "PayPal" : "Google Pay"} to
              complete payment. (Simulated in this demo.)
            </div>
          )}

          <Button
            variant="gradient"
            className="w-full"
            onClick={pay}
            loading={processing}
          >
            <Lock className="size-4" /> Pay {price}
            {period && period !== "forever" ? ` ${period}` : ""}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" /> Secured checkout · cards are never stored
          </p>
        </CardContent>
      </Card>

      {/* Order summary */}
      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="text-base">Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">CareerAI {planName}</div>
              <div className="text-xs text-muted-foreground">Billed monthly</div>
            </div>
            <Badge variant="default">{planName}</Badge>
          </div>
          <ul className="space-y-2 border-y py-4 text-sm">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>
              {price}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                {period}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
