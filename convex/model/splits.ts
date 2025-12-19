import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// ==================== SPLITS ====================

/**
 * Get all splits created by a user.
 */
export async function getByUserId(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"splits">[]> {
  return await ctx.db
    .query("splits")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
}

/**
 * Get splits by status for a user.
 */
export async function getByUserIdAndStatus(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  status: "pending" | "settled"
): Promise<Doc<"splits">[]> {
  return await ctx.db
    .query("splits")
    .withIndex("by_userId_status", (q) =>
      q.eq("userId", userId).eq("status", status)
    )
    .collect();
}

/**
 * Get a split for a specific transaction.
 */
export async function getByTransactionId(
  ctx: QueryCtx | MutationCtx,
  transactionId: Id<"transactions">
): Promise<Doc<"splits"> | null> {
  return await ctx.db
    .query("splits")
    .withIndex("by_transactionId", (q) => q.eq("transactionId", transactionId))
    .first();
}

/**
 * Get a split by ID.
 */
export async function getById(
  ctx: QueryCtx | MutationCtx,
  splitId: Id<"splits">
): Promise<Doc<"splits"> | null> {
  return await ctx.db.get(splitId);
}

/**
 * Create a new split.
 */
export async function create(
  ctx: MutationCtx,
  data: {
    userId: Id<"users">;
    transactionId: Id<"transactions">;
    method: "equal" | "percentage" | "custom" | "itemized";
    status: "pending" | "settled";
    receiptImageId?: Id<"_storage">;
  }
): Promise<Id<"splits">> {
  return await ctx.db.insert("splits", data);
}

/**
 * Update a split's status.
 */
export async function updateStatus(
  ctx: MutationCtx,
  splitId: Id<"splits">,
  status: "pending" | "settled"
): Promise<void> {
  await ctx.db.patch(splitId, { status });
}

/**
 * Delete a split and all its participants and receipt items.
 */
export async function remove(
  ctx: MutationCtx,
  splitId: Id<"splits">
): Promise<void> {
  // Delete all participants
  const participants = await ctx.db
    .query("splitParticipants")
    .withIndex("by_splitId", (q) => q.eq("splitId", splitId))
    .collect();
  for (const participant of participants) {
    await ctx.db.delete(participant._id);
  }

  // Delete all receipt items
  const items = await ctx.db
    .query("receiptItems")
    .withIndex("by_splitId", (q) => q.eq("splitId", splitId))
    .collect();
  for (const item of items) {
    await ctx.db.delete(item._id);
  }

  // Delete the split
  await ctx.db.delete(splitId);
}

/**
 * Verify the user owns this split.
 */
export async function verifyOwnership(
  ctx: QueryCtx | MutationCtx,
  splitId: Id<"splits">,
  userId: Id<"users">
): Promise<Doc<"splits">> {
  const split = await ctx.db.get(splitId);
  if (!split) {
    throw new Error("Split not found");
  }
  if (split.userId !== userId) {
    throw new Error("You do not have access to this split");
  }
  return split;
}

// ==================== SPLIT PARTICIPANTS ====================

/**
 * Get all participants for a split.
 */
export async function getParticipants(
  ctx: QueryCtx | MutationCtx,
  splitId: Id<"splits">
): Promise<Doc<"splitParticipants">[]> {
  return await ctx.db
    .query("splitParticipants")
    .withIndex("by_splitId", (q) => q.eq("splitId", splitId))
    .collect();
}

/**
 * Get all splits a user participates in.
 */
export async function getParticipatingIn(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"splitParticipants">[]> {
  return await ctx.db
    .query("splitParticipants")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
}

/**
 * Get pending payments for a user.
 */
export async function getPendingPayments(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"splitParticipants">[]> {
  return await ctx.db
    .query("splitParticipants")
    .withIndex("by_userId_status", (q) =>
      q.eq("userId", userId).eq("status", "pending")
    )
    .collect();
}

/**
 * Add a participant to a split.
 */
export async function addParticipant(
  ctx: MutationCtx,
  data: {
    splitId: Id<"splits">;
    userId: Id<"users">;
    amount: number;
    percentage?: number;
    status: "pending" | "paid";
  }
): Promise<Id<"splitParticipants">> {
  return await ctx.db.insert("splitParticipants", data);
}

/**
 * Update a participant's payment status.
 */
export async function updateParticipantStatus(
  ctx: MutationCtx,
  participantId: Id<"splitParticipants">,
  status: "pending" | "paid"
): Promise<void> {
  await ctx.db.patch(participantId, { status });
}

// ==================== RECEIPT ITEMS ====================

/**
 * Get all receipt items for a split.
 */
export async function getReceiptItems(
  ctx: QueryCtx | MutationCtx,
  splitId: Id<"splits">
): Promise<Doc<"receiptItems">[]> {
  return await ctx.db
    .query("receiptItems")
    .withIndex("by_splitId", (q) => q.eq("splitId", splitId))
    .collect();
}

/**
 * Add a receipt item to a split.
 */
export async function addReceiptItem(
  ctx: MutationCtx,
  data: {
    splitId: Id<"splits">;
    name: string;
    quantity: number;
    price: number;
    assignedToUserIds: Id<"users">[];
  }
): Promise<Id<"receiptItems">> {
  return await ctx.db.insert("receiptItems", data);
}

/**
 * Update a receipt item.
 */
export async function updateReceiptItem(
  ctx: MutationCtx,
  itemId: Id<"receiptItems">,
  updates: {
    name?: string;
    quantity?: number;
    price?: number;
    assignedToUserIds?: Id<"users">[];
  }
): Promise<void> {
  await ctx.db.patch(itemId, updates);
}

/**
 * Delete a receipt item.
 */
export async function removeReceiptItem(
  ctx: MutationCtx,
  itemId: Id<"receiptItems">
): Promise<void> {
  await ctx.db.delete(itemId);
}
