"use client";

import { useSplit } from "@/lib/split-context";
import { formatCurrency, getContactById } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Percent, AlertCircle } from "lucide-react";
import { useMemo } from "react";

export function PercentageSplit() {
  const {
    selectedTransaction,
    participants,
    updateParticipantPercentage,
    setCurrentStep,
  } = useSplit();

  const totalPercentage = useMemo(
    () => participants.reduce((sum, p) => sum + (p.percentage || 0), 0),
    [participants]
  );

  const isValid = Math.abs(totalPercentage - 100) < 0.01;

  if (!selectedTransaction) return null;

  const totalAmount = selectedTransaction.amount;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="h-5 w-5 text-stone-600" />
          <h3 className="font-semibold text-stone-900">Percentage Split</h3>
        </div>
        <p className="text-sm text-stone-500">
          Set custom percentages for each person (total must equal 100%)
        </p>
      </div>

      {/* Total Indicator */}
      <div
        className={`p-3 rounded-lg mb-4 flex items-center justify-between ${
          isValid ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"
        }`}
      >
        <div className="flex items-center gap-2">
          {!isValid && <AlertCircle className="h-4 w-4 text-amber-600" />}
          <span className={`text-sm font-medium ${isValid ? "text-emerald-700" : "text-amber-700"}`}>
            Total: {totalPercentage.toFixed(1)}%
          </span>
        </div>
        <span className={`text-sm ${isValid ? "text-emerald-600" : "text-amber-600"}`}>
          {isValid ? "Valid" : `${(100 - totalPercentage).toFixed(1)}% remaining`}
        </span>
      </div>

      {/* Participants */}
      <div className="flex-1 space-y-3">
        {participants.map((participant) => {
          const contact = getContactById(participant.contactId);
          if (!contact) return null;

          return (
            <div
              key={participant.contactId}
              className="p-3 rounded-lg bg-white border border-stone-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`${contact.color} text-white`}>
                      {contact.initials}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-stone-900">{contact.name}</p>
                </div>
                <p className="font-semibold text-stone-900">
                  {formatCurrency(participant.amount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={participant.percentage || ""}
                  onChange={(e) =>
                    updateParticipantPercentage(
                      participant.contactId,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="flex-1"
                  placeholder="0"
                />
                <span className="text-stone-500">%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="pt-4 border-t mt-4">
        <Button
          className="w-full"
          onClick={() => setCurrentStep("summary")}
          disabled={!isValid}
        >
          Review Split
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}



