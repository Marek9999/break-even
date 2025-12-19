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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt,
  CheckCircle2,
  Clock,
  Trash2,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { generateInitials, generateAvatarColor } from "@/lib/data";

export function SplitDetailDialog() {
  const { viewingSplit, isDetailOpen, closeSplitDetail, toggleSplitStatus, deleteSplit } =
    useSplit();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!viewingSplit || !viewingSplit.transaction) return null;

  const config = categoryConfig[viewingSplit.transaction.category as keyof typeof categoryConfig] || {
    label: viewingSplit.transaction.category,
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
    navigator.clipboard.writeText(
      `${window.location.origin}/split/${viewingSplit._id}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this split?")) {
      setIsDeleting(true);
      try {
        await deleteSplit(viewingSplit._id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleStatus = async () => {
    setIsUpdating(true);
    try {
      await toggleSplitStatus(viewingSplit._id);
    } finally {
      setIsUpdating(false);
    }
  };

  const isPending = viewingSplit.status === "pending";

  return (
    <Dialog open={isDetailOpen} onOpenChange={(open) => !open && closeSplitDetail()}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPending ? (
              <Clock className="h-5 w-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            )}
            Split Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          {/* Transaction Info */}
          <Card className="p-4 mb-4 bg-stone-50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-stone-900">
                  {viewingSplit.transaction.merchant}
                </h3>
                <p className="text-sm text-stone-500">
                  {formatDate(viewingSplit.transaction.date)}
                </p>
              </div>
              <Badge className={`${config.bgColor} ${config.color} border-0`}>
                {config.label}
              </Badge>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-stone-500">Total Amount</p>
                <p className="font-bold text-lg">
                  {formatCurrency(viewingSplit.transaction.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-stone-500">Split Method</p>
                <p className="font-medium">{methodLabels[viewingSplit.method]}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-stone-500">Status</p>
              <Badge
                variant={isPending ? "outline" : "default"}
                className={
                  isPending
                    ? "border-amber-300 text-amber-700 bg-amber-50"
                    : "bg-emerald-500"
                }
              >
                {isPending ? "Pending" : "Settled"}
              </Badge>
            </div>
            <p className="text-xs text-stone-400 mt-3">
              Created {new Date(viewingSplit.createdAt).toLocaleString()}
            </p>
          </Card>

          {/* Participants */}
          <h4 className="font-medium text-stone-900 mb-3">
            Participants ({viewingSplit.participants.length})
          </h4>
          <div className="space-y-2 mb-4">
            {viewingSplit.participants.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-4">
                Participant details will be loaded here
              </p>
            ) : (
              viewingSplit.participants.map((participant) => {
                const initials = participant.user ? generateInitials(participant.user.name) : "?";
                const color = participant.user ? generateAvatarColor() : "bg-stone-400";
                
                return (
                  <div
                    key={participant.oderId}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border border-stone-200"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${color} text-white`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-stone-900">
                          {participant.user?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-stone-500">
                          {participant.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900">
                        {formatCurrency(participant.amount)}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={participant.status === "paid" ? "text-emerald-600 border-emerald-300" : "text-amber-600 border-amber-300"}
                      >
                        {participant.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Items for itemized splits */}
          {viewingSplit.method === "itemized" && viewingSplit.receiptItems.length > 0 && (
            <>
              <h4 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Items ({viewingSplit.receiptItems.length})
              </h4>
              <Card className="mb-4 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingSplit.receiptItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.quantity > 1 && (
                              <p className="text-xs text-stone-500">
                                Qty: {item.quantity}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.quantity * item.price)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-stone-500">
                            {item.assignedToUserIds.length} people
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t">
          <div className="flex gap-2">
            <Button
              variant={isPending ? "default" : "outline"}
              className="flex-1"
              onClick={handleToggleStatus}
              disabled={isUpdating}
            >
              {isPending ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isUpdating ? "Updating..." : "Mark as Settled"}
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  {isUpdating ? "Updating..." : "Mark as Pending"}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Split"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
