"use client";

import { useSettings } from "@/lib/settings-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

export function ContactFormDialog() {
  const {
    isContactFormOpen,
    closeContactForm,
    editingContact,
    addContact,
    updateContact,
  } = useSettings();

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const isEditing = !!editingContact;

  useEffect(() => {
    if (editingContact) {
      setForm({
        name: editingContact.name,
        email: editingContact.email,
      });
    } else {
      setForm({ name: "", email: "" });
    }
  }, [editingContact, isContactFormOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) return;

    if (isEditing && editingContact) {
      updateContact(editingContact.id, form);
    } else {
      addContact(form);
    }
  };

  const isValid = form.name.trim() && form.email.trim();

  return (
    <Dialog open={isContactFormOpen} onOpenChange={(open) => !open && closeContactForm()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contact" : "Add Contact"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the contact details below"
              : "Enter the details for your new contact"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contact-name">Full Name</Label>
            <Input
              id="contact-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., John Doe"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="contact-email">Email Address</Label>
            <Input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="e.g., john@email.com"
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={!isValid}>
              {isEditing ? "Save Changes" : "Add Contact"}
            </Button>
            <Button type="button" variant="outline" onClick={closeContactForm}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

