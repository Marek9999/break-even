"use client";

import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  User,
  Building2,
  Users,
  Plus,
  CreditCard,
  Landmark,
  Mail,
  Phone,
  Settings,
  LogOut,
  Trash2,
  Loader2,
  Check,
  X,
  Clock,
  Send,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { PlaidLink } from "@/components/PlaidLink";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function SettingsSheet() {
  const {
    isSettingsOpen,
    closeSettings,
    user,
    bankAccounts,
    friends,
    receivedInvitations,
    sentInvitations,
    removeBankAccount,
    sendFriendRequestByEmail,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelSentRequest,
    reinviteFriend,
    removeFriend,
  } = useSettings();

  const { signOut } = useClerk();
  const seedFriends = useMutation(api.seed.seedFriends);
  const seedInvitations = useMutation(api.seed.seedInvitations);
  const [isSeeding, setIsSeeding] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [processingInvitationId, setProcessingInvitationId] = useState<string | null>(null);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

  // Filter out Cash accounts (virtual accounts for manual transactions)
  // These should only appear in the transaction filter dropdown, not in Settings
  const connectedBankAccounts = bankAccounts.filter(
    (account) => !(account.bankName === "Cash" && !account.plaidItemId)
  );

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsSendingInvite(true);
    try {
      await sendFriendRequestByEmail(inviteEmail.trim());
      setInviteEmail("");
    } catch (error) {
      console.error("Failed to send invite:", error);
      alert(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleAcceptInvitation = async (friendshipId: string) => {
    setProcessingInvitationId(friendshipId);
    try {
      await acceptFriendRequest(friendshipId as never);
    } catch (error) {
      console.error("Failed to accept invitation:", error);
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleRejectInvitation = async (friendshipId: string) => {
    setProcessingInvitationId(friendshipId);
    try {
      await rejectFriendRequest(friendshipId as never);
    } catch (error) {
      console.error("Failed to reject invitation:", error);
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleCancelSentInvitation = async (friendshipId: string) => {
    setProcessingInvitationId(friendshipId);
    try {
      await cancelSentRequest(friendshipId as never);
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
      return;
    }
    setRemovingFriendId(friendshipId);
    try {
      await removeFriend(friendshipId as never);
    } catch (error) {
      console.error("Failed to remove friend:", error);
    } finally {
      setRemovingFriendId(null);
    }
  };

  const handleReinvite = async (friendshipId: string) => {
    setProcessingInvitationId(friendshipId);
    try {
      await reinviteFriend(friendshipId as never);
    } catch (error) {
      console.error("Failed to reinvite:", error);
      alert(error instanceof Error ? error.message : "Failed to reinvite");
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleRemoveBankAccount = async (account: typeof bankAccounts[0]) => {
    const isCashAccount = account.bankName === "Cash" && !account.plaidItemId;
    const accountLabel = isCashAccount 
      ? account.bankName 
      : `${account.bankName} (••••${account.accountNumberLast4})`;
    if (!confirm(`Are you sure you want to disconnect ${accountLabel}? This will also remove all associated transactions.`)) {
      return;
    }

    setDeletingAccountId(account._id);
    try {
      // First, try to remove from Plaid if we have an access token
      if (account.plaidAccessToken) {
        const response = await fetch("/api/plaid/remove-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: account.plaidAccessToken }),
        });
        const data = await response.json();
        if (!data.success) {
          console.warn("Plaid removal failed, continuing with local removal:", data.error);
        }
      }

      // Then remove from our database
      await removeBankAccount(account._id);
    } catch (error) {
      console.error("Failed to remove bank account:", error);
      alert("Failed to remove bank account. Please try again.");
    } finally {
      setDeletingAccountId(null);
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
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-stone-400" />
                    <span className="text-stone-700">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-stone-400" />
                      <span className="text-stone-700">{user.phone}</span>
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* Bank Accounts Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-stone-600" />
                <h3 className="font-semibold text-stone-900">Connected Bank Accounts</h3>
              </div>

              <div className="space-y-2">
                {connectedBankAccounts.map((account) => (
                  <Card key={account._id} className="p-4">
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
                          •••• {account.accountNumberLast4}
                        </p>
                      </div>
                      <div className="text-right mr-2">
                        <p className="font-semibold text-stone-900">
                          {formatCurrency(account.balance)}
                        </p>
                        <p className="text-xs text-stone-400">Balance</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-stone-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleRemoveBankAccount(account)}
                        disabled={deletingAccountId === account._id}
                      >
                        {deletingAccountId === account._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}

                <PlaidLink variant="outline" className="w-full" />
              </div>
            </section>

            {/* Friends Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-stone-600" />
                <h3 className="font-semibold text-stone-900">
                  Friends ({friends.length})
                </h3>
              </div>

              {/* Invite Friend Input */}
              <Card className="p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-4 w-4 text-stone-600" />
                  <span className="text-sm font-medium text-stone-700">Invite a Friend</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendInvite}
                    disabled={!inviteEmail.trim() || isSendingInvite}
                  >
                    {isSendingInvite ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {/* Demo data buttons for testing */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-stone-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs text-stone-500"
                    disabled={isSeeding}
                    onClick={async () => {
                      setIsSeeding(true);
                      try {
                        const result = await seedFriends();
                        console.log("Seeded friends:", result);
                      } catch (error) {
                        console.error("Failed to seed friends:", error);
                      } finally {
                        setIsSeeding(false);
                      }
                    }}
                  >
                    {isSeeding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                    Demo Friends
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs text-stone-500"
                    disabled={isSeeding}
                    onClick={async () => {
                      setIsSeeding(true);
                      try {
                        const result = await seedInvitations();
                        console.log("Seeded invitations:", result);
                        alert(`Added ${result.receivedInvitations} received + ${result.sentInvitations} sent invitations`);
                      } catch (error) {
                        console.error("Failed to seed invitations:", error);
                      } finally {
                        setIsSeeding(false);
                      }
                    }}
                  >
                    {isSeeding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                    Demo Invitations
                  </Button>
                </div>
              </Card>

              <div className="space-y-2">
                {/* Received Invitations */}
                {receivedInvitations.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                      Invitations Received
                    </p>
                    {receivedInvitations.map((inv) => (
                      <Card key={inv.friendshipId} className="p-3 border-blue-200 bg-blue-50/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`${inv.user.color} text-white`}>
                              {inv.user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-900 truncate">
                              {inv.user.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                              <Clock className="h-3 w-3" />
                              <span>
                                {inv.daysRemaining === 0 
                                  ? "Expires today" 
                                  : inv.daysRemaining === 1 
                                    ? "1 day left" 
                                    : `${inv.daysRemaining} days left`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="default"
                              size="icon"
                              className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600"
                              onClick={() => handleAcceptInvitation(inv.friendshipId)}
                              disabled={processingInvitationId === inv.friendshipId}
                            >
                              {processingInvitationId === inv.friendshipId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:bg-red-50"
                              onClick={() => handleRejectInvitation(inv.friendshipId)}
                              disabled={processingInvitationId === inv.friendshipId}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Sent Invitations */}
                {sentInvitations.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                      Invitations Sent
                    </p>
                    {sentInvitations.map((inv) => (
                      <Card key={inv.friendshipId} className="p-3 border-stone-200 bg-stone-50/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`${inv.user.color} text-white`}>
                              {inv.user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-900 truncate">
                              {inv.user.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Pending</Badge>
                              <span className="text-xs text-stone-400">
                                {inv.daysRemaining === 0 
                                  ? "Expires today" 
                                  : inv.daysRemaining === 1 
                                    ? "1 day left" 
                                    : `${inv.daysRemaining} days left`}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-400 hover:text-red-500"
                            onClick={() => handleCancelSentInvitation(inv.friendshipId)}
                            disabled={processingInvitationId === inv.friendshipId}
                          >
                            {processingInvitationId === inv.friendshipId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Friends List */}
                {friends.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                      Your Contacts
                    </p>
                    {friends.map((friend) => (
                      <Card 
                        key={friend._id} 
                        className={`p-3 ${
                          friend.status === "expired" 
                            ? "border-red-200 bg-red-50/30" 
                            : friend.status === "pending" 
                              ? "border-amber-200 bg-amber-50/30" 
                              : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`${friend.color} text-white`}>
                              {friend.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-stone-900 truncate">
                                {friend.name}
                              </p>
                              {friend.status === "pending" && (
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                                  Pending
                                </Badge>
                              )}
                              {friend.status === "expired" && (
                                <Badge variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">
                                  Expired
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-stone-500 truncate">
                                {friend.email}
                              </p>
                              {friend.status === "pending" && friend.daysRemaining !== undefined && (
                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {friend.daysRemaining === 0 
                                    ? "Today" 
                                    : friend.daysRemaining === 1 
                                      ? "1d" 
                                      : `${friend.daysRemaining}d`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {friend.status === "expired" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => handleReinvite(friend.friendshipId)}
                                disabled={processingInvitationId === friend.friendshipId}
                                title="Reinvite"
                              >
                                {processingInvitationId === friend.friendshipId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-stone-400 hover:text-red-500 hover:bg-red-50"
                              onClick={() => handleRemoveFriend(friend.friendshipId, friend.name)}
                              disabled={removingFriendId === friend.friendshipId}
                            >
                              {removingFriendId === friend.friendshipId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Empty State with Seed Buttons */}
                {friends.length === 0 && receivedInvitations.length === 0 && sentInvitations.length === 0 && (
                  <Card className="p-8 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                    <p className="text-stone-500">No friends yet</p>
                    <p className="text-xs text-stone-400 mt-2">
                      Invite friends by email or add demo data to test
                    </p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSeeding}
                        onClick={async () => {
                          setIsSeeding(true);
                          try {
                            await seedFriends();
                          } catch (error) {
                            console.error("Failed to seed friends:", error);
                          } finally {
                            setIsSeeding(false);
                          }
                        }}
                      >
                        {isSeeding ? "Adding..." : "Add Demo Friends"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSeeding}
                        onClick={async () => {
                          setIsSeeding(true);
                          try {
                            await seedInvitations();
                          } catch (error) {
                            console.error("Failed to seed invitations:", error);
                          } finally {
                            setIsSeeding(false);
                          }
                        }}
                      >
                        Add Demo Invitations
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </section>

            {/* Logout Section */}
            <Separator className="my-4" />
            <section>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
