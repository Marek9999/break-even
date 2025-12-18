"use client";

import { useSplit } from "@/lib/split-context";
import { formatCurrency, getContactById } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Equal } from "lucide-react";
import { useEffect } from "react";

export function EqualSplit() {
  const {
    selectedTransaction,
    selectedContacts,
    participants,
    calculateEqualSplit,
    setCurrentStep,
  } = useSplit();

  useEffect(() => {
    calculateEqualSplit();
  }, [calculateEqualSplit]);

  if (!selectedTransaction) return null;

  const totalAmount = selectedTransaction.amount;
  const perPersonAmount = totalAmount / selectedContacts.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Equal className="h-5 w-5 text-stone-600" />
          <h3 className="font-semibold text-stone-900">Equal Split</h3>
        </div>
        <p className="text-sm text-stone-500">
          Split {formatCurrency(totalAmount)} equally between {selectedContacts.length} people
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
        {participants.map((participant) => {
          const contact = getContactById(participant.contactId);
          if (!contact) return null;

          return (
            <div
              key={participant.contactId}
              className="flex items-center justify-between p-3 rounded-lg bg-white border border-stone-200"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`${contact.color} text-white`}>
                    {contact.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-stone-900">{contact.name}</p>
                  <p className="text-sm text-stone-500">
                    {participant.percentage?.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="font-semibold text-stone-900">
                {formatCurrency(participant.amount)}
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



