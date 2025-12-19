import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import * as Auth from "./model/auth";
import * as Transactions from "./model/transactions";
import * as BankAccounts from "./model/bankAccounts";
import * as Splits from "./model/splits";

/**
 * Get all transactions for the current user, sorted by date (newest first).
 * Returns empty array if not authenticated.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await Auth.getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    return await Transactions.getByUserIdSortedByDate(ctx, user._id);
  },
});

/**
 * Get transactions for a specific bank account.
 */
export const listByBankAccount = query({
  args: {
    bankAccountId: v.id("bankAccounts"),
  },
  handler: async (ctx, { bankAccountId }) => {
    const user = await Auth.requireUser(ctx);
    // Verify user owns the bank account
    await BankAccounts.verifyOwnership(ctx, bankAccountId, user._id);
    return await Transactions.getByBankAccountId(ctx, bankAccountId);
  },
});

/**
 * Get a specific transaction by ID.
 */
export const get = query({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, { transactionId }) => {
    const user = await Auth.requireUser(ctx);
    return await Transactions.verifyOwnership(ctx, transactionId, user._id);
  },
});

/**
 * Create a new transaction.
 */
export const create = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
    merchant: v.string(),
    amount: v.number(),
    date: v.string(),
    category: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await Auth.requireUser(ctx);
    // Verify user owns the bank account
    await BankAccounts.verifyOwnership(ctx, args.bankAccountId, user._id);

    return await Transactions.create(ctx, {
      userId: user._id,
      ...args,
    });
  },
});

/**
 * Update a transaction.
 */
export const update = mutation({
  args: {
    transactionId: v.id("transactions"),
    merchant: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { transactionId, ...updates }) => {
    const user = await Auth.requireUser(ctx);
    // Verify ownership
    await Transactions.verifyOwnership(ctx, transactionId, user._id);
    await Transactions.update(ctx, transactionId, updates);
    return await ctx.db.get(transactionId);
  },
});

/**
 * Delete a transaction.
 */
export const remove = mutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, { transactionId }) => {
    const user = await Auth.requireUser(ctx);
    // Verify ownership
    await Transactions.verifyOwnership(ctx, transactionId, user._id);
    await Transactions.remove(ctx, transactionId);
  },
});

/**
 * Bulk create transactions from Plaid sync.
 * Handles deduplication via plaidTransactionId.
 */
export const bulkCreateFromPlaid = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
    transactions: v.array(
      v.object({
        merchant: v.string(),
        amount: v.number(),
        date: v.string(),
        category: v.string(),
        description: v.string(),
        plaidTransactionId: v.string(),
      })
    ),
  },
  handler: async (ctx, { bankAccountId, transactions }) => {
    const user = await Auth.requireUser(ctx);
    // Verify user owns the bank account
    await BankAccounts.verifyOwnership(ctx, bankAccountId, user._id);

    return await Transactions.bulkCreateFromPlaid(
      ctx,
      user._id,
      bankAccountId,
      transactions
    );
  },
});

/**
 * Create a manual (cash) transaction with a split atomically.
 * This ensures a manual transaction cannot exist without a split.
 */
export const createManualWithSplit = mutation({
  args: {
    // Transaction data
    merchant: v.string(),
    amount: v.number(),
    date: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    // Split data
    method: v.union(
      v.literal("equal"),
      v.literal("percentage"),
      v.literal("custom"),
      v.literal("itemized")
    ),
    participants: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        percentage: v.optional(v.number()),
      })
    ),
    receiptItems: v.optional(
      v.array(
        v.object({
          name: v.string(),
          quantity: v.number(),
          price: v.number(),
          assignedToUserIds: v.array(v.id("users")),
        })
      )
    ),
    receiptImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await Auth.requireUser(ctx);

    // Validate participants
    if (args.participants.length === 0) {
      throw new Error("At least one participant is required");
    }

    // 1. Get or create the Cash bank account
    const cashAccountId = await BankAccounts.getOrCreateCashAccount(
      ctx,
      user._id
    );

    // 2. Create the manual transaction
    const transactionId = await Transactions.create(ctx, {
      userId: user._id,
      bankAccountId: cashAccountId,
      merchant: args.merchant,
      amount: args.amount,
      date: args.date || new Date().toISOString().split("T")[0],
      category: args.category || "Other",
      description: args.description || "",
      isManual: true,
    });

    // 3. Create the split
    const splitId = await Splits.create(ctx, {
      userId: user._id,
      transactionId,
      method: args.method,
      status: "pending",
      receiptImageId: args.receiptImageId,
    });

    // 4. Add participants
    for (const participant of args.participants) {
      await Splits.addParticipant(ctx, {
        splitId,
        userId: participant.userId,
        amount: participant.amount,
        percentage: participant.percentage,
        status: "pending",
      });
    }

    // 5. Add receipt items if provided
    if (args.receiptItems) {
      for (const item of args.receiptItems) {
        await Splits.addReceiptItem(ctx, {
          splitId,
          ...item,
        });
      }
    }

    return { transactionId, splitId };
  },
});
