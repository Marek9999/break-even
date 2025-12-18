"use client";

import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  User,
  Building2,
  Users,
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  Landmark,
  KeyRound,
  Mail,
  Phone,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";

export function SettingsSheet() {
  const {
    isSettingsOpen,
    closeSettings,
    user,
    updateUser,
    bankAccounts,
    contacts,
    openContactForm,
    removeContact,
  } = useSettings();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  // Reset form when user changes
  useEffect(() => {
    setProfileForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
  }, [user]);

  const handleSaveProfile = () => {
    updateUser(profileForm);
    setEditingProfile(false);
  };

  const handleDeleteContact = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from your contacts?`)) {
      removeContact(id);
    }
  };

  return (
    <Dialog open={isSettingsOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-900 text-white">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Settings</DialogTitle>
              <DialogDescription>
                Manage your profile, bank accounts, and contacts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)] px-6 py-4">
          <div className="space-y-6 pb-4">
            {/* Personal Details Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-stone-600" />
                <h3 className="font-semibold text-stone-900">Personal Details</h3>
              </div>

              <Card className="p-4">
                {editingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} className="flex-1">
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileForm({
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-stone-800 text-white text-xl">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-lg text-stone-900">{user.name}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-blue-600 hover:text-blue-700"
                          onClick={() => setEditingProfile(true)}
                        >
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-stone-400" />
                        <span className="text-stone-700">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-stone-400" />
                        <span className="text-stone-700">{user.phone}</span>
                      </div>
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Reset Password
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>
            </section>

            {/* Bank Accounts Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-stone-600" />
                <h3 className="font-semibold text-stone-900">Connected Bank Accounts</h3>
              </div>

              <div className="space-y-2">
                {bankAccounts.map((account) => (
                  <Card key={account.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-xl ${account.color} text-white`}
                      >
                        {account.accountType === "credit" ? (
                          <CreditCard className="h-6 w-6" />
                        ) : (
                          <Landmark className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-stone-900">{account.bankName}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {account.accountType}
                          </Badge>
                        </div>
                        <p className="text-sm text-stone-500">
                          •••• {account.accountNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-stone-900">
                          {formatCurrency(account.balance)}
                        </p>
                        <p className="text-xs text-stone-400">Balance</p>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button variant="outline" className="w-full" disabled>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect New Bank Account
                </Button>
                <p className="text-xs text-stone-400 text-center">
                  Bank connection will be available when backend is connected
                </p>
              </div>
            </section>

            {/* Contacts Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-stone-600" />
                  <h3 className="font-semibold text-stone-900">
                    Contacts ({contacts.length})
                  </h3>
                </div>
                <Button size="sm" onClick={() => openContactForm()}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {contacts.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                    <p className="text-stone-500">No contacts yet</p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => openContactForm()}
                    >
                      Add your first contact
                    </Button>
                  </Card>
                ) : (
                  contacts.map((contact) => (
                    <Card key={contact.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${contact.color} text-white`}>
                            {contact.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-900 truncate">
                            {contact.name}
                          </p>
                          <p className="text-sm text-stone-500 truncate">
                            {contact.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openContactForm(contact)}
                          >
                            <Pencil className="h-4 w-4 text-stone-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteContact(contact.id, contact.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
