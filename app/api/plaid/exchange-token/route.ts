import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { plaidClient } from "@/lib/plaid";
import { CountryCode } from "plaid";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { public_token } = body;

    if (!public_token) {
      return NextResponse.json(
        { error: "Missing public_token" },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get account details
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;
    const institution = accountsResponse.data.item.institution_id;

    // Get institution name
    let institutionName = "Unknown Bank";
    if (institution) {
      try {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institution,
          country_codes: [CountryCode.Us],
        });
        institutionName = instResponse.data.institution.name;
      } catch {
        console.warn("Could not fetch institution name");
      }
    }

    // Return the data needed to create bank accounts in Convex
    const accountsData = accounts.map((account) => ({
      bankName: institutionName,
      accountNumberLast4: account.mask || "0000",
      accountType: mapAccountType(account.subtype || account.type),
      balance: account.balances.current || 0,
      plaidItemId: itemId,
      plaidAccessToken: accessToken,
      plaidAccountId: account.account_id,
    }));

    return NextResponse.json({
      success: true,
      accounts: accountsData,
      itemId,
    });
  } catch (error) {
    console.error("Error exchanging token:", error);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }
}

// Map Plaid account types to our schema types
function mapAccountType(
  plaidType: string | null
): "checking" | "savings" | "credit" {
  if (!plaidType) return "checking";

  const type = plaidType.toLowerCase();
  if (type.includes("checking")) return "checking";
  if (type.includes("savings")) return "savings";
  if (type.includes("credit")) return "credit";
  if (type.includes("money market")) return "savings";
  if (type.includes("cd")) return "savings";

  return "checking";
}
