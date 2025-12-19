import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import * as Auth from "./model/auth";
import * as Friendships from "./model/friendships";
import * as Users from "./model/users";

/**
 * Send a friend request to another user.
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
