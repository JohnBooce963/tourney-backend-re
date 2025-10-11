import Ably from "ably";
import { withCors, corsOptionsResponse } from "@/libs/cor";

const rest = new Ably.Rest("4PXB0g.UG7TyQ:plqdic7_UvXxQm_-wZ8RXV9XRDLRZOmIJjKoaGTzwYk");

// Handle preflight
export async function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}

// Generate Ably token request
export async function GET(req: Request) {
  try {
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId: "frontend-client", // optional, identify the user/session
    });

    return withCors(req, tokenRequest, { status: 200 });
  } catch (error: any) {
    console.error("❌ Failed to create Ably token:", error);
    return withCors(req, { error: error.message }, { status: 500 });
  }
}