"use client";

import { useSettings } from "@/lib/settings-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Landmark } from "lucide-react";

export function BankFilterDropdown() {
  const { bankAccounts, selectedBankFilter, setBankFilter } = useSettings();

  return (
    <Select value={selectedBankFilter} onValueChange={setBankFilter}>
      <SelectTrigger className="w-full sm:w-[200px] bg-white">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <div className="truncate">
            <SelectValue placeholder="Select account" />
          </div>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-stone-400" />
            All Accounts
          </div>
        </SelectItem>
        {bankAccounts.map((account) => (
          <SelectItem key={account._id} value={account._id}>
            <div className="flex items-center gap-2 min-w-0 max-w-full">
              <div className={`w-2 h-2 rounded-full shrink-0 ${account.color}`} />
              <span className="truncate min-w-0 flex-1">{account.bankName}</span>
              <span className="shrink-0 text-stone-500 whitespace-nowrap">(•••• {account.accountNumberLast4})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

