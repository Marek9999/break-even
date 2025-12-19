"use client";

import { useSplit } from "@/lib/split-context";
import { formatCurrency } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Equal } from "lucide-react";
import { useEffect } from "react";

export function EqualSplit() {
  const {
    selectedTransaction,
    selectedFriends,
    participants,
    calculateEqualSplit,
    setCurrentStep,
  } = useSplit();

  useEffect(() => {
    calculateEqualSplit();
  }, [calculateEqualSplit]);

  if (!selectedTransaction) return null;

  const totalAmount = selectedTransaction.amount;
  const perPersonAmount = selectedFriends.length > 0 ? totalAmount / selectedFriends.length : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Equal className="h-5 w-5 text-stone-600" />
          <h3 className="font-semibold text-stone-900">Equal Split</h3>
        </div>
        <p className="text-sm text-stone-500">
          Split {formatCurrency(totalAmount)} equally between {selectedFriends.length} people
        </p>
      </div>

      {/* Split Preview */}
      <Card className="p-4 mb-6 bg-stone-50 border-stone-200">
        <div className="text-center">
          <p className="text-sm text-stone-500 mb-1">Each person pays</p>
          <p className="text-3xl font-bold text-stone-900">
            {formatCurrency(perPersonAmount)}
          </p>
        </div>
      </Card>

      {/* Participants */}
      <div className="flex-1 space-y-3">
        {selectedFriends.map((friend, index) => {
          const participant = participants[index];
          
          return (
            <div
              key={friend._id}
              className="flex items-center justify-between p-3 rounded-lg bg-white border border-stone-200"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`${friend.color} text-white`}>
                    {friend.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-stone-900">{friend.name}</p>
                  <p className="text-sm text-stone-500">
                    {participant?.percentage?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
              <p className="font-semibold text-stone-900">
                {formatCurrency(participant?.amount || 0)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="pt-4 border-t mt-4">
        <Button className="w-full" onClick={() => setCurrentStep("summary")}>
          Review Split
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
