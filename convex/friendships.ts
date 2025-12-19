import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import * as Auth from "./model/auth";
import * as Friendships from "./model/friendships";
import * as Users from "./model/users";

/**
 * Send a friend request to another user by ID.
 */
export const sendRequest = mutation({
  args: {
    addresseeId: v.id("users"),
  },
  handler: async (ctx, { addresseeId }) => {
    const user = await Auth.requireUser(ctx);

    // Can't send request to yourself
    if (user._id === addresseeId) {
      throw new Error("You cannot send a friend request to yourself");
    }

    // Verify addressee exists
    const addressee = await Users.getById(ctx, addresseeId);
    if (!addressee) {
      throw new Error("User not found");
    }

    return await Friendships.sendRequest(ctx, user._id, addresseeId);
  },
});

/**
 * Send a friend request by email.
 * If the user doesn't exist, create a placeholder user.
 */
export const sendRequestByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const user = await Auth.requireUser(ctx);
    const normalizedEmail = email.toLowerCase().trim();

    // Can't send request to yourself
    if (user.email.toLowerCase() === normalizedEmail) {
      throw new Error("You cannot send a friend request to yourself");
    }

    // Check if user exists by email
    let addressee = await Users.getByEmail(ctx, normalizedEmail);

    // If user doesn't exist, create a placeholder user
    if (!addressee) {
      const placeholderId = await ctx.db.insert("users", {
        clerkId: `invited-${normalizedEmail}`,
        name: normalizedEmail.split("@")[0],
        email: normalizedEmail,
      });
      addressee = await ctx.db.get(placeholderId);
    }

    if (!addressee) {
      throw new Error("Failed to create invitation");
    }

    return await Friendships.sendRequest(ctx, user._id, addressee._id);
  },
});

/**
 * Accept a friend request.
 */
export const acceptRequest = mutation({
  args: {
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, { friendshipId }) => {
    const user = await Auth.requireUser(ctx);
    await Friendships.acceptRequest(ctx, friendshipId, user._id);
  },
});

/**
 * Reject a friend request.
 */
export const rejectRequest = mutation({
  args: {
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, { friendshipId }) => {
    const user = await Auth.requireUser(ctx);
    await Friendships.rejectRequest(ctx, friendshipId, user._id);
  },
});

/**
 * Remove a friendship (unfriend).
 */
export const remove = mutation({
  args: {
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, { friendshipId }) => {
    const user = await Auth.requireUser(ctx);
    await Friendships.removeFriendship(ctx, friendshipId, user._id);
  },
});

/**
 * Cancel a sent friend request.
 */
export const cancelRequest = mutation({
  args: {
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, { friendshipId }) => {
    const user = await Auth.requireUser(ctx);
    const friendship = await ctx.db.get(friendshipId);
    
    if (!friendship) {
      throw new Error("Friend request not found");
    }
    
    // Only the requester can cancel
    if (friendship.requesterId !== user._id) {
      throw new Error("Only the sender can cancel a friend request");
    }
    
    if (friendship.status !== "pending") {
      throw new Error("Friend request is not pending");
    }
    
    await ctx.db.delete(friendshipId);
  },
});

/**
 * Reinvite a friend (reset expiration for pending/expired invitation).
 */
export const reinvite = mutation({
  args: {
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, { friendshipId }) => {
    const user = await Auth.requireUser(ctx);
    const friendship = await ctx.db.get(friendshipId);
    
    if (!friendship) {
      throw new Error("Friend request not found");
    }
    
    // Only the requester can reinvite
    if (friendship.requesterId !== user._id) {
      throw new Error("Only the sender can reinvite");
    }
    
    // Can only reinvite pending invitations
    if (friendship.status !== "pending") {
      throw new Error("Can only reinvite pending invitations");
    }
    
    // Reset expiration to 7 days from now
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    await ctx.db.patch(friendshipId, {
      expiresAt: Date.now() + SEVEN_DAYS_MS,
    });
  },
});

/**
 * Get all accepted friends for the current user.
 * Returns friend user profiles.
 * Returns empty array if not authenticated.
 */
export const listFriends = query({
  args: {},
  handler: async (ctx) => {
    const user = await Auth.getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    const friendships = await Friendships.getFriends(ctx, user._id);

    // Get the friend user IDs
    const friendIds = friendships.map((f) =>
      f.requesterId === user._id ? f.addresseeId : f.requesterId
    );

    // Fetch friend profiles
    const friends = await Users.getByIds(ctx, friendIds);

    // Return friendships with user profiles
    return friendships.map((f, i) => ({
      friendship: f,
      friend: friends[i],
    }));
  },
});

/**
 * Get pending friend requests received by the current user.
 * Returns empty array if not authenticated.
 */
export const listPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await Auth.getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    const requests = await Friendships.getPendingRequests(ctx, user._id);

    // Get requester profiles
    const requesterIds = requests.map((r) => r.requesterId);
    const requesters = await Users.getByIds(ctx, requesterIds);

    return requests.map((r, i) => ({
      friendship: r,
      requester: requesters[i],
    }));
  },
});

/**
 * Get pending friend requests sent by the current user.
 * Returns empty array if not authenticated.
 */
export const listSentRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await Auth.getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    const requests = await Friendships.getSentRequests(ctx, user._id);

    // Get addressee profiles
    const addresseeIds = requests.map((r) => r.addresseeId);
    const addressees = await Users.getByIds(ctx, addresseeIds);

    return requests.map((r, i) => ({
      friendship: r,
      addressee: addressees[i],
    }));
  },
});
