import { mutation } from "./_generated/server";
import * as Auth from "./model/auth";

// 7 days in milliseconds
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Dummy friends data (matching the contacts from lib/data.ts)
const dummyFriends = [
  {
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    phone: "+1 (555) 111-1111",
  },
  {
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    phone: "+1 (555) 222-2222",
  },
  {
    name: "Mike Williams",
    email: "mike.w@email.com",
    phone: "+1 (555) 333-3333",
  },
  {
    name: "Emma Davis",
    email: "emma.davis@email.com",
    phone: "+1 (555) 444-4444",
  },
  {
    name: "James Wilson",
    email: "james.wilson@email.com",
    phone: "+1 (555) 555-5555",
  },
];

// Dummy users who will send us invitations (received)
const dummyInviters = [
  {
    name: "Rachel Green",
    email: "rachel.green@email.com",
    phone: "+1 (555) 666-6666",
    daysUntilExpiry: 5, // expires in 5 days
  },
  {
    name: "Ross Geller",
    email: "ross.geller@email.com", 
    phone: "+1 (555) 777-7777",
    daysUntilExpiry: 2, // expires in 2 days (urgent!)
  },
  {
    name: "Phoebe Buffay",
    email: "phoebe.buffay@email.com",
    phone: "+1 (555) 101-0101",
    daysUntilExpiry: 6, // expires in 6 days
  },
];

// Dummy users we've sent invitations to (sent)
const dummyInvitees = [
  {
    name: "Monica Bing",
    email: "monica.bing@email.com",
    phone: "+1 (555) 888-8888",
    daysUntilExpiry: 6, // sent 1 day ago
  },
  {
    name: "Chandler Bing",
    email: "chandler.bing@email.com",
    phone: "+1 (555) 999-9999",
    daysUntilExpiry: 3, // sent 4 days ago
  },
];

/**
 * Seed dummy friends for the current user.
 * Creates user records for each dummy friend and establishes friendships.
 * Safe to run multiple times - skips existing users.
 */
export const seedFriends = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await Auth.requireUser(ctx);

    const results = {
      created: [] as string[],
      skipped: [] as string[],
      friendships: 0,
    };

    for (const friend of dummyFriends) {
      // Check if user already exists by email
      const existingUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), friend.email))
        .first();

      let friendUserId;

      if (existingUser) {
        friendUserId = existingUser._id;
        results.skipped.push(friend.name);
      } else {
        // Create the dummy user with a fake clerkId
        friendUserId = await ctx.db.insert("users", {
          clerkId: `dummy-${friend.email}`,
          name: friend.name,
          email: friend.email,
          phone: friend.phone,
        });
        results.created.push(friend.name);
      }

      // Check if friendship already exists
      const existingFriendship = await ctx.db
        .query("friendships")
        .withIndex("by_requester", (q) => q.eq("requesterId", currentUser._id))
        .filter((q) => q.eq(q.field("addresseeId"), friendUserId))
        .first();

      const reverseFriendship = await ctx.db
        .query("friendships")
        .withIndex("by_requester", (q) => q.eq("requesterId", friendUserId))
        .filter((q) => q.eq(q.field("addresseeId"), currentUser._id))
        .first();

      if (!existingFriendship && !reverseFriendship) {
        // Create an accepted friendship
        await ctx.db.insert("friendships", {
          requesterId: currentUser._id,
          addresseeId: friendUserId,
          status: "accepted",
        });
        results.friendships++;
      }
    }

    return results;
  },
});

/**
 * Seed dummy invitations for testing the invitation UI.
 * Creates users who have sent us invitations and users we've invited.
 */
export const seedInvitations = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await Auth.requireUser(ctx);

    const results = {
      receivedInvitations: 0,
      sentInvitations: 0,
    };

    // Create users who will send us invitations (we receive these)
    for (const inviter of dummyInviters) {
      // Check if user already exists
      let inviterUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), inviter.email))
        .first();

      if (!inviterUser) {
        const inviterUserId = await ctx.db.insert("users", {
          clerkId: `dummy-${inviter.email}`,
          name: inviter.name,
          email: inviter.email,
          phone: inviter.phone,
        });
        inviterUser = await ctx.db.get(inviterUserId);
      }

      if (!inviterUser) continue;

      // Check if invitation already exists
      const existingInvitation = await ctx.db
        .query("friendships")
        .withIndex("by_requester", (q) => q.eq("requesterId", inviterUser._id))
        .filter((q) => q.eq(q.field("addresseeId"), currentUser._id))
        .first();

      if (!existingInvitation) {
        // Create pending invitation FROM this user TO us
        await ctx.db.insert("friendships", {
          requesterId: inviterUser._id,
          addresseeId: currentUser._id,
          status: "pending",
          expiresAt: Date.now() + (inviter.daysUntilExpiry * 24 * 60 * 60 * 1000),
        });
        results.receivedInvitations++;
      }
    }

    // Create users we've sent invitations to (we sent these)
    for (const invitee of dummyInvitees) {
      // Check if user already exists
      let inviteeUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), invitee.email))
        .first();

      if (!inviteeUser) {
        const inviteeUserId = await ctx.db.insert("users", {
          clerkId: `dummy-${invitee.email}`,
          name: invitee.name,
          email: invitee.email,
          phone: invitee.phone,
        });
        inviteeUser = await ctx.db.get(inviteeUserId);
      }

      if (!inviteeUser) continue;

      // Check if invitation already exists
      const existingInvitation = await ctx.db
        .query("friendships")
        .withIndex("by_requester", (q) => q.eq("requesterId", currentUser._id))
        .filter((q) => q.eq(q.field("addresseeId"), inviteeUser._id))
        .first();

      if (!existingInvitation) {
        // Create pending invitation FROM us TO this user
        await ctx.db.insert("friendships", {
          requesterId: currentUser._id,
          addresseeId: inviteeUser._id,
          status: "pending",
          expiresAt: Date.now() + (invitee.daysUntilExpiry * 24 * 60 * 60 * 1000),
        });
        results.sentInvitations++;
      }
    }

    return results;
  },
});

/**
 * Clear all seeded dummy friends (for cleanup).
 * Only removes users with dummy- prefix in clerkId.
 */
export const clearDummyFriends = mutation({
  args: {},
  handler: async (ctx) => {
    await Auth.requireUser(ctx);

    // Find all dummy users
    const allUsers = await ctx.db.query("users").collect();
    const dummyUsers = allUsers.filter((u) => u.clerkId.startsWith("dummy-"));

    let deletedUsers = 0;
    let deletedFriendships = 0;

    for (const dummyUser of dummyUsers) {
      // Delete friendships involving this user
      const friendships1 = await ctx.db
        .query("friendships")
        .withIndex("by_requester", (q) => q.eq("requesterId", dummyUser._id))
        .collect();

      const friendships2 = await ctx.db
        .query("friendships")
        .withIndex("by_addressee", (q) => q.eq("addresseeId", dummyUser._id))
        .collect();

      for (const f of [...friendships1, ...friendships2]) {
        await ctx.db.delete(f._id);
        deletedFriendships++;
      }

      // Delete the dummy user
      await ctx.db.delete(dummyUser._id);
      deletedUsers++;
    }

    return { deletedUsers, deletedFriendships };
  },
});
