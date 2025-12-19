"use client";

import { TransactionCard } from "./TransactionCard";
import { useSplit, Transaction } from "@/lib/split-context";
import { useSettings } from "@/lib/settings-context";
import { Search, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { BankFilterDropdown } from "./BankFilterDropdown";

export function TransactionList() {
  const { openSplitSheet, openManualTransactionFlow, transactions: allTransactions, isLoading } = useSplit();
  const { selectedBankFilter } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = useMemo(() => {
    let transactions = allTransactions;

    // Filter by bank account
    if (selectedBankFilter !== "all") {
      transactions = transactions.filter(
        (tx) => tx.bankAccountId === selectedBankFilter
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      transactions = transactions.filter(
        (tx) =>
          tx.merchant.toLowerCase().includes(query) ||
          tx.description.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query)
      );
    }

    return transactions;
  }, [searchQuery, selectedBankFilter, allTransactions]);

  const handleTransactionClick = (transaction: Transaction) => {
    openSplitSheet(transaction);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <BankFilterDropdown />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-stone-200"
          />
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={openManualTransactionFlow}
          title="Add cash transaction"
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Transaction List */}
      <div className="space-y-3 pb-6">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction._id}
              transaction={transaction}
              onClick={() => handleTransactionClick(transaction)}
            />
          ))
        )}
      </div>
    </div>
  );
}
