import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import { runStripeProductSetup } from "@/lib/stripeSetup";

export async function GET() {
  const appUser = await getCurrentAppUser();

  if (!appUser || appUser.role !== "admin") {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  const results = await runStripeProductSetup();
  return NextResponse.json({ results });
}
