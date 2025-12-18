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

export function SplitDetailDialog() {
  const { viewingSplit, isDetailOpen, closeSplitDetail, toggleSplitStatus, deleteSplit } =
    useSplit();
  const [copied, setCopied] = useState(false);

  if (!viewingSplit) return null;

  const config = categoryConfig[viewingSplit.transaction.category];

  const methodLabels = {
    equal: "Equal Split",
    percentage: "Percentage Split",
    custom: "Custom Split",
    itemized: "Itemized Split",
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/split/${viewingSplit.id}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this split?")) {
      deleteSplit(viewingSplit.id);
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
            {viewingSplit.participants.map((participant) => (
              <div
                key={participant.contact.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white border border-stone-200"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      className={`${participant.contact.color} text-white`}
                    >
                      {participant.contact.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-stone-900">
                      {participant.contact.name}
                    </p>
                    <p className="text-sm text-stone-500">
                      {participant.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-stone-900">
                  {formatCurrency(participant.amount)}
                </p>
              </div>
            ))}
          </div>

          {/* Items for itemized splits */}
          {viewingSplit.method === "itemized" && viewingSplit.items.length > 0 && (
            <>
              <h4 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Items ({viewingSplit.items.length})
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
                    {viewingSplit.items.map((item) => (
                      <TableRow key={item.id}>
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
                          <div className="flex -space-x-1">
                            {item.assignedTo.map((contactId) => {
                              const participant = viewingSplit.participants.find(
                                (p) => p.contact.id === contactId
                              );
                              if (!participant) return null;
                              return (
                                <Avatar
                                  key={contactId}
                                  className="h-6 w-6 border-2 border-white"
                                >
                                  <AvatarFallback
                                    className={`${participant.contact.color} text-white text-xs`}
                                  >
                                    {participant.contact.initials}
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

          {/* Receipt Image */}
          {viewingSplit.receiptImage && (
            <>
              <h4 className="font-medium text-stone-900 mb-3">Receipt Image</h4>
              <img
                src={viewingSplit.receiptImage}
                alt="Receipt"
                className="w-full rounded-lg border mb-4"
              />
            </>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t">
          <div className="flex gap-2">
            <Button
              variant={isPending ? "default" : "outline"}
              className="flex-1"
              onClick={() => toggleSplitStatus(viewingSplit.id)}
            >
              {isPending ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Settled
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Mark as Pending
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
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Split
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



