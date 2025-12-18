"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  Transaction,
  Contact,
  ReceiptItem,
  Participant,
  SplitMethod,
  SavedSplit,
  dummyContacts,
  getContactById,
} from "./data";

interface SplitState {
  // Current transaction being split
  selectedTransaction: Transaction | null;
  // Selected contacts to split with
  selectedContacts: Contact[];
  // Split method
  splitMethod: SplitMethod;
  // Participants with their amounts
  participants: Participant[];
  // Receipt items for itemized splits
  receiptItems: ReceiptItem[];
  // Receipt image (base64)
  receiptImage: string | null;
  // Sheet open state
  isSheetOpen: boolean;
  // Current step in the flow
  currentStep: "contacts" | "method" | "configure" | "summary";
  // Saved splits history
  savedSplits: SavedSplit[];
  // Currently viewing split detail
  viewingSplit: SavedSplit | null;
  // Detail dialog open
  isDetailOpen: boolean;
}

interface SplitContextType extends SplitState {
  // Actions
  openSplitSheet: (transaction: Transaction) => void;
  closeSplitSheet: () => void;
  setSelectedContacts: (contacts: Contact[]) => void;
  toggleContact: (contact: Contact) => void;
  setSplitMethod: (method: SplitMethod) => void;
  setParticipants: (participants: Participant[]) => void;
  updateParticipantAmount: (contactId: string, amount: number) => void;
  updateParticipantPercentage: (contactId: string, percentage: number) => void;
  addReceiptItem: (item: Omit<ReceiptItem, "id">) => void;
  updateReceiptItem: (id: string, item: Partial<ReceiptItem>) => void;
  removeReceiptItem: (id: string) => void;
  assignItemToPerson: (itemId: string, contactId: string) => void;
  unassignItemFromPerson: (itemId: string, contactId: string) => void;
  setReceiptImage: (image: string | null) => void;
  setCurrentStep: (step: SplitState["currentStep"]) => void;
  calculateEqualSplit: () => void;
  calculateItemizedSplit: () => void;
  resetSplit: () => void;
  // Saved splits actions
  saveSplit: () => void;
  deleteSplit: (id: string) => void;
  toggleSplitStatus: (id: string) => void;
  viewSplitDetail: (split: SavedSplit) => void;
  closeSplitDetail: () => void;
  // Data
  allContacts: Contact[];
}

const initialState: SplitState = {
  selectedTransaction: null,
  selectedContacts: [],
  splitMethod: "equal",
  participants: [],
  receiptItems: [],
  receiptImage: null,
  isSheetOpen: false,
  currentStep: "contacts",
  savedSplits: [],
  viewingSplit: null,
  isDetailOpen: false,
};

const STORAGE_KEY = "break-even-splits";

const SplitContext = createContext<SplitContextType | undefined>(undefined);

export function SplitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SplitState>(initialState);

  // Load saved splits from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const splits = JSON.parse(saved) as SavedSplit[];
          setState((prev) => ({ ...prev, savedSplits: splits }));
        } catch (e) {
          console.error("Failed to load saved splits:", e);
        }
      }
    }
  }, []);

  // Save to localStorage whenever savedSplits changes
  useEffect(() => {
    if (typeof window !== "undefined" && state.savedSplits.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedSplits));
    }
  }, [state.savedSplits]);

  const openSplitSheet = useCallback((transaction: Transaction) => {
    setState((prev) => ({
      ...prev,
      selectedTransaction: transaction,
      isSheetOpen: true,
      currentStep: "contacts",
    }));
  }, []);

  const closeSplitSheet = useCallback(() => {
    setState((prev) => ({
      ...initialState,
      savedSplits: prev.savedSplits,
    }));
  }, []);

  const setSelectedContacts = useCallback((contacts: Contact[]) => {
    setState((prev) => ({
      ...prev,
      selectedContacts: contacts,
      participants: contacts.map((c) => ({
        contactId: c.id,
        amount: 0,
        percentage: 0,
        items: [],
      })),
    }));
  }, []);

  const toggleContact = useCallback((contact: Contact) => {
    setState((prev) => {
      const isSelected = prev.selectedContacts.some((c) => c.id === contact.id);
      const newContacts = isSelected
        ? prev.selectedContacts.filter((c) => c.id !== contact.id)
        : [...prev.selectedContacts, contact];

      return {
        ...prev,
        selectedContacts: newContacts,
        participants: newContacts.map((c) => ({
          contactId: c.id,
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

  const updateParticipantAmount = useCallback((contactId: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.contactId === contactId ? { ...p, amount } : p
      ),
    }));
  }, []);

  const updateParticipantPercentage = useCallback((contactId: string, percentage: number) => {
    setState((prev) => {
      const total = prev.selectedTransaction?.amount || 0;
      return {
        ...prev,
        participants: prev.participants.map((p) =>
          p.contactId === contactId
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

  const assignItemToPerson = useCallback((itemId: string, contactId: string) => {
    setState((prev) => ({
      ...prev,
      receiptItems: prev.receiptItems.map((item) =>
        item.id === itemId
          ? { ...item, assignedTo: [...new Set([...item.assignedTo, contactId])] }
          : item
      ),
    }));
  }, []);

  const unassignItemFromPerson = useCallback((itemId: string, contactId: string) => {
    setState((prev) => ({
      ...prev,
      receiptItems: prev.receiptItems.map((item) =>
        item.id === itemId
          ? { ...item, assignedTo: item.assignedTo.filter((id) => id !== contactId) }
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
      if (!prev.selectedTransaction || prev.selectedContacts.length === 0) return prev;

      const totalAmount = prev.selectedTransaction.amount;
      const numParticipants = prev.selectedContacts.length;
      const equalAmount = totalAmount / numParticipants;
      const equalPercentage = 100 / numParticipants;

      return {
        ...prev,
        participants: prev.selectedContacts.map((c) => ({
          contactId: c.id,
          amount: Math.round(equalAmount * 100) / 100,
          percentage: Math.round(equalPercentage * 100) / 100,
          items: [],
        })),
      };
    });
  }, []);

  const calculateItemizedSplit = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedTransaction || prev.selectedContacts.length === 0) return prev;

      const totals: Record<string, number> = {};
      prev.selectedContacts.forEach((c) => {
        totals[c.id] = 0;
      });

      prev.receiptItems.forEach((item) => {
        if (item.assignedTo.length > 0) {
          const itemTotal = item.quantity * item.price;
          const perPerson = itemTotal / item.assignedTo.length;
          item.assignedTo.forEach((contactId) => {
            if (totals[contactId] !== undefined) {
              totals[contactId] += perPerson;
            }
          });
        }
      });

      const transactionTotal = prev.selectedTransaction.amount;

      return {
        ...prev,
        participants: prev.selectedContacts.map((c) => ({
          contactId: c.id,
          amount: Math.round(totals[c.id] * 100) / 100,
          percentage: transactionTotal > 0 
            ? Math.round((totals[c.id] / transactionTotal) * 10000) / 100 
            : 0,
          items: prev.receiptItems
            .filter((item) => item.assignedTo.includes(c.id))
            .map((item) => item.id),
        })),
      };
    });
  }, []);

  const saveSplit = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedTransaction || prev.participants.length === 0) return prev;

      const newSplit: SavedSplit = {
        id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        transaction: prev.selectedTransaction,
        method: prev.splitMethod,
        participants: prev.participants.map((p) => ({
          contact: getContactById(p.contactId) || prev.selectedContacts.find(c => c.id === p.contactId)!,
          amount: p.amount,
          percentage: p.percentage || 0,
        })),
        items: prev.receiptItems,
        receiptImage: prev.receiptImage || undefined,
        createdAt: new Date().toISOString(),
        status: "pending",
      };

      const newSavedSplits = [newSplit, ...prev.savedSplits];
      
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedSplits));
      }

      return {
        ...initialState,
        savedSplits: newSavedSplits,
      };
    });
  }, []);

  const deleteSplit = useCallback((id: string) => {
    setState((prev) => {
      const newSavedSplits = prev.savedSplits.filter((s) => s.id !== id);
      
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedSplits));
      }

      return {
        ...prev,
        savedSplits: newSavedSplits,
        isDetailOpen: prev.viewingSplit?.id === id ? false : prev.isDetailOpen,
        viewingSplit: prev.viewingSplit?.id === id ? null : prev.viewingSplit,
      };
    });
  }, []);

  const toggleSplitStatus = useCallback((id: string) => {
    setState((prev) => {
      const newSavedSplits = prev.savedSplits.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "pending" ? "settled" : "pending" as const }
          : s
      );
      
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedSplits));
      }

      return {
        ...prev,
        savedSplits: newSavedSplits,
        viewingSplit: prev.viewingSplit?.id === id 
          ? { ...prev.viewingSplit, status: prev.viewingSplit.status === "pending" ? "settled" : "pending" as const }
          : prev.viewingSplit,
      };
    });
  }, []);

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
    setState((prev) => ({
      ...initialState,
      savedSplits: prev.savedSplits,
    }));
  }, []);

  const value: SplitContextType = {
    ...state,
    openSplitSheet,
    closeSplitSheet,
    setSelectedContacts,
    toggleContact,
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
    toggleSplitStatus,
    viewSplitDetail,
    closeSplitDetail,
    allContacts: dummyContacts,
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
