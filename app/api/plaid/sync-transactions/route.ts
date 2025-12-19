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

    // Use transactions sync to get transactions
    // For initial sync, we don't have a cursor
    const syncResponse = await plaidClient.transactionsSync({
      access_token: accessToken,
    });

    const { added, modified, removed, has_more, next_cursor } =
      syncResponse.data;

    // Transform transactions to our format
    const transactions = added.map((txn) => ({
      merchant: txn.merchant_name || txn.name || "Unknown",
      amount: Math.abs(txn.amount), // Plaid uses negative for debits
      date: txn.date,
      category: txn.personal_finance_category?.primary || txn.category?.[0] || "Other",
      description: txn.name || "",
      plaidTransactionId: txn.transaction_id,
      isExpense: txn.amount > 0, // Positive in Plaid = money out
    }));

    return NextResponse.json({
      success: true,
      transactions,
      hasMore: has_more,
      cursor: next_cursor,
      removed: removed.map((r) => r.transaction_id),
      modified: modified.map((m) => m.transaction_id),
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
