"use client";

import { useSplit } from "@/lib/split-context";
import { formatCurrency, formatDate, categoryConfig } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share2, Check, Receipt, Save } from "lucide-react";
import { useState } from "react";
import { SharePreview } from "./SharePreview";

export function SplitSummary() {
  const {
    selectedTransaction,
    selectedFriends,
    splitMethod,
    participants,
    receiptItems,
    setCurrentStep,
    saveSplit,
  } = useSplit();

  const [showSharePreview, setShowSharePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!selectedTransaction) return null;

  const config = categoryConfig[selectedTransaction.category as keyof typeof categoryConfig] || {
    label: selectedTransaction.category,
    color: "text-stone-600",
    bgColor: "bg-stone-100",
  };
  const totalAssigned = participants.reduce((sum, p) => sum + p.amount, 0);

  const methodLabels = {
    equal: "Equal Split",
    percentage: "Percentage Split",
    custom: "Custom Split",
    itemized: "Itemized Split",
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSplit();
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to find friend by ID
  const getFriendById = (friendId: string) => 
    selectedFriends.find((f) => f._id === friendId);

  return (
    <>
      <div className="flex flex-col pb-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentStep("method")}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold text-stone-900">Split Summary</h3>
            <p className="text-sm text-stone-500">Review your split before sharing</p>
          </div>
        </div>

        {/* Transaction Card */}
        <Card className="p-4 mb-4 bg-stone-50 border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-stone-900">
                {selectedTransaction.merchant}
              </p>
              <p className="text-sm text-stone-500">
                {formatDate(selectedTransaction.date)}
              </p>
            </div>
            <Badge className={`${config.bgColor} ${config.color} border-0`}>
              {config.label}
            </Badge>
          </div>
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <span className="text-stone-600">Total Amount</span>
            <span className="font-bold text-lg">
              {formatCurrency(selectedTransaction.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-stone-600">Split Method</span>
            <span className="text-stone-900">{methodLabels[splitMethod]}</span>
          </div>
        </Card>

        {/* Participants Breakdown */}
        <h4 className="font-medium text-stone-900 mb-3">
          Split Breakdown ({selectedFriends.length} people)
        </h4>

        <div className="space-y-2 mb-4">
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
                      {participant?.percentage?.toFixed(1) || 0}% of total
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

        {/* Itemized Details */}
        {splitMethod === "itemized" && receiptItems.length > 0 && (
          <>
            <h4 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Items Breakdown
            </h4>
            <Card className="mb-4 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receiptItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-stone-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.quantity * item.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-1">
                          {item.assignedTo.map((friendId) => {
                            const friend = getFriendById(friendId);
                            if (!friend) return null;
                            return (
                              <Avatar
                                key={friendId}
                                className="h-6 w-6 border-2 border-white"
                              >
                                <AvatarFallback
                                  className={`${friend.color} text-white text-xs`}
                                >
                                  {friend.initials}
                                </AvatarFallback>
                              </Avatar>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {/* Total Check */}
        <Card className="p-3 bg-emerald-50 border-emerald-200 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                Split Total
              </span>
            </div>
            <span className="font-semibold text-emerald-700">
              {formatCurrency(totalAssigned)}
            </span>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="pt-4 border-t mt-4 space-y-2">
          <Button className="w-full" onClick={() => setShowSharePreview(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Split
          </Button>
          <Button variant="outline" className="w-full" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save & Done"}
          </Button>
        </div>
      </div>

      <SharePreview open={showSharePreview} onOpenChange={setShowSharePreview} />
    </>
  );
}
