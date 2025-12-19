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
  }
): Promise<void> {
  await ctx.db.patch(bankAccountId, updates);
}

/**
 * Delete a bank account.
 */
export async function remove(
  ctx: MutationCtx,
  bankAccountId: Id<"bankAccounts">
): Promise<void> {
  await ctx.db.delete(bankAccountId);
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
