import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - linked to Clerk via clerkId
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  // Friendships - bidirectional friend relationships
  friendships: defineTable({
    requesterId: v.id("users"),
    addresseeId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    // Expiration timestamp for pending invitations (7 days from creation)
    expiresAt: v.optional(v.number()),
  })
    .index("by_requester", ["requesterId"])
    .index("by_addressee", ["addresseeId"])
    .index("by_requester_status", ["requesterId", "status"]),

  // Bank accounts - user's connected accounts (Plaid-integrated)
  bankAccounts: defineTable({
    userId: v.id("users"),
    bankName: v.string(),
    accountNumberLast4: v.string(),
    accountType: v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("credit")
    ),
    balance: v.number(),
    color: v.string(),
    // Plaid integration fields
    plaidItemId: v.optional(v.string()),
    plaidAccessToken: v.optional(v.string()),
    plaidAccountId: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_plaidItemId", ["plaidItemId"]),

  // Transactions - user's transactions from bank accounts
  transactions: defineTable({
    userId: v.id("users"),
    bankAccountId: v.id("bankAccounts"),
    merchant: v.string(),
    amount: v.number(),
    date: v.string(),
    category: v.string(),
    description: v.string(),
    // Plaid integration field for deduplication
    plaidTransactionId: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_bankAccountId", ["bankAccountId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_plaidTransactionId", ["plaidTransactionId"]),

  // Splits - saved bill splits
  splits: defineTable({
    userId: v.id("users"),
    transactionId: v.id("transactions"),
    method: v.union(
      v.literal("equal"),
      v.literal("percentage"),
      v.literal("custom"),
      v.literal("itemized")
    ),
    status: v.union(v.literal("pending"), v.literal("settled")),
    receiptImageId: v.optional(v.id("_storage")),
  })
    .index("by_userId", ["userId"])
    .index("by_transactionId", ["transactionId"])
    .index("by_userId_status", ["userId", "status"]),

  // Split participants - who owes what in a split
  splitParticipants: defineTable({
    splitId: v.id("splits"),
    userId: v.id("users"),
    amount: v.number(),
    percentage: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("paid")),
  })
    .index("by_splitId", ["splitId"])
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"]),

  // Receipt items - individual items for itemized splits
  receiptItems: defineTable({
    splitId: v.id("splits"),
    name: v.string(),
    quantity: v.number(),
    price: v.number(),
    assignedToUserIds: v.array(v.id("users")),
  }).index("by_splitId", ["splitId"]),
});
