"use client";

import { useSplit } from "@/lib/split-context";
import { formatCurrency, formatDate, categoryConfig } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, ExternalLink, Receipt } from "lucide-react";
import { useState } from "react";

interface SharePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SharePreview({ open, onOpenChange }: SharePreviewProps) {
  const {
    selectedTransaction,
    selectedFriends,
    splitMethod,
    participants,
    receiptItems,
  } = useSplit();

  const [copied, setCopied] = useState(false);

  if (!selectedTransaction) return null;

  const config = categoryConfig[selectedTransaction.category as keyof typeof categoryConfig] || {
    label: selectedTransaction.category,
    color: "text-stone-600",
    bgColor: "bg-stone-100",
  };

  const methodLabels = {
    equal: "Equal Split",
    percentage: "Percentage Split",
    custom: "Custom Split",
    itemized: "Itemized Split",
  };

  const handleCopyLink = () => {
    // In a real app, this would generate and copy a shareable URL
    navigator.clipboard.writeText(
      `${window.location.origin}/split/preview?data=...`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Share Preview
          </DialogTitle>
          <DialogDescription>
            This is how others will see the split when you share it
          </DialogDescription>
        </DialogHeader>

        {/* Preview Content */}
        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg border">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-900 text-white mb-2">
                <span className="text-xl font-bold">BE</span>
              </div>
              <h3 className="font-bold text-lg text-stone-900">Break-Even</h3>
              <p className="text-sm text-stone-500">Payment Split</p>
            </div>

            <Separator className="my-4" />

            {/* Transaction Details */}
            <Card className="p-4 mb-4">
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
              <div className="text-center py-3">
                <p className="text-sm text-stone-500">Total Amount</p>
                <p className="text-2xl font-bold text-stone-900">
                  {formatCurrency(selectedTransaction.amount)}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  {methodLabels[splitMethod]}
                </p>
              </div>
            </Card>

            {/* Participants */}
            <h4 className="font-medium text-stone-900 mb-3 text-center">
              Split Between {selectedFriends.length} People
            </h4>

            <div className="space-y-2 mb-4">
              {selectedFriends.map((friend, index) => {
                const participant = participants[index];

                return (
                  <div
                    key={friend._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          className={`${friend.color} text-white text-sm`}
                        >
                          {friend.initials}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-stone-900">{friend.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900">
                        {formatCurrency(participant?.amount || 0)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {participant?.percentage?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Items for itemized splits */}
            {splitMethod === "itemized" && receiptItems.length > 0 && (
              <>
                <h4 className="font-medium text-stone-900 mb-2 flex items-center justify-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Items
                </h4>
                <div className="space-y-1 mb-4">
                  {receiptItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm p-2 bg-white rounded"
                    >
                      <span className="text-stone-700">
                        {item.name}{" "}
                        {item.quantity > 1 && `(×${item.quantity})`}
                      </span>
                      <span className="text-stone-900 font-medium">
                        {formatCurrency(item.quantity * item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Footer */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-stone-400">
                Powered by Break-Even
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
