import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import * as Auth from "./model/auth";
import * as Transactions from "./model/transactions";
import * as BankAccounts from "./model/bankAccounts";

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
