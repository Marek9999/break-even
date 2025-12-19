import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import * as Auth from "./model/auth";
import * as BankAccounts from "./model/bankAccounts";

/**
 * Get all bank accounts for the current user.
 * Returns empty array if not authenticated.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await Auth.getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    return await BankAccounts.getByUserId(ctx, user._id);
  },
});

/**
 * Get a specific bank account by ID.
 */
export const get = query({
  args: {
    bankAccountId: v.id("bankAccounts"),
  },
  handler: async (ctx, { bankAccountId }) => {
    const user = await Auth.requireUser(ctx);
    return await BankAccounts.verifyOwnership(ctx, bankAccountId, user._id);
  },
});

/**
 * Create a new bank account.
 */
export const create = mutation({
  args: {
    bankName: v.string(),
    accountNumberLast4: v.string(),
    accountType: v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("credit")
    ),
    balance: v.number(),
    color: v.string(),
    plaidItemId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await Auth.requireUser(ctx);
    return await BankAccounts.create(ctx, {
      userId: user._id,
      ...args,
    });
  },
});

/**
 * Update a bank account.
 */
export const update = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
    bankName: v.optional(v.string()),
    accountNumberLast4: v.optional(v.string()),
    accountType: v.optional(
      v.union(
        v.literal("checking"),
        v.literal("savings"),
        v.literal("credit")
      )
    ),
    balance: v.optional(v.number()),
    color: v.optional(v.string()),
    plaidItemId: v.optional(v.string()),
  },
  handler: async (ctx, { bankAccountId, ...updates }) => {
    const user = await Auth.requireUser(ctx);
    // Verify ownership
    await BankAccounts.verifyOwnership(ctx, bankAccountId, user._id);
    await BankAccounts.update(ctx, bankAccountId, updates);
    return await ctx.db.get(bankAccountId);
  },
});

/**
 * Delete a bank account.
 */
export const remove = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
  },
  handler: async (ctx, { bankAccountId }) => {
    const user = await Auth.requireUser(ctx);
    // Verify ownership
    await BankAccounts.verifyOwnership(ctx, bankAccountId, user._id);
    await BankAccounts.remove(ctx, bankAccountId);
  },
});

/**
 * Create a bank account from Plaid data.
 * Called after successful Plaid Link flow.
 */
export const createFromPlaid = mutation({
  args: {
    bankName: v.string(),
    accountNumberLast4: v.string(),
    accountType: v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("credit")
    ),
    balance: v.number(),
    color: v.string(),
    plaidItemId: v.string(),
    plaidAccessToken: v.string(),
    plaidAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await Auth.requireUser(ctx);
    return await BankAccounts.createFromPlaid(ctx, {
      userId: user._id,
      ...args,
    });
  },
});

/**
 * Get a bank account by Plaid Item ID.
 */
export const getByPlaidItemId = query({
  args: {
    plaidItemId: v.string(),
  },
  handler: async (ctx, { plaidItemId }) => {
    await Auth.requireUser(ctx);
    return await BankAccounts.getByPlaidItemId(ctx, plaidItemId);
  },
});
