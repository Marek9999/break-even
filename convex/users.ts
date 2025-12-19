import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import * as Auth from "./model/auth";
import * as Users from "./model/users";

/**
 * Get the current authenticated user.
 * Returns null if not logged in or user doesn't exist.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    return await Auth.getCurrentUser(ctx);
  },
});

/**
 * Get or create the current user.
 * Creates a new user record on first login.
 */
export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    return await Auth.getOrCreateUser(ctx);
  },
});

/**
 * Update the current user's profile.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await Auth.requireUser(ctx);
    await Users.updateProfile(ctx, user._id, args);
    return await ctx.db.get(user._id);
  },
});

/**
 * Get a user by their ID.
 * Used to fetch friend profiles.
 */
export const getById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Require authentication
    await Auth.requireAuth(ctx);
    return await Users.getById(ctx, userId);
  },
});

/**
 * Get multiple users by their IDs.
 * Used to fetch profiles for split participants.
 */
export const getByIds = query({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, { userIds }) => {
    // Require authentication
    await Auth.requireAuth(ctx);
    const users = await Users.getByIds(ctx, userIds);
    // Filter out nulls
    return users.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});
