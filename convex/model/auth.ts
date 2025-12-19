import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

/**
 * Get the current authenticated user's identity from Clerk.
 * Throws if not authenticated.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: You must be logged in");
  }
  return identity;
}

/**
 * Get the current user from the database.
 * Returns null if user doesn't exist yet.
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user;
}

/**
 * Get the current user from the database.
 * Throws if not authenticated or user doesn't exist.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const identity = await requireAuth(ctx);

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found. Please complete your profile setup.");
  }

  return user;
}

/**
 * Get or create a user based on Clerk identity.
 * Used during first login to create the user record.
 */
export async function getOrCreateUser(
  ctx: MutationCtx
): Promise<Doc<"users">> {
  const identity = await requireAuth(ctx);

  // Check if user already exists
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (existingUser) {
    return existingUser;
  }

  // Create new user from Clerk identity
  const userId = await ctx.db.insert("users", {
    clerkId: identity.subject,
    name: identity.name ?? "Anonymous",
    email: identity.email ?? "",
    phone: identity.phoneNumber,
    avatarUrl: identity.pictureUrl,
  });

  const newUser = await ctx.db.get(userId);
  if (!newUser) {
    throw new Error("Failed to create user");
  }

  return newUser;
}
