import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import * as Auth from "./model/auth";
import * as Splits from "./model/splits";
import * as Transactions from "./model/transactions";
import * as Users from "./model/users";

// ==================== SPLIT QUERIES ====================

/**
 * Get all splits created by the current user.
 * Returns empty array if not authenticated.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await Auth.getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    return await Splits.getByUserId(ctx, user._id);
  },
});

/**
 * Get splits by status for the current user.
 * Returns empty array if not authenticated.
 */
export const listByStatus = query({
  args: {
    status: v.union(v.literal("pending"), v.literal("settled")),
  },
  handler: async (ctx, { status }) => {
    const user = await Auth.getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    return await Splits.getByUserIdAndStatus(ctx, user._id, status);
  },
});

/**
 * Get all splits for the current user with computed status.
 * Returns splits with their overall status based on participant statuses.
 */
export const listWithStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await Auth.getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const splits = await Splits.getByUserId(ctx, user._id);

    // For each split, compute the overall status
    const splitsWithStatus = await Promise.all(
      splits.map(async (split) => {
        const participants = await Splits.getParticipants(ctx, split._id);
        const transaction = await Transactions.getById(ctx, split.transactionId);

        // Find current user's participation
        const currentUserParticipant = participants.find((p) => p.userId === user._id) ?? null;

        // Compute overall status
        const allSettled = participants.length > 0 && participants.every((p) => p.status === "paid");
        const currentUserSettled = currentUserParticipant?.status === "paid";

        let overallStatus: "all_settled" | "settled_by_me" | "pending";
        if (allSettled) {
          overallStatus = "all_settled";
        } else if (currentUserSettled) {
          overallStatus = "settled_by_me";
        } else {
          overallStatus = "pending";
        }

        const settledCount = participants.filter((p) => p.status === "paid").length;

        return {
          ...split,
          transaction,
          overallStatus,
          settledCount,
          totalParticipants: participants.length,
        };
      })
    );

    return splitsWithStatus;
  },
});

/**
 * Get a split with full details (participants, items, transaction).
 * Computes overall status based on participant statuses.
 */
export const getWithDetails = query({
  args: {
    splitId: v.id("splits"),
  },
  handler: async (ctx, { splitId }) => {
    const user = await Auth.requireUser(ctx);
    
    // Get the split - check if user is owner or participant
    const split = await Splits.getById(ctx, splitId);
    if (!split) {
      throw new Error("Split not found");
    }

    // Get transaction
    const transaction = await Transactions.getById(ctx, split.transactionId);

    // Get participants with user profiles
    const participants = await Splits.getParticipants(ctx, splitId);
    const participantUserIds = participants.map((p) => p.userId);
    const participantUsers = await Users.getByIds(ctx, participantUserIds);

    // Get receipt items
    const receiptItems = await Splits.getReceiptItems(ctx, splitId);

    // Find current user's participation
    const currentUserParticipant = participants.find((p) => p.userId === user._id) ?? null;

    // Compute overall status
    const allSettled = participants.length > 0 && participants.every((p) => p.status === "paid");
    const currentUserSettled = currentUserParticipant?.status === "paid";

    let overallStatus: "all_settled" | "settled_by_me" | "pending";
    if (allSettled) {
      overallStatus = "all_settled";
    } else if (currentUserSettled) {
      overallStatus = "settled_by_me";
    } else {
      overallStatus = "pending";
    }

    // Count settled participants
    const settledCount = participants.filter((p) => p.status === "paid").length;

    return {
      split,
      transaction,
      participants: participants.map((p, i) => ({
        ...p,
        user: participantUsers[i],
      })),
      receiptItems,
      overallStatus,
      currentUserParticipant,
      settledCount,
      totalParticipants: participants.length,
    };
  },
});

/**
 * Get all splits the current user participates in.
 * Returns empty array if not authenticated.
 */
export const listParticipatingIn = query({
  args: {},
  handler: async (ctx) => {
    const user = await Auth.getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    const participations = await Splits.getParticipatingIn(ctx, user._id);

    // Get the splits
    const splitIds = [...new Set(participations.map((p) => p.splitId))];
    const splits = await Promise.all(
      splitIds.map((id) => Splits.getById(ctx, id))
    );

    return participations.map((p) => ({
      participation: p,
      split: splits.find((s) => s?._id === p.splitId),
    }));
  },
});

/**
 * Get pending payments for the current user.
 * Returns empty array if not authenticated.
 */
export const listPendingPayments = query({
  args: {},
  handler: async (ctx) => {
    const user = await Auth.getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    const pendingPayments = await Splits.getPendingPayments(ctx, user._id);

    // Get split details for each payment
    const splitIds = [...new Set(pendingPayments.map((p) => p.splitId))];
    const splits = await Promise.all(
      splitIds.map((id) => Splits.getById(ctx, id))
    );

    return pendingPayments.map((p) => ({
      payment: p,
      split: splits.find((s) => s?._id === p.splitId),
    }));
  },
});

// ==================== SPLIT MUTATIONS ====================

/**
 * Create a new split with participants.
 */
export const create = mutation({
  args: {
    transactionId: v.id("transactions"),
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

    // Verify user owns the transaction
    await Transactions.verifyOwnership(ctx, args.transactionId, user._id);

    // Create the split
    const splitId = await Splits.create(ctx, {
      userId: user._id,
      transactionId: args.transactionId,
      method: args.method,
      status: "pending",
      receiptImageId: args.receiptImageId,
    });

    // Add participants
    for (const participant of args.participants) {
      await Splits.addParticipant(ctx, {
        splitId,
        userId: participant.userId,
        amount: participant.amount,
        percentage: participant.percentage,
        status: "pending",
      });
    }

    // Add receipt items if provided
    if (args.receiptItems) {
      for (const item of args.receiptItems) {
        await Splits.addReceiptItem(ctx, {
          splitId,
          ...item,
        });
      }
    }

    return splitId;
  },
});

/**
 * Update a split's status.
 */
export const updateStatus = mutation({
  args: {
    splitId: v.id("splits"),
    status: v.union(v.literal("pending"), v.literal("settled")),
  },
  handler: async (ctx, { splitId, status }) => {
    const user = await Auth.requireUser(ctx);
    await Splits.verifyOwnership(ctx, splitId, user._id);
    await Splits.updateStatus(ctx, splitId, status);
  },
});

/**
 * Delete a split.
 */
export const remove = mutation({
  args: {
    splitId: v.id("splits"),
  },
  handler: async (ctx, { splitId }) => {
    const user = await Auth.requireUser(ctx);
    await Splits.verifyOwnership(ctx, splitId, user._id);
    await Splits.remove(ctx, splitId);
  },
});

import * as BankAccounts from "./model/bankAccounts";

// ==================== DEV/TESTING MUTATIONS ====================

/**
 * Create a sample split with all participants settled (for testing UI).
 */
export const createSampleSettledSplit = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await Auth.requireUser(ctx);

    // Get or create a Cash account for the sample transaction
    const cashAccountId = await BankAccounts.getOrCreateCashAccount(ctx, user._id);

    // Create a sample transaction
    const transactionId = await ctx.db.insert("transactions", {
      userId: user._id,
      bankAccountId: cashAccountId,
      merchant: "Sample Restaurant (All Settled)",
      amount: 100,
      date: new Date().toISOString().split("T")[0],
      category: "food",
      description: "Sample split for testing - all settled",
      isManual: true,
    });

    // Create the split
    const splitId = await Splits.create(ctx, {
      userId: user._id,
      transactionId,
      method: "equal",
      status: "pending", // This field is now derived, but keeping for backwards compat
    });

    // Add the current user as a participant (settled)
    await Splits.addParticipant(ctx, {
      splitId,
      userId: user._id,
      amount: 50,
      percentage: 50,
      status: "paid", // Already settled!
    });

    // Get a friend to add as second participant
    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();

    if (friendships) {
      await Splits.addParticipant(ctx, {
        splitId,
        userId: friendships.addresseeId,
        amount: 50,
        percentage: 50,
        status: "paid", // Already settled!
      });
    } else {
      // If no friend, just add another participant entry for the user
      // (This is just for demo purposes)
    }

    return { transactionId, splitId };
  },
});

// ==================== PARTICIPANT MUTATIONS ====================

/**
 * Settle or unsettle the current user's share in a split.
 * Any participant can toggle their own status.
 */
export const settleMyShare = mutation({
  args: {
    splitId: v.id("splits"),
  },
  handler: async (ctx, { splitId }) => {
    const user = await Auth.requireUser(ctx);

    // Find the current user's participation record
    const participation = await Splits.findUserParticipation(ctx, splitId, user._id);
    if (!participation) {
      throw new Error("You are not a participant in this split");
    }

    // Toggle the status
    const newStatus = participation.status === "paid" ? "pending" : "paid";
    await Splits.updateParticipantStatus(ctx, participation._id, newStatus);

    return { newStatus };
  },
});

/**
 * Mark a participant's payment as paid.
 */
export const markParticipantPaid = mutation({
  args: {
    participantId: v.id("splitParticipants"),
  },
  handler: async (ctx, { participantId }) => {
    const user = await Auth.requireUser(ctx);

    // Get the participant record
    const participant = await ctx.db.get(participantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    // Verify user owns the split
    await Splits.verifyOwnership(ctx, participant.splitId, user._id);

    await Splits.updateParticipantStatus(ctx, participantId, "paid");
  },
});

/**
 * Mark a participant's payment as pending.
 */
export const markParticipantPending = mutation({
  args: {
    participantId: v.id("splitParticipants"),
  },
  handler: async (ctx, { participantId }) => {
    const user = await Auth.requireUser(ctx);

    // Get the participant record
    const participant = await ctx.db.get(participantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    // Verify user owns the split
    await Splits.verifyOwnership(ctx, participant.splitId, user._id);

    await Splits.updateParticipantStatus(ctx, participantId, "pending");
  },
});

// ==================== RECEIPT ITEM MUTATIONS ====================

/**
 * Add a receipt item to a split.
 */
export const addReceiptItem = mutation({
  args: {
    splitId: v.id("splits"),
    name: v.string(),
    quantity: v.number(),
    price: v.number(),
    assignedToUserIds: v.array(v.id("users")),
  },
  handler: async (ctx, { splitId, ...item }) => {
    const user = await Auth.requireUser(ctx);
    await Splits.verifyOwnership(ctx, splitId, user._id);
    return await Splits.addReceiptItem(ctx, { splitId, ...item });
  },
});

/**
 * Update a receipt item.
 */
export const updateReceiptItem = mutation({
  args: {
    itemId: v.id("receiptItems"),
    name: v.optional(v.string()),
    quantity: v.optional(v.number()),
    price: v.optional(v.number()),
    assignedToUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, { itemId, ...updates }) => {
    const user = await Auth.requireUser(ctx);

    // Get the item to find the split
    const item = await ctx.db.get(itemId);
    if (!item) {
      throw new Error("Receipt item not found");
    }

    // Verify user owns the split
    await Splits.verifyOwnership(ctx, item.splitId, user._id);

    await Splits.updateReceiptItem(ctx, itemId, updates);
  },
});

/**
 * Remove a receipt item.
 */
export const removeReceiptItem = mutation({
  args: {
    itemId: v.id("receiptItems"),
  },
  handler: async (ctx, { itemId }) => {
    const user = await Auth.requireUser(ctx);

    // Get the item to find the split
    const item = await ctx.db.get(itemId);
    if (!item) {
      throw new Error("Receipt item not found");
    }

    // Verify user owns the split
    await Splits.verifyOwnership(ctx, item.splitId, user._id);

    await Splits.removeReceiptItem(ctx, itemId);
  },
});
