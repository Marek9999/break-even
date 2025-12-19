import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Get all bank accounts for a user.
 */
export async function getByUserId(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"bankAccounts">[]> {
  return await ctx.db
    .query("bankAccounts")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
}

/**
 * Get a bank account by ID.
 */
export async function getById(
  ctx: QueryCtx | MutationCtx,
  bankAccountId: Id<"bankAccounts">
): Promise<Doc<"bankAccounts"> | null> {
  return await ctx.db.get(bankAccountId);
}

/**
 * Create a new bank account.
 */
export async function create(
  ctx: MutationCtx,
  data: {
    userId: Id<"users">;
    bankName: string;
    accountNumberLast4: string;
    accountType: "checking" | "savings" | "credit";
    balance: number;
    color: string;
    plaidItemId?: string;
  }
): Promise<Id<"bankAccounts">> {
  return await ctx.db.insert("bankAccounts", data);
}

/**
 * Update a bank account.
 */
export async function update(
  ctx: MutationCtx,
  bankAccountId: Id<"bankAccounts">,
  updates: {
    bankName?: string;
    accountNumberLast4?: string;
    accountType?: "checking" | "savings" | "credit";
    balance?: number;
    color?: string;
    plaidItemId?: string;
    plaidAccessToken?: string;
    plaidAccountId?: string;
  }
): Promise<void> {
  await ctx.db.patch(bankAccountId, updates);
}

/**
 * Create a bank account from Plaid data.
 */
export async function createFromPlaid(
  ctx: MutationCtx,
  data: {
    userId: Id<"users">;
    bankName: string;
    accountNumberLast4: string;
    accountType: "checking" | "savings" | "credit";
    balance: number;
    color: string;
    plaidItemId: string;
    plaidAccessToken: string;
    plaidAccountId: string;
  }
): Promise<Id<"bankAccounts">> {
  return await ctx.db.insert("bankAccounts", data);
}

/**
 * Get a bank account by Plaid Item ID.
 */
export async function getByPlaidItemId(
  ctx: QueryCtx | MutationCtx,
  plaidItemId: string
): Promise<Doc<"bankAccounts"> | null> {
  return await ctx.db
    .query("bankAccounts")
    .withIndex("by_plaidItemId", (q) => q.eq("plaidItemId", plaidItemId))
    .first();
}

/**
 * Delete a bank account and all associated transactions.
 */
export async function remove(
  ctx: MutationCtx,
  bankAccountId: Id<"bankAccounts">
): Promise<{ deletedTransactions: number }> {
  // First, delete all transactions associated with this bank account
  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_bankAccountId", (q) => q.eq("bankAccountId", bankAccountId))
    .collect();

  for (const transaction of transactions) {
    // Also delete any splits associated with these transactions
    const splits = await ctx.db
      .query("splits")
      .withIndex("by_transactionId", (q) => q.eq("transactionId", transaction._id))
      .collect();

    for (const split of splits) {
      // Delete split participants
      const participants = await ctx.db
        .query("splitParticipants")
        .withIndex("by_splitId", (q) => q.eq("splitId", split._id))
        .collect();
      for (const participant of participants) {
        await ctx.db.delete(participant._id);
      }

      // Delete receipt items
      const receiptItems = await ctx.db
        .query("receiptItems")
        .withIndex("by_splitId", (q) => q.eq("splitId", split._id))
        .collect();
      for (const item of receiptItems) {
        await ctx.db.delete(item._id);
      }

      await ctx.db.delete(split._id);
    }

    await ctx.db.delete(transaction._id);
  }

  // Finally, delete the bank account
  await ctx.db.delete(bankAccountId);

  return { deletedTransactions: transactions.length };
}

/**
 * Verify the user owns this bank account.
 */
export async function verifyOwnership(
  ctx: QueryCtx | MutationCtx,
  bankAccountId: Id<"bankAccounts">,
  userId: Id<"users">
): Promise<Doc<"bankAccounts">> {
  const account = await ctx.db.get(bankAccountId);
  if (!account) {
    throw new Error("Bank account not found");
  }
  if (account.userId !== userId) {
    throw new Error("You do not have access to this bank account");
  }
  return account;
}
