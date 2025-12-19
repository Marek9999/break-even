"use client";

import { useSplit } from "@/lib/split-context";
import { formatCurrency } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ReceiptItemForm } from "./ReceiptItemForm";
import {
  ArrowRight,
  Receipt,
  Trash2,
  ImagePlus,
  X,
  Users,
} from "lucide-react";
import { useRef } from "react";

export function ItemizedSplit() {
  const {
    selectedTransaction,
    selectedFriends,
    receiptItems,
    receiptImage,
    removeReceiptItem,
    assignItemToPerson,
    unassignItemFromPerson,
    setReceiptImage,
    calculateItemizedSplit,
    setCurrentStep,
  } = useSplit();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate totals
  const itemsTotal = receiptItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const allItemsAssigned = receiptItems.every(
    (item) => item.assignedTo.length > 0
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    calculateItemizedSplit();
    setCurrentStep("summary");
  };

  if (!selectedTransaction) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="h-5 w-5 text-stone-600" />
          <h3 className="font-semibold text-stone-900">Itemized Split</h3>
        </div>
        <p className="text-sm text-stone-500">
          Add items from your receipt and assign them to people
        </p>
      </div>

      {/* Receipt Image Upload */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        {receiptImage ? (
          <div className="relative">
            <img
              src={receiptImage}
              alt="Receipt"
              className="w-full h-32 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => setReceiptImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-20 border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-5 w-5 mr-2" />
            Attach Receipt Image (Optional)
          </Button>
        )}
      </div>

      {/* Add Item Form */}
      <ReceiptItemForm />

      <Separator className="my-4" />

      {/* Items List */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-stone-900">Items ({receiptItems.length})</h4>
        <span className="text-sm text-stone-500">
          Total: {formatCurrency(itemsTotal)}
        </span>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        {receiptItems.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No items added yet</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {receiptItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-white border border-stone-200"
              >
                {/* Item Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-stone-900">{item.name}</p>
                    <p className="text-sm text-stone-500">
                      {item.quantity} × {formatCurrency(item.price)} ={" "}
                      {formatCurrency(item.quantity * item.price)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-stone-400 hover:text-red-500"
                    onClick={() => removeReceiptItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Assign to People */}
                <div className="mt-2">
                  <p className="text-xs text-stone-500 mb-2 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Assign to:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedFriends.map((friend) => {
                      const isAssigned = item.assignedTo.includes(friend._id);
                      return (
                        <Badge
                          key={friend._id}
                          variant={isAssigned ? "default" : "outline"}
                          className={`cursor-pointer transition-all ${
                            isAssigned
                              ? `${friend.color} text-white border-transparent`
                              : "hover:bg-stone-100"
                          }`}
                          onClick={() =>
                            isAssigned
                              ? unassignItemFromPerson(item.id, friend._id)
                              : assignItemToPerson(item.id, friend._id)
                          }
                        >
                          {friend.initials}
                        </Badge>
                      );
                    })}
                  </div>
                  {item.assignedTo.length > 1 && (
                    <p className="text-xs text-stone-400 mt-1">
                      Split: {formatCurrency((item.quantity * item.price) / item.assignedTo.length)} each
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Continue Button */}
      <div className="pt-4 border-t mt-4">
        <Button
          className="w-full"
          onClick={handleContinue}
          disabled={receiptItems.length === 0 || !allItemsAssigned}
        >
          {receiptItems.length === 0
            ? "Add items to continue"
            : !allItemsAssigned
            ? "Assign all items to continue"
            : "Review Split"}
          {allItemsAssigned && receiptItems.length > 0 && (
            <ArrowRight className="ml-2 h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
