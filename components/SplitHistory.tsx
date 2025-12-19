"use client";

import { useSplit } from "@/lib/split-context";
import { formatCurrency, formatDate, categoryConfig } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Receipt, Users, CheckCircle2, Clock, Loader2 } from "lucide-react";

export function SplitHistory() {
  const { savedSplits, viewSplitDetail, isLoading } = useSplit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (savedSplits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-stone-400">
        <History className="h-12 w-12 mb-4 opacity-50" />
        <h3 className="font-medium text-lg text-stone-600 mb-2">No splits yet</h3>
        <p className="text-sm text-center max-w-xs">
          Split a transaction from the Transactions tab and it will appear here
        </p>
      </div>
    );
  }

  const pendingSplits = savedSplits.filter((s) => s.status === "pending");
  const settledSplits = savedSplits.filter((s) => s.status === "settled");

  const methodLabels = {
    equal: "Equal",
    percentage: "Percentage",
    custom: "Custom",
    itemized: "Itemized",
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Pending Splits */}
      {pendingSplits.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-500" />
            <h3 className="font-medium text-stone-900">
              Pending ({pendingSplits.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pendingSplits.map((split) => {
              if (!split.transaction) return null;
              const config = categoryConfig[split.transaction.category as keyof typeof categoryConfig];
              return (
                <Card
                  key={split._id}
                  className="p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border-amber-200 bg-amber-50/30"
                  onClick={() => viewSplitDetail(split)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-stone-900">
                        {split.transaction.merchant}
                      </h4>
                      <p className="text-sm text-stone-500">
                        {formatDate(split.transaction.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-stone-900">
                        {formatCurrency(split.transaction.amount)}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {methodLabels[split.method]}
                      </Badge>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-stone-400" />
                      <span className="text-sm text-stone-500">
                        {split.participants.length} people
                      </span>
                    </div>
                    {split.method === "itemized" && split.receiptItems.length > 0 && (
                      <div className="flex items-center gap-1 text-stone-400">
                        <Receipt className="h-4 w-4" />
                        <span className="text-xs">{split.receiptItems.length} items</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Settled Splits */}
      {settledSplits.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h3 className="font-medium text-stone-900">
              Settled ({settledSplits.length})
            </h3>
          </div>
          <div className="space-y-3">
            {settledSplits.map((split) => {
              if (!split.transaction) return null;
              const config = categoryConfig[split.transaction.category as keyof typeof categoryConfig];
              return (
                <Card
                  key={split._id}
                  className="p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border-stone-200 opacity-75"
                  onClick={() => viewSplitDetail(split)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-stone-900 flex items-center gap-2">
                        {split.transaction.merchant}
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </h4>
                      <p className="text-sm text-stone-500">
                        {formatDate(split.transaction.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-stone-900">
                        {formatCurrency(split.transaction.amount)}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {methodLabels[split.method]}
                      </Badge>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-stone-400" />
                    <span className="text-sm text-stone-500">
                      {split.participants.length} people
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
