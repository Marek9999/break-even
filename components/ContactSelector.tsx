"use client";

import { Contact } from "@/lib/data";
import { useSplit } from "@/lib/split-context";
import { useSettings } from "@/lib/settings-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, ArrowRight, Plus } from "lucide-react";
import { useState, useMemo } from "react";

export function ContactSelector() {
  const { selectedContacts, toggleContact, setCurrentStep } = useSplit();
  const { contacts, openContactForm } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const isSelected = (contact: Contact) =>
    selectedContacts.some((c) => c.id === contact.id);

  const handleContinue = () => {
    if (selectedContacts.length > 0) {
      setCurrentStep("method");
    }
  };

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-stone-600" />
            <h3 className="font-semibold text-stone-900">Select People to Split With</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => openContactForm()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <p className="text-sm text-stone-500">
          Choose who you want to split this transaction with
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected count */}
      {selectedContacts.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-stone-600">
            {selectedContacts.length} selected
          </span>
          <div className="flex -space-x-2">
            {selectedContacts.slice(0, 5).map((contact) => (
              <Avatar key={contact.id} className="h-6 w-6 border-2 border-white">
                <AvatarFallback className={`${contact.color} text-white text-xs`}>
                  {contact.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {selectedContacts.length > 5 && (
              <div className="h-6 w-6 rounded-full bg-stone-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-stone-600">
                  +{selectedContacts.length - 5}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact List */}
      <div className="space-y-1">
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No contacts yet</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => openContactForm()}
            >
              Add your first contact
            </Button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <p>No contacts match your search</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected(contact)
                  ? "bg-stone-100"
                  : "hover:bg-stone-50"
              }`}
              onClick={() => toggleContact(contact)}
            >
              <Checkbox
                checked={isSelected(contact)}
                onCheckedChange={() => toggleContact(contact)}
              />
              <Avatar className="h-10 w-10">
                <AvatarFallback className={`${contact.color} text-white`}>
                  {contact.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900 truncate">
                  {contact.name}
                </p>
                <p className="text-sm text-stone-500 truncate">{contact.email}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Continue Button */}
      <div className="pt-4 border-t mt-4">
        <Button
          className="w-full"
          onClick={handleContinue}
          disabled={selectedContacts.length === 0}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
