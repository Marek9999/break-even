"use client";

import { TransactionList } from "@/components/TransactionList";
import { SplitSheet } from "@/components/SplitSheet";
import { SplitHistory } from "@/components/SplitHistory";
import { SplitDetailDialog } from "@/components/SplitDetailDialog";
import { SettingsSheet } from "@/components/SettingsSheet";
import { ContactFormDialog } from "@/components/ContactFormDialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Wallet, CreditCard, History } from "lucide-react";
import { useSplit } from "@/lib/split-context";
import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/data";

export default function Home() {
  const { savedSplits } = useSplit();
  const { openSettings, bankAccounts, user } = useSettings();
  const pendingCount = savedSplits.filter((s) => s.status === "pending").length;
  
  // Calculate total balance from all bank accounts
  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <main className="min-h-screen bg-stone-100 overflow-y-auto">
      {/* Header - Scrolls with content */}
      <header>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
              </div>
            </div>
            <Avatar 
              className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-stone-400 transition-all"
              onClick={openSettings}
            >
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="bg-stone-800 text-white font-medium">
                {user.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "?"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-6 mb-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="text-stone-400 text-sm">Your Accounts</span>
            </div>
            <div className="flex items-center gap-1">
              {bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`w-3 h-3 rounded-full ${acc.color}`}
                  title={`${acc.bankName}: ${formatCurrency(acc.balance)}`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-stone-400 mb-1">Total Balance</p>
          <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalBalance)}</p>
          <Separator className="my-4 bg-stone-700" />
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-stone-400">Pending Splits</p>
              <p className="font-semibold">{pendingCount} active</p>
            </div>
            <div className="text-right">
              <p className="text-stone-400">Connected Banks</p>
              <p className="font-semibold">{bankAccounts.length} accounts</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="splits" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              My Splits
              {pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-amber-500 text-white"
                >
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-0">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-stone-900 mb-1">
                Recent Transactions
              </h2>
              <p className="text-sm text-stone-500">
                Tap any transaction to split it with friends
              </p>
            </div>
            <TransactionList />
          </TabsContent>

          <TabsContent value="splits" className="mt-0">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-stone-900 mb-1">
                My Splits
              </h2>
              <p className="text-sm text-stone-500">
                View and manage your saved splits
              </p>
            </div>
            <SplitHistory />
          </TabsContent>
        </Tabs>
      </div>

      {/* Split Sheet */}
      <SplitSheet />

      {/* Split Detail Dialog */}
      <SplitDetailDialog />

      {/* Settings Sheet */}
      <SettingsSheet />

      {/* Contact Form Dialog (for adding contacts from split sheet) */}
      <ContactFormDialog />
    </main>
  );
}
