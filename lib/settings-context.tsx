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
}

interface Friend {
  _id: Id<"users">;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  // UI helpers
  initials: string;
  color: string;
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
  isLoading: boolean;
  // Settings sheet
  openSettings: () => void;
  closeSettings: () => void;
  // User actions
  updateUser: (user: Partial<User>) => void;
  // Friend actions (using friendship system)
  sendFriendRequest: (addresseeId: Id<"users">) => Promise<void>;
  acceptFriendRequest: (friendshipId: Id<"friendships">) => Promise<void>;
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

  // Convex mutations
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const sendFriendRequestMutation = useMutation(api.friendships.sendRequest);
  const acceptFriendRequestMutation = useMutation(api.friendships.acceptRequest);
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
  
  const friends: Friend[] = (friendsData ?? []).map((f) => {
    const friend = f.friend;
    if (!friend) return null;
    return {
      _id: friend._id,
      name: friend.name,
      email: friend.email,
      phone: friend.phone,
      avatarUrl: friend.avatarUrl,
      initials: generateInitials(friend.name),
      color: generateAvatarColor(),
    };
  }).filter((f): f is Friend => f !== null);

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

  const sendFriendRequest = useCallback(async (addresseeId: Id<"users">) => {
    await sendFriendRequestMutation({ addresseeId });
  }, [sendFriendRequestMutation]);

  const acceptFriendRequest = useCallback(async (friendshipId: Id<"friendships">) => {
    await acceptFriendRequestMutation({ friendshipId });
  }, [acceptFriendRequestMutation]);

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
    isLoading,
    openSettings,
    closeSettings,
    updateUser,
    sendFriendRequest,
    acceptFriendRequest,
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
