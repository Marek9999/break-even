"use client";

import { Transaction, formatCurrency, formatDate, categoryConfig, getBankAccountById } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Utensils,
  ShoppingBag,
  Zap,
  Film,
  Plane,
  ShoppingCart,
} from "lucide-react";

const categoryIcons: Record<Transaction["category"], React.ReactNode> = {
  food: <Utensils className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
  entertainment: <Film className="h-4 w-4" />,
  travel: <Plane className="h-4 w-4" />,
  groceries: <ShoppingCart className="h-4 w-4" />,
};

interface TransactionCardProps {
  transaction: Transaction;
  onClick: () => void;
}

export function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const config = categoryConfig[transaction.category];
  const bankAccount = getBankAccountById(transaction.bankAccountId);

  return (
    <Card
      className="p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border-stone-200"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Category Icon */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full ${config.bgColor} ${config.color}`}
        >
          {categoryIcons[transaction.category]}
        </div>

        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-stone-900 truncate">
            {transaction.merchant}
          </h3>
          <p className="text-sm text-stone-500 truncate">
            {transaction.description}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge
              variant="secondary"
              className={`text-xs ${config.bgColor} ${config.color} border-0`}
            >
              {config.label}
            </Badge>
            {bankAccount && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${bankAccount.color}`} />
                <span className="text-xs text-stone-400">
                  {bankAccount.bankName}
                </span>
              </div>
            )}
            <span className="text-xs text-stone-400">
              {formatDate(transaction.date)}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className="font-bold text-lg text-stone-900">
            {formatCurrency(transaction.amount)}
          </p>
          <p className="text-xs text-stone-400">Tap to split</p>
        </div>
      </div>
    </Card>
  );
}
