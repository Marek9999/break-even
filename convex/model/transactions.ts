import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Get all transactions for a user.
 */
export async function getByUserId(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"transactions">[]> {
  return await ctx.db
    .query("transactions")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
}

/**
 * Get transactions for a user sorted by date (newest first).
 */
export async function getByUserIdSortedByDate(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"transactions">[]> {
  return await ctx.db
    .query("transactions")
    .withIndex("by_userId_date", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();
}

/**
 * Get transactions for a specific bank account.
 */
export async function getByBankAccountId(
  ctx: QueryCtx | MutationCtx,
  bankAccountId: Id<"bankAccounts">
): Promise<Doc<"transactions">[]> {
  return await ctx.db
    .query("transactions")
    .withIndex("by_bankAccountId", (q) => q.eq("bankAccountId", bankAccountId))
    .collect();
}

/**
 * Get a transaction by ID.
 */
export async function getById(
  ctx: QueryCtx | MutationCtx,
  transactionId: Id<"transactions">
): Promise<Doc<"transactions"> | null> {
  return await ctx.db.get(transactionId);
}

/**
 * Create a new transaction.
 */
export async function create(
  ctx: MutationCtx,
  data: {
    userId: Id<"users">;
    bankAccountId: Id<"bankAccounts">;
    merchant: string;
    amount: number;
    date: string;
    category: string;
    description: string;
    plaidTransactionId?: string;
  }
): Promise<Id<"transactions">> {
  return await ctx.db.insert("transactions", data);
}

/**
 * Get a transaction by Plaid Transaction ID.
 */
export async function getByPlaidTransactionId(
  ctx: QueryCtx | MutationCtx,
  plaidTransactionId: string
): Promise<Doc<"transactions"> | null> {
  return await ctx.db
    .query("transactions")
    .withIndex("by_plaidTransactionId", (q) => q.eq("plaidTransactionId", plaidTransactionId))
    .first();
}

/**
 * Bulk create transactions from Plaid sync.
 * Skips transactions that already exist (by plaidTransactionId).
 */
export async function bulkCreateFromPlaid(
  ctx: MutationCtx,
  userId: Id<"users">,
  bankAccountId: Id<"bankAccounts">,
  transactions: Array<{
    merchant: string;
    amount: number;
    date: string;
    category: string;
    description: string;
    plaidTransactionId: string;
  }>
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const txn of transactions) {
    // Check if transaction already exists
    const existing = await getByPlaidTransactionId(ctx, txn.plaidTransactionId);
    if (existing) {
      skipped++;
      continue;
    }

    await ctx.db.insert("transactions", {
      userId,
      bankAccountId,
      ...txn,
    });
    created++;
  }

  return { created, skipped };
}

/**
 * Update a transaction.
 */
export async function update(
  ctx: MutationCtx,
  transactionId: Id<"transactions">,
  updates: {
    merchant?: string;
    amount?: number;
    date?: string;
    category?: string;
    description?: string;
  }
): Promise<void> {
  await ctx.db.patch(transactionId, updates);
}

/**
 * Delete a transaction.
 */
export async function remove(
  ctx: MutationCtx,
  transactionId: Id<"transactions">
): Promise<void> {
  await ctx.db.delete(transactionId);
}

/**
 * Verify the user owns this transaction.
 */
export async function verifyOwnership(
  ctx: QueryCtx | MutationCtx,
  transactionId: Id<"transactions">,
  userId: Id<"users">
): Promise<Doc<"transactions">> {
  const transaction = await ctx.db.get(transactionId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  if (transaction.userId !== userId) {
    throw new Error("You do not have access to this transaction");
  }
  return transaction;
}
