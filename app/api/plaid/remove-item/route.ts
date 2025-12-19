import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { plaidClient } from "@/lib/plaid";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing accessToken" },
        { status: 400 }
      );
    }

    // Remove the Item from Plaid
    // This invalidates the access_token and removes all data from Plaid's systems
    await plaidClient.itemRemove({
      access_token: accessToken,
    });

    return NextResponse.json({
      success: true,
      message: "Bank account disconnected from Plaid",
    });
  } catch (error) {
    console.error("Error removing Plaid item:", error);
    // Even if Plaid removal fails, we might want to allow local deletion
    // Return success: false but don't throw - let the client decide
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to disconnect from Plaid, but you can still remove locally" 
      },
      { status: 200 }
    );
  }
}
