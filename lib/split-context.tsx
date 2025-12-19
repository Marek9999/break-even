"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { generateInitials, generateAvatarColor } from "./data";

// Types for UI
export type SplitMethod = "equal" | "percentage" | "custom" | "itemized";

export interface Transaction {
  _id: Id<"transactions">;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  bankAccountId: Id<"bankAccounts">;
}

export interface ManualTransactionData {
  merchant: string;
  amount: number;
  date?: string;
  category?: string;
  description?: string;
}

export interface Friend {
  _id: Id<"users">;
  name: string;
  email: string;
  initials: string;
  color: string;
  status?: "accepted" | "pending" | "expired";
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  assignedTo: string[]; // array of friend IDs (as strings for local state)
}

export interface Participant {
  oderId: string; // Friend ID as string
  amount: number;
  percentage?: number;
  items?: string[];
}

export interface SavedSplit {
  _id: Id<"splits">;
  transaction: Transaction | null;
  method: SplitMethod;
  participants: Array<{
    oderId: Id<"users">;
    user: Friend | null;
    amount: number;
    percentage: number;
    status: "pending" | "paid";
  }>;
  receiptItems: Array<{
    _id: Id<"receiptItems">;
    name: string;
    quantity: number;
    price: number;
    assignedToUserIds: Id<"users">[];
  }>;
  status: "pending" | "settled";
  createdAt: number;
  // Computed status based on participant statuses
  overallStatus: "all_settled" | "settled_by_me" | "pending";
  settledCount: number;
  totalParticipants: number;
}

interface SplitState {
  // Current transaction being split
  selectedTransaction: Transaction | null;
  // Selected friends to split with
  selectedFriends: Friend[];
  // Split method
  splitMethod: SplitMethod;
  // Participants with their amounts (local UI state)
  participants: Participant[];
  // Receipt items for itemized splits (local UI state)
  receiptItems: ReceiptItem[];
  // Receipt image (base64)
  receiptImage: string | null;
  // Sheet open state
  isSheetOpen: boolean;
  // Current step in the flow (transaction-info is for manual transactions)
  currentStep: "transaction-info" | "contacts" | "method" | "configure" | "summary";
  // Currently viewing split detail
  viewingSplit: SavedSplit | null;
  // Detail dialog open
  isDetailOpen: boolean;
  // Manual transaction mode
  isManualTransactionMode: boolean;
  // Manual transaction data (merchant, amount, etc.)
  manualTransactionData: ManualTransactionData | null;
  // Include self in split
  includeSelf: boolean;
}

interface SplitContextType extends SplitState {
  // Data from Convex
  transactions: Transaction[];
  savedSplits: SavedSplit[];
  allFriends: Friend[];
  currentUser: Friend | null;
  isLoading: boolean;
  // Actions
  openSplitSheet: (transaction: Transaction) => void;
  closeSplitSheet: () => void;
  setSelectedFriends: (friends: Friend[]) => void;
  toggleFriend: (friend: Friend) => void;
  setSplitMethod: (method: SplitMethod) => void;
  setParticipants: (participants: Participant[]) => void;
  updateParticipantAmount: (friendId: string, amount: number) => void;
  updateParticipantPercentage: (friendId: string, percentage: number) => void;
  addReceiptItem: (item: Omit<ReceiptItem, "id">) => void;
  updateReceiptItem: (id: string, item: Partial<ReceiptItem>) => void;
  removeReceiptItem: (id: string) => void;
  assignItemToPerson: (itemId: string, friendId: string) => void;
  unassignItemFromPerson: (itemId: string, friendId: string) => void;
  setReceiptImage: (image: string | null) => void;
  setCurrentStep: (step: SplitState["currentStep"]) => void;
  calculateEqualSplit: () => void;
  calculateItemizedSplit: () => void;
  resetSplit: () => void;
  // Saved splits actions
  saveSplit: () => Promise<void>;
  deleteSplit: (id: Id<"splits">) => Promise<void>;
  viewSplitDetail: (split: SavedSplit) => void;
  closeSplitDetail: () => void;
  // Manual transaction actions
  openManualTransactionFlow: () => void;
  setManualTransactionData: (data: ManualTransactionData) => void;
  setIncludeSelf: (include: boolean) => void;
  saveManualTransactionWithSplit: () => Promise<void>;
}

const initialState: SplitState = {
  selectedTransaction: null,
  selectedFriends: [],
  splitMethod: "equal",
  participants: [],
  receiptItems: [],
  receiptImage: null,
  isSheetOpen: false,
  currentStep: "contacts",
  viewingSplit: null,
  isDetailOpen: false,
  isManualTransactionMode: false,
  manualTransactionData: null,
  includeSelf: false,
};

const SplitContext = createContext<SplitContextType | undefined>(undefined);

export function SplitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SplitState>(initialState);

  // Convex queries
  const transactionsData = useQuery(api.transactions.list);
  const splitsData = useQuery(api.splits.listWithStatus);
  const friendsData = useQuery(api.friendships.listFriends);
  const sentInvitationsData = useQuery(api.friendships.listSentRequests);
  const currentUserData = useQuery(api.users.me);

  // Convex mutations
  const createSplitMutation = useMutation(api.splits.create);
  const deleteSplitMutation = useMutation(api.splits.remove);
  const createManualWithSplitMutation = useMutation(api.transactions.createManualWithSplit);

  // Helper to calculate expired status
  const isExpired = (expiresAt: number | undefined) => {
    if (!expiresAt) return false;
    return expiresAt < Date.now();
  };

  // Transform Convex data
  const transactions: Transaction[] = (transactionsData ?? []).map((t) => ({
    _id: t._id,
    merchant: t.merchant,
    amount: t.amount,
    date: t.date,
    category: t.category,
    description: t.description,
    bankAccountId: t.bankAccountId,
  }));

  // Accepted friends
  const acceptedFriends: Friend[] = (friendsData ?? []).map((f) => {
    const friend = f.friend;
    if (!friend) return null;
    return {
      _id: friend._id,
      name: friend.name,
      email: friend.email,
      initials: generateInitials(friend.name),
      color: generateAvatarColor(),
      status: "accepted" as const,
    };
  }).filter((f): f is Friend => f !== null);

  // Pending/expired contacts (people we invited)
  const pendingContacts: Friend[] = (sentInvitationsData ?? []).map((inv) => {
    const addressee = inv.addressee;
    if (!addressee) return null;
    return {
      _id: addressee._id,
      name: addressee.name,
      email: addressee.email,
      initials: generateInitials(addressee.name),
      color: generateAvatarColor(),
      status: isExpired(inv.friendship.expiresAt) ? "expired" as const : "pending" as const,
    };
  }).filter((f): f is Friend => f !== null);

  // Merge all contacts - accepted first, then pending, then expired
  const allFriends: Friend[] = [...acceptedFriends, ...pendingContacts].sort((a, b) => {
    const statusOrder = { accepted: 0, pending: 1, expired: 2 };
    return (statusOrder[a.status || "accepted"]) - (statusOrder[b.status || "accepted"]);
  });

  // Current user as a Friend object for self-inclusion in splits
  const currentUser: Friend | null = currentUserData
    ? {
        _id: currentUserData._id,
        name: currentUserData.name,
        email: currentUserData.email,
        initials: generateInitials(currentUserData.name),
        color: "bg-blue-500",
        status: "accepted",
      }
    : null;

  // For saved splits, use the listWithStatus query which includes computed status
  const savedSplits: SavedSplit[] = (splitsData ?? []).map((s) => ({
    _id: s._id,
    transaction: s.transaction || transactions.find((t) => t._id === s.transactionId) || null,
    method: s.method,
    participants: [], // Populated when viewing details
    receiptItems: [], // Populated when viewing details
    status: s.status,
    createdAt: s._creationTime,
    overallStatus: s.overallStatus,
    settledCount: s.settledCount,
    totalParticipants: s.totalParticipants,
  }));

  const isLoading = transactionsData === undefined || splitsData === undefined || friendsData === undefined;

  const openSplitSheet = useCallback((transaction: Transaction) => {
    setState((prev) => ({
      ...prev,
      selectedTransaction: transaction,
      isSheetOpen: true,
      currentStep: "contacts",
    }));
  }, []);

  const closeSplitSheet = useCallback(() => {
    setState(initialState);
  }, []);

  const setSelectedFriends = useCallback((friends: Friend[]) => {
    setState((prev) => ({
      ...prev,
      selectedFriends: friends,
      participants: friends.map((f) => ({
        oderId: f._id,
        amount: 0,
        percentage: 0,
        items: [],
      })),
    }));
  }, []);

  const toggleFriend = useCallback((friend: Friend) => {
    setState((prev) => {
      const isSelected = prev.selectedFriends.some((f) => f._id === friend._id);
      const newFriends = isSelected
        ? prev.selectedFriends.filter((f) => f._id !== friend._id)
        : [...prev.selectedFriends, friend];

      return {
        ...prev,
        selectedFriends: newFriends,
        participants: newFriends.map((f) => ({
          oderId: f._id,
          amount: 0,
          percentage: 0,
          items: [],
        })),
      };
    });
  }, []);

  const setSplitMethod = useCallback((method: SplitMethod) => {
    setState((prev) => ({ ...prev, splitMethod: method }));
  }, []);

  const setParticipants = useCallback((participants: Participant[]) => {
    setState((prev) => ({ ...prev, participants }));
  }, []);

  const updateParticipantAmount = useCallback((friendId: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.oderId === friendId ? { ...p, amount } : p
      ),
    }));
  }, []);

  const updateParticipantPercentage = useCallback((friendId: string, percentage: number) => {
    setState((prev) => {
      const total = prev.isManualTransactionMode
        ? prev.manualTransactionData?.amount || 0
        : prev.selectedTransaction?.amount || 0;
      return {
        ...prev,
        participants: prev.participants.map((p) =>
          p.oderId === friendId
            ? { ...p, percentage, amount: (percentage / 100) * total }
            : p
        ),
      };
    });
  }, []);

  const addReceiptItem = useCallback((item: Omit<ReceiptItem, "id">) => {
    const newItem: ReceiptItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setState((prev) => ({
      ...prev,
      receiptItems: [...prev.receiptItems, newItem],
    }));
  }, []);

  const updateReceiptItem = useCallback((id: string, item: Partial<ReceiptItem>) => {
    setState((prev) => ({
      ...prev,
      receiptItems: prev.receiptItems.map((i) =>
        i.id === id ? { ...i, ...item } : i
      ),
    }));
  }, []);

  const removeReceiptItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      receiptItems: prev.receiptItems.filter((i) => i.id !== id),
    }));
  }, []);

  const assignItemToPerson = useCallback((itemId: string, friendId: string) => {
    setState((prev) => ({
      ...prev,
      receiptItems: prev.receiptItems.map((item) =>
        item.id === itemId
          ? { ...item, assignedTo: [...new Set([...item.assignedTo, friendId])] }
          : item
      ),
    }));
  }, []);

  const unassignItemFromPerson = useCallback((itemId: string, friendId: string) => {
    setState((prev) => ({
      ...prev,
      receiptItems: prev.receiptItems.map((item) =>
        item.id === itemId
          ? { ...item, assignedTo: item.assignedTo.filter((id) => id !== friendId) }
          : item
      ),
    }));
  }, []);

  const setReceiptImage = useCallback((image: string | null) => {
    setState((prev) => ({ ...prev, receiptImage: image }));
  }, []);

  const setCurrentStep = useCallback((step: SplitState["currentStep"]) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const calculateEqualSplit = useCallback(() => {
    setState((prev) => {
      // Get total amount from either selected transaction or manual transaction data
      const totalAmount = prev.isManualTransactionMode
        ? prev.manualTransactionData?.amount || 0
        : prev.selectedTransaction?.amount || 0;

      if (totalAmount === 0 || prev.selectedFriends.length === 0) return prev;

      const numParticipants = prev.selectedFriends.length;
      const equalAmount = totalAmount / numParticipants;
      const equalPercentage = 100 / numParticipants;

      return {
        ...prev,
        participants: prev.selectedFriends.map((f) => ({
          oderId: f._id,
          amount: Math.round(equalAmount * 100) / 100,
          percentage: Math.round(equalPercentage * 100) / 100,
          items: [],
        })),
      };
    });
  }, []);

  const calculateItemizedSplit = useCallback(() => {
    setState((prev) => {
      // Get total amount from either selected transaction or manual transaction data
      const transactionTotal = prev.isManualTransactionMode
        ? prev.manualTransactionData?.amount || 0
        : prev.selectedTransaction?.amount || 0;

      if (transactionTotal === 0 || prev.selectedFriends.length === 0) return prev;

      const totals: Record<string, number> = {};
      prev.selectedFriends.forEach((f) => {
        totals[f._id] = 0;
      });

      prev.receiptItems.forEach((item) => {
        if (item.assignedTo.length > 0) {
          const itemTotal = item.quantity * item.price;
          const perPerson = itemTotal / item.assignedTo.length;
          item.assignedTo.forEach((friendId) => {
            if (totals[friendId] !== undefined) {
              totals[friendId] += perPerson;
            }
          });
        }
      });

      return {
        ...prev,
        participants: prev.selectedFriends.map((f) => ({
          oderId: f._id,
          amount: Math.round(totals[f._id] * 100) / 100,
          percentage: transactionTotal > 0 
            ? Math.round((totals[f._id] / transactionTotal) * 10000) / 100 
            : 0,
          items: prev.receiptItems
            .filter((item) => item.assignedTo.includes(f._id))
            .map((item) => item.id),
        })),
      };
    });
  }, []);

  const saveSplit = useCallback(async () => {
    if (!state.selectedTransaction || state.participants.length === 0) return;

    const receiptItems = state.splitMethod === "itemized" ? state.receiptItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      assignedToUserIds: item.assignedTo as Id<"users">[],
    })) : undefined;

    await createSplitMutation({
      transactionId: state.selectedTransaction._id,
      method: state.splitMethod,
      participants: state.participants.map((p) => ({
        userId: p.oderId as Id<"users">,
        amount: p.amount,
        percentage: p.percentage,
      })),
      receiptItems,
    });

    setState(initialState);
  }, [state.selectedTransaction, state.participants, state.splitMethod, state.receiptItems, createSplitMutation]);

  const deleteSplit = useCallback(async (id: Id<"splits">) => {
    await deleteSplitMutation({ splitId: id });
    setState((prev) => ({
      ...prev,
      isDetailOpen: prev.viewingSplit?._id === id ? false : prev.isDetailOpen,
      viewingSplit: prev.viewingSplit?._id === id ? null : prev.viewingSplit,
    }));
  }, [deleteSplitMutation]);

  const viewSplitDetail = useCallback((split: SavedSplit) => {
    setState((prev) => ({
      ...prev,
      viewingSplit: split,
      isDetailOpen: true,
    }));
  }, []);

  const closeSplitDetail = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewingSplit: null,
      isDetailOpen: false,
    }));
  }, []);

  const resetSplit = useCallback(() => {
    setState(initialState);
  }, []);

  // Manual transaction actions
  const openManualTransactionFlow = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSheetOpen: true,
      isManualTransactionMode: true,
      currentStep: "transaction-info",
      manualTransactionData: null,
      selectedTransaction: null,
      selectedFriends: [],
      participants: [],
      includeSelf: false,
    }));
  }, []);

  const setManualTransactionData = useCallback((data: ManualTransactionData) => {
    setState((prev) => ({
      ...prev,
      manualTransactionData: data,
    }));
  }, []);

  const setIncludeSelf = useCallback((include: boolean) => {
    setState((prev) => {
      // When toggling self, we need to update selectedFriends and participants
      if (!currentUser) return prev;

      let newFriends: Friend[];
      if (include) {
        // Add current user to friends if not already there
        const alreadyIncluded = prev.selectedFriends.some((f) => f._id === currentUser._id);
        newFriends = alreadyIncluded ? prev.selectedFriends : [currentUser, ...prev.selectedFriends];
      } else {
        // Remove current user from friends
        newFriends = prev.selectedFriends.filter((f) => f._id !== currentUser._id);
      }

      return {
        ...prev,
        includeSelf: include,
        selectedFriends: newFriends,
        participants: newFriends.map((f) => ({
          oderId: f._id,
          amount: 0,
          percentage: 0,
          items: [],
        })),
      };
    });
  }, [currentUser]);

  const saveManualTransactionWithSplit = useCallback(async () => {
    if (!state.manualTransactionData || state.participants.length === 0) return;

    const receiptItems = state.splitMethod === "itemized" ? state.receiptItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      assignedToUserIds: item.assignedTo as Id<"users">[],
    })) : undefined;

    await createManualWithSplitMutation({
      merchant: state.manualTransactionData.merchant,
      amount: state.manualTransactionData.amount,
      date: state.manualTransactionData.date,
      category: state.manualTransactionData.category,
      description: state.manualTransactionData.description,
      method: state.splitMethod,
      participants: state.participants.map((p) => ({
        userId: p.oderId as Id<"users">,
        amount: p.amount,
        percentage: p.percentage,
      })),
      receiptItems,
    });

    setState(initialState);
  }, [
    state.manualTransactionData,
    state.participants,
    state.splitMethod,
    state.receiptItems,
    createManualWithSplitMutation,
  ]);

  const value: SplitContextType = {
    ...state,
    transactions,
    savedSplits,
    allFriends,
    currentUser,
    isLoading,
    openSplitSheet,
    closeSplitSheet,
    setSelectedFriends,
    toggleFriend,
    setSplitMethod,
    setParticipants,
    updateParticipantAmount,
    updateParticipantPercentage,
    addReceiptItem,
    updateReceiptItem,
    removeReceiptItem,
    assignItemToPerson,
    unassignItemFromPerson,
    setReceiptImage,
    setCurrentStep,
    calculateEqualSplit,
    calculateItemizedSplit,
    resetSplit,
    saveSplit,
    deleteSplit,
    viewSplitDetail,
    closeSplitDetail,
    openManualTransactionFlow,
    setManualTransactionData,
    setIncludeSelf,
    saveManualTransactionWithSplit,
  };

  return <SplitContext.Provider value={value}>{children}</SplitContext.Provider>;
}

export function useSplit() {
  const context = useContext(SplitContext);
  if (context === undefined) {
    throw new Error("useSplit must be used within a SplitProvider");
  }
  return context;
}
