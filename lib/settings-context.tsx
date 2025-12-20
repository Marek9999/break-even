"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  generateInitials,
  generateAvatarColor,
} from "./data";

// Types for UI state (matching Convex data structure)
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface BankAccount {
  _id: Id<"bankAccounts">;
  bankName: string;
  accountNumberLast4: string;
  accountType: "checking" | "savings" | "credit";
  balance: number;
  color: string;
  plaidItemId?: string;
  plaidAccessToken?: string;
}

interface Friend {
  _id: Id<"users">;
  friendshipId: Id<"friendships">;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  // UI helpers
  initials: string;
  color: string;
  // Status for pending/expired contacts
  status: "accepted" | "pending" | "expired";
  expiresAt?: number;
  daysRemaining?: number;
}

interface Invitation {
  friendshipId: Id<"friendships">;
  user: {
    _id: Id<"users">;
    name: string;
    email: string;
    initials: string;
    color: string;
  };
  expiresAt: number;
  daysRemaining: number;
  isExpired: boolean;
}

interface SettingsState {
  // User profile
  user: User;
  // Settings sheet open state
  isSettingsOpen: boolean;
  // Currently editing friend
  editingFriend: Friend | null;
  // Friend form dialog open
  isFriendFormOpen: boolean;
  // Selected bank account filter ("all" or bank ID)
  selectedBankFilter: string;
}

interface SettingsContextType extends SettingsState {
  // Data from Convex
  bankAccounts: BankAccount[];
  friends: Friend[];
  receivedInvitations: Invitation[];
  sentInvitations: Invitation[];
  isLoading: boolean;
  // Settings sheet
  openSettings: () => void;
  closeSettings: () => void;
  // User actions
  updateUser: (user: Partial<User>) => void;
  // Friend actions (using friendship system)
  sendFriendRequestByEmail: (email: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: Id<"friendships">) => Promise<void>;
  rejectFriendRequest: (friendshipId: Id<"friendships">) => Promise<void>;
  cancelSentRequest: (friendshipId: Id<"friendships">) => Promise<void>;
  reinviteFriend: (friendshipId: Id<"friendships">) => Promise<void>;
  removeFriend: (friendshipId: Id<"friendships">) => Promise<void>;
  openFriendForm: (friend?: Friend) => void;
  closeFriendForm: () => void;
  // Bank account actions
  addBankAccount: (account: Omit<BankAccount, "_id">) => Promise<void>;
  updateBankAccount: (id: Id<"bankAccounts">, updates: Partial<BankAccount>) => Promise<void>;
  removeBankAccount: (id: Id<"bankAccounts">) => Promise<void>;
  // Bank filter
  setBankFilter: (filter: string) => void;
}

const defaultUser: User = {
  id: "",
  name: "",
  email: "",
  phone: "",
};

const initialState: SettingsState = {
  user: defaultUser,
  isSettingsOpen: false,
  editingFriend: null,
  isFriendFormOpen: false,
  selectedBankFilter: "all",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const [state, setState] = useState<SettingsState>(initialState);

  // Convex queries
  const convexUser = useQuery(api.users.me);
  const bankAccountsData = useQuery(api.bankAccounts.list);
  const friendsData = useQuery(api.friendships.listFriends);
  const receivedInvitationsData = useQuery(api.friendships.listPendingRequests);
  const sentInvitationsData = useQuery(api.friendships.listSentRequests);

  // Convex mutations
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const sendFriendRequestByEmailMutation = useMutation(api.friendships.sendRequestByEmail);
  const acceptFriendRequestMutation = useMutation(api.friendships.acceptRequest);
  const rejectFriendRequestMutation = useMutation(api.friendships.rejectRequest);
  const cancelRequestMutation = useMutation(api.friendships.cancelRequest);
  const reinviteMutation = useMutation(api.friendships.reinvite);
  const removeFriendMutation = useMutation(api.friendships.remove);
  const createBankAccount = useMutation(api.bankAccounts.create);
  const updateBankAccountMutation = useMutation(api.bankAccounts.update);
  const removeBankAccountMutation = useMutation(api.bankAccounts.remove);

  // Ensure user exists in Convex on first load
  // Only call when:
  // 1. Clerk has loaded and user is signed in
  // 2. Convex auth is ready and authenticated
  // 3. The convexUser query has completed (not undefined) and returned null (user doesn't exist)
  React.useEffect(() => {
    if (
      isLoaded &&
      clerkUser &&
      !isConvexAuthLoading &&
      isAuthenticated &&
      convexUser === null
    ) {
      getOrCreateUser().catch(console.error);
    }
  }, [isLoaded, clerkUser, isConvexAuthLoading, isAuthenticated, convexUser, getOrCreateUser]);

  // Sync Clerk user data to local state
  React.useEffect(() => {
    if (isLoaded && clerkUser) {
      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User";
      const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress || "";
      const primaryPhone = clerkUser.phoneNumbers[0]?.phoneNumber || "";

      setState((prev) => ({
        ...prev,
        user: {
          id: clerkUser.id,
          name: fullName,
          email: primaryEmail,
          phone: primaryPhone,
          avatar: clerkUser.imageUrl,
        },
      }));
    }
  }, [isLoaded, clerkUser]);

  // Transform Convex data to UI format
  const bankAccounts: BankAccount[] = bankAccountsData ?? [];
  
  // Helper to calculate days remaining and expired status
  const calculateExpiry = (expiresAt: number | undefined) => {
    if (!expiresAt) return { daysRemaining: 7, isExpired: false };
    const now = Date.now();
    const msRemaining = expiresAt - now;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
    return { daysRemaining, isExpired: msRemaining <= 0 };
  };

  // Transform accepted friends
  const acceptedFriends: Friend[] = (friendsData ?? []).map((f) => {
    const friend = f.friend;
    if (!friend) return null;
    return {
      _id: friend._id,
      friendshipId: f.friendship._id,
      name: friend.name,
      email: friend.email,
      phone: friend.phone,
      avatarUrl: friend.avatarUrl,
      initials: generateInitials(friend.name),
      color: generateAvatarColor(),
      status: "accepted" as const,
    };
  }).filter((f): f is Friend => f !== null);

  // Transform sent invitations into friends with pending/expired status
  // These are people we invited - include them so we can split bills with them
  const pendingFriends: Friend[] = (sentInvitationsData ?? []).map((inv) => {
    const addressee = inv.addressee;
    if (!addressee) return null;
    const { daysRemaining, isExpired } = calculateExpiry(inv.friendship.expiresAt);
    return {
      _id: addressee._id,
      friendshipId: inv.friendship._id,
      name: addressee.name,
      email: addressee.email,
      phone: addressee.phone,
      avatarUrl: addressee.avatarUrl,
      initials: generateInitials(addressee.name),
      color: generateAvatarColor(),
      status: isExpired ? "expired" as const : "pending" as const,
      expiresAt: inv.friendship.expiresAt,
      daysRemaining,
    };
  }).filter((f): f is Friend => f !== null);

  // Merge and sort: accepted first, then pending, then expired
  const friends: Friend[] = [...acceptedFriends, ...pendingFriends].sort((a, b) => {
    const statusOrder = { accepted: 0, pending: 1, expired: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Transform received invitations (people who invited us) - only show pending, not expired
  const receivedInvitations: Invitation[] = (receivedInvitationsData ?? [])
    .map((inv) => {
      const requester = inv.requester;
      if (!requester) return null;
      const { daysRemaining, isExpired } = calculateExpiry(inv.friendship.expiresAt);
      if (isExpired) return null; // Don't show expired received invitations
      return {
        friendshipId: inv.friendship._id,
        user: {
          _id: requester._id,
          name: requester.name,
          email: requester.email,
          initials: generateInitials(requester.name),
          color: generateAvatarColor(),
        },
        expiresAt: inv.friendship.expiresAt ?? Date.now(),
        daysRemaining,
        isExpired,
      };
    })
    .filter((inv): inv is Invitation => inv !== null);

  // Sent invitations for UI display (pending only - expired now show in friends list)
  const sentInvitations: Invitation[] = (sentInvitationsData ?? [])
    .map((inv) => {
      const addressee = inv.addressee;
      if (!addressee) return null;
      const { daysRemaining, isExpired } = calculateExpiry(inv.friendship.expiresAt);
      if (isExpired) return null; // Expired ones are now in the friends list
      return {
        friendshipId: inv.friendship._id,
        user: {
          _id: addressee._id,
          name: addressee.name,
          email: addressee.email,
          initials: generateInitials(addressee.name),
          color: generateAvatarColor(),
        },
        expiresAt: inv.friendship.expiresAt ?? Date.now(),
        daysRemaining,
        isExpired,
      };
    })
    .filter((inv): inv is Invitation => inv !== null);

  const isLoading = bankAccountsData === undefined || friendsData === undefined;

  const openSettings = useCallback(() => {
    setState((prev) => ({ ...prev, isSettingsOpen: true }));
  }, []);

  const closeSettings = useCallback(() => {
    setState((prev) => ({ ...prev, isSettingsOpen: false }));
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, ...updates },
    }));
  }, []);

  const sendFriendRequestByEmail = useCallback(async (email: string) => {
    await sendFriendRequestByEmailMutation({ email });
  }, [sendFriendRequestByEmailMutation]);

  const acceptFriendRequest = useCallback(async (friendshipId: Id<"friendships">) => {
    await acceptFriendRequestMutation({ friendshipId });
  }, [acceptFriendRequestMutation]);

  const rejectFriendRequest = useCallback(async (friendshipId: Id<"friendships">) => {
    await rejectFriendRequestMutation({ friendshipId });
  }, [rejectFriendRequestMutation]);

  const cancelSentRequest = useCallback(async (friendshipId: Id<"friendships">) => {
    await cancelRequestMutation({ friendshipId });
  }, [cancelRequestMutation]);

  const reinviteFriend = useCallback(async (friendshipId: Id<"friendships">) => {
    await reinviteMutation({ friendshipId });
  }, [reinviteMutation]);

  const removeFriend = useCallback(async (friendshipId: Id<"friendships">) => {
    await removeFriendMutation({ friendshipId });
  }, [removeFriendMutation]);

  const openFriendForm = useCallback((friend?: Friend) => {
    setState((prev) => ({
      ...prev,
      editingFriend: friend || null,
      isFriendFormOpen: true,
    }));
  }, []);

  const closeFriendForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editingFriend: null,
      isFriendFormOpen: false,
    }));
  }, []);

  const addBankAccount = useCallback(async (account: Omit<BankAccount, "_id">) => {
    await createBankAccount(account);
  }, [createBankAccount]);

  const updateBankAccount = useCallback(async (id: Id<"bankAccounts">, updates: Partial<BankAccount>) => {
    await updateBankAccountMutation({ bankAccountId: id, ...updates });
  }, [updateBankAccountMutation]);

  const removeBankAccount = useCallback(async (id: Id<"bankAccounts">) => {
    await removeBankAccountMutation({ bankAccountId: id });
  }, [removeBankAccountMutation]);

  const setBankFilter = useCallback((filter: string) => {
    setState((prev) => ({ ...prev, selectedBankFilter: filter }));
  }, []);

  const value: SettingsContextType = {
    ...state,
    bankAccounts,
    friends,
    receivedInvitations,
    sentInvitations,
    isLoading,
    openSettings,
    closeSettings,
    updateUser,
    sendFriendRequestByEmail,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelSentRequest,
    reinviteFriend,
    removeFriend,
    openFriendForm,
    closeFriendForm,
    addBankAccount,
    updateBankAccount,
    removeBankAccount,
    setBankFilter,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
