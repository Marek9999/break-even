import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Get a user by their ID.
 */
export async function getById(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"users"> | null> {
  return await ctx.db.get(userId);
}

/**
 * Get a user by their Clerk ID.
 */
export async function getByClerkId(
  ctx: QueryCtx | MutationCtx,
  clerkId: string
): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}

/**
 * Update a user's profile.
 */
export async function updateProfile(
  ctx: MutationCtx,
  userId: Id<"users">,
  updates: {
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  }
): Promise<void> {
  await ctx.db.patch(userId, updates);
}

/**
 * Get multiple users by their IDs.
 */
export async function getByIds(
  ctx: QueryCtx | MutationCtx,
  userIds: Id<"users">[]
): Promise<(Doc<"users"> | null)[]> {
  return await Promise.all(userIds.map((id) => ctx.db.get(id)));
}
