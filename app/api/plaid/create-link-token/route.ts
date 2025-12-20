import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { plaidClient, plaidEnv } from "@/lib/plaid";
import { Products, CountryCode } from "plaid";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the origin from the request for redirect URI
    const origin = request.headers.get("origin") || "http://localhost:3000";
    
    // Build the link token request
    const linkTokenRequest: Parameters<typeof plaidClient.linkTokenCreate>[0] = {
      user: {
        client_user_id: userId,
      },
      client_name: "Break Even",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    };

    // For production, OAuth-enabled banks require a redirect URI with HTTPS
    // This must be registered in your Plaid Dashboard under Team Settings > API > Allowed redirect URIs
    // Note: localhost doesn't work for production OAuth - you need HTTPS (use ngrok or deploy to Vercel)
    if (plaidEnv === "production" && origin.startsWith("https://")) {
      linkTokenRequest.redirect_uri = `${origin}/`;
      console.log("Using redirect URI for production:", linkTokenRequest.redirect_uri);
    } else if (plaidEnv === "production") {
      console.warn(
        "⚠️ Production Plaid without HTTPS: OAuth banks won't work on localhost.",
        "Use ngrok for HTTPS tunnel or deploy to a production environment.",
        "Non-OAuth banks may still work."
      );
    }

    const response = await plaidClient.linkTokenCreate(linkTokenRequest);

    return NextResponse.json({
      link_token: response.data.link_token,
    });
  } catch (error: unknown) {
    // Extract Plaid error details if available
    const plaidError = error as { response?: { data?: { error_message?: string; error_code?: string; error_type?: string } } };
    if (plaidError.response?.data) {
      console.error("Plaid API Error:", {
        error_type: plaidError.response.data.error_type,
        error_code: plaidError.response.data.error_code,
        error_message: plaidError.response.data.error_message,
      });
      return NextResponse.json(
        { 
          error: plaidError.response.data.error_message || "Failed to create link token",
          error_code: plaidError.response.data.error_code,
        },
        { status: 500 }
      );
    }
    
    console.error("Error creating link token:", error);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    );
  }
}
