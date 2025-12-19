import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// 7 days in milliseconds
const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Send a friend request to another user.
 */
export async function sendRequest(
  ctx: MutationCtx,
  requesterId: Id<"users">,
  addresseeId: Id<"users">
): Promise<Id<"friendships">> {
  // Check if friendship already exists
  const existingAsRequester = await ctx.db
    .query("friendships")
    .withIndex("by_requester", (q) => q.eq("requesterId", requesterId))
    .filter((q) => q.eq(q.field("addresseeId"), addresseeId))
    .first();

  if (existingAsRequester) {
    // If it's expired, delete and allow resending
    if (existingAsRequester.status === "pending" && 
        existingAsRequester.expiresAt && 
        existingAsRequester.expiresAt < Date.now()) {
      await ctx.db.delete(existingAsRequester._id);
    } else {
      throw new Error("Friend request already exists");
    }
  }

  // Check reverse direction too
  const existingAsAddressee = await ctx.db
    .query("friendships")
    .withIndex("by_requester", (q) => q.eq("requesterId", addresseeId))
    .filter((q) => q.eq(q.field("addresseeId"), requesterId))
    .first();

  if (existingAsAddressee) {
    // If it's expired, delete and allow sending
    if (existingAsAddressee.status === "pending" && 
        existingAsAddressee.expiresAt && 
        existingAsAddressee.expiresAt < Date.now()) {
      await ctx.db.delete(existingAsAddressee._id);
    } else {
      throw new Error("Friend request already exists from this user");
    }
  }

  return await ctx.db.insert("friendships", {
    requesterId,
    addresseeId,
    status: "pending",
    expiresAt: Date.now() + INVITATION_EXPIRY_MS,
  });
}

/**
 * Accept a friend request.
 */
export async function acceptRequest(
  ctx: MutationCtx,
  friendshipId: Id<"friendships">,
  currentUserId: Id<"users">
): Promise<void> {
  const friendship = await ctx.db.get(friendshipId);
  if (!friendship) {
    throw new Error("Friendship not found");
  }

  // Only the addressee can accept
  if (friendship.addresseeId !== currentUserId) {
    throw new Error("Only the recipient can accept a friend request");
  }

  if (friendship.status !== "pending") {
    throw new Error("Friend request is not pending");
  }

  await ctx.db.patch(friendshipId, { status: "accepted" });
}

/**
 * Reject a friend request.
 */
export async function rejectRequest(
  ctx: MutationCtx,
  friendshipId: Id<"friendships">,
  currentUserId: Id<"users">
): Promise<void> {
  const friendship = await ctx.db.get(friendshipId);
  if (!friendship) {
    throw new Error("Friendship not found");
  }

  // Only the addressee can reject
  if (friendship.addresseeId !== currentUserId) {
    throw new Error("Only the recipient can reject a friend request");
  }

  if (friendship.status !== "pending") {
    throw new Error("Friend request is not pending");
  }

  await ctx.db.patch(friendshipId, { status: "rejected" });
}

/**
 * Remove a friendship (unfriend).
 */
export async function removeFriendship(
  ctx: MutationCtx,
  friendshipId: Id<"friendships">,
  currentUserId: Id<"users">
): Promise<void> {
  const friendship = await ctx.db.get(friendshipId);
  if (!friendship) {
    throw new Error("Friendship not found");
  }

  // Either party can remove the friendship
  if (
    friendship.requesterId !== currentUserId &&
    friendship.addresseeId !== currentUserId
  ) {
    throw new Error("You are not part of this friendship");
  }

  await ctx.db.delete(friendshipId);
}

/**
 * Get all accepted friends for a user.
 */
export async function getFriends(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"friendships">[]> {
  // Get friendships where user is requester
  const asRequester = await ctx.db
    .query("friendships")
    .withIndex("by_requester_status", (q) =>
      q.eq("requesterId", userId).eq("status", "accepted")
    )
    .collect();

  // Get friendships where user is addressee
  const asAddressee = await ctx.db
    .query("friendships")
    .withIndex("by_addressee", (q) => q.eq("addresseeId", userId))
    .filter((q) => q.eq(q.field("status"), "accepted"))
    .collect();

  return [...asRequester, ...asAddressee];
}

/**
 * Get pending friend requests received by a user.
 */
export async function getPendingRequests(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"friendships">[]> {
  return await ctx.db
    .query("friendships")
    .withIndex("by_addressee", (q) => q.eq("addresseeId", userId))
    .filter((q) => q.eq(q.field("status"), "pending"))
    .collect();
}

/**
 * Get pending friend requests sent by a user.
 */
export async function getSentRequests(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"friendships">[]> {
  return await ctx.db
    .query("friendships")
    .withIndex("by_requester_status", (q) =>
      q.eq("requesterId", userId).eq("status", "pending")
    )
    .collect();
}
