"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import {
  User,
  BankAccount,
  Contact,
  dummyBankAccounts,
  dummyContacts,
  generateInitials,
  generateAvatarColor,
} from "./data";

interface SettingsState {
  // User profile
  user: User;
  // Bank accounts
  bankAccounts: BankAccount[];
  // Contacts list
  contacts: Contact[];
  // Settings sheet open state
  isSettingsOpen: boolean;
  // Currently editing contact
  editingContact: Contact | null;
  // Contact form dialog open
  isContactFormOpen: boolean;
  // Selected bank account filter ("all" or bank ID)
  selectedBankFilter: string;
}

interface SettingsContextType extends SettingsState {
  // Settings sheet
  openSettings: () => void;
  closeSettings: () => void;
  // User actions
  updateUser: (user: Partial<User>) => void;
  // Contact actions
  addContact: (contact: Omit<Contact, "id" | "initials" | "color">) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  removeContact: (id: string) => void;
  openContactForm: (contact?: Contact) => void;
  closeContactForm: () => void;
  // Bank filter
  setBankFilter: (filter: string) => void;
}

const STORAGE_KEY_CONTACTS = "break-even-contacts";

const defaultUser: User = {
  id: "",
  name: "",
  email: "",
  phone: "",
};

const initialState: SettingsState = {
  user: defaultUser,
  bankAccounts: dummyBankAccounts,
  contacts: dummyContacts,
  isSettingsOpen: false,
  editingContact: null,
  isContactFormOpen: false,
  selectedBankFilter: "all",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [state, setState] = useState<SettingsState>(initialState);

  // Sync Clerk user data to state
  useEffect(() => {
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

  // Load contacts from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedContacts = localStorage.getItem(STORAGE_KEY_CONTACTS);
      
      if (savedContacts) {
        setState((prev) => ({
          ...prev,
          contacts: JSON.parse(savedContacts),
        }));
      }
    }
  }, []);

  // Save contacts to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(state.contacts));
    }
  }, [state.contacts]);

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

  const addContact = useCallback((contact: Omit<Contact, "id" | "initials" | "color">) => {
    const newContact: Contact = {
      ...contact,
      id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      initials: generateInitials(contact.name),
      color: generateAvatarColor(),
    };
    setState((prev) => ({
      ...prev,
      contacts: [...prev.contacts, newContact],
      isContactFormOpen: false,
      editingContact: null,
    }));
  }, []);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updates,
              initials: updates.name ? generateInitials(updates.name) : c.initials,
            }
          : c
      ),
      isContactFormOpen: false,
      editingContact: null,
    }));
  }, []);

  const removeContact = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }));
  }, []);

  const openContactForm = useCallback((contact?: Contact) => {
    setState((prev) => ({
      ...prev,
      editingContact: contact || null,
      isContactFormOpen: true,
    }));
  }, []);

  const closeContactForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editingContact: null,
      isContactFormOpen: false,
    }));
  }, []);

  const setBankFilter = useCallback((filter: string) => {
    setState((prev) => ({ ...prev, selectedBankFilter: filter }));
  }, []);

  const value: SettingsContextType = {
    ...state,
    openSettings,
    closeSettings,
    updateUser,
    addContact,
    updateContact,
    removeContact,
    openContactForm,
    closeContactForm,
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

