"use client";

import { useSplit, SavedSplit } from "@/lib/split-context";
import { formatCurrency, formatDate, categoryConfig } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Receipt, Users, CheckCircle2, Clock, Loader2, Plus } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

// Helper to get status badge styling
function getStatusBadge(overallStatus: SavedSplit["overallStatus"]) {
  switch (overallStatus) {
    case "all_settled":
      return {
        className: "bg-emerald-500 text-white border-0",
        label: "All Settled",
      };
    case "settled_by_me":
      return {
        className: "border-blue-300 text-blue-700 bg-blue-50",
        label: "Settled by me",
      };
    default:
      return {
        className: "border-amber-300 text-amber-700 bg-amber-50",
        label: "Pending",
      };
  }
}

export function SplitHistory() {
  const { savedSplits, viewSplitDetail, isLoading } = useSplit();
  const createSampleSettledSplit = useMutation(api.splits.createSampleSettledSplit);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSampleSplit = async () => {
    setIsCreating(true);
    try {
      await createSampleSettledSplit({});
    } finally {
      setIsCreating(false);
    }
  };

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
        {/* Dev button to create sample settled split */}
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={handleCreateSampleSplit}
          disabled={isCreating}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? "Creating..." : "Add Sample Settled Split"}
        </Button>
      </div>
    );
  }

  // Group by overall status
  const pendingSplits = savedSplits.filter((s) => s.overallStatus === "pending");
  const settledByMeSplits = savedSplits.filter((s) => s.overallStatus === "settled_by_me");
  const allSettledSplits = savedSplits.filter((s) => s.overallStatus === "all_settled");

  const methodLabels = {
    equal: "Equal",
    percentage: "Percentage",
    custom: "Custom",
    itemized: "Itemized",
  };

  // Render a split card
  const renderSplitCard = (split: SavedSplit) => {
    if (!split.transaction) return null;
    const statusBadge = getStatusBadge(split.overallStatus);

    return (
      <Card
        key={split._id}
        className={`p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
          split.overallStatus === "all_settled"
            ? "border-emerald-200 bg-emerald-50/30"
            : split.overallStatus === "settled_by_me"
            ? "border-blue-200 bg-blue-50/30"
            : "border-amber-200 bg-amber-50/30"
        }`}
        onClick={() => viewSplitDetail(split)}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-stone-900 flex items-center gap-2">
              {split.transaction.merchant}
              {split.overallStatus === "all_settled" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
              {split.overallStatus === "settled_by_me" && (
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              )}
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

        {/* Participants & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-stone-400" />
            <span className="text-sm text-stone-500">
              {split.settledCount}/{split.totalParticipants} settled
            </span>
          </div>
          <Badge variant="outline" className={`text-xs ${statusBadge.className}`}>
            {statusBadge.label}
          </Badge>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Dev button to create sample settled split */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateSampleSplit}
          disabled={isCreating}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? "Creating..." : "Add Sample Settled Split"}
        </Button>
      </div>

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
            {pendingSplits.map(renderSplitCard)}
          </div>
        </div>
      )}

      {/* Settled by Me Splits */}
      {settledByMeSplits.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <h3 className="font-medium text-stone-900">
              Settled by Me ({settledByMeSplits.length})
            </h3>
          </div>
          <div className="space-y-3">
            {settledByMeSplits.map(renderSplitCard)}
          </div>
        </div>
      )}

      {/* All Settled Splits */}
      {allSettledSplits.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h3 className="font-medium text-stone-900">
              All Settled ({allSettledSplits.length})
            </h3>
          </div>
          <div className="space-y-3">
            {allSettledSplits.map(renderSplitCard)}
          </div>
        </div>
      )}
    </div>
  );
}
