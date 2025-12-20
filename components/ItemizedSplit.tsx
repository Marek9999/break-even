"use client";

import { useSplit } from "@/lib/split-context";
import { formatCurrency } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Check,
} from "lucide-react";
import { useRef, useState } from "react";

export function ItemizedSplit() {
  const {
    selectedTransaction,
    selectedFriends,
    receiptItems,
    receiptImage,
    removeReceiptItem,
    updateReceiptItem,
    assignItemToPerson,
    unassignItemFromPerson,
    setReceiptImage,
    addReceiptItems,
    calculateItemizedSplit,
    setCurrentStep,
    isManualTransactionMode,
    manualTransactionData,
  } = useSplit();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", quantity: "", price: "" });

  // Get transaction info from either source
  const transactionInfo = isManualTransactionMode
    ? manualTransactionData
    : selectedTransaction;

  const transactionTotal = transactionInfo?.amount ?? 0;

  // Calculate totals
  const itemsTotal = receiptItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  // Calculate difference
  const difference = transactionTotal - itemsTotal;
  const isExactMatch = Math.abs(difference) < 0.01;
  const isUnder = difference > 0.01;
  const isOver = difference < -0.01;

  const allItemsAssigned = receiptItems.every(
    (item) => item.assignedTo.length > 0
  );

  const scanReceipt = async (imageData: string) => {
    setIsScanning(true);
    setScanError(null);

    try {
      // Extract mime type from base64 string
      const mimeTypeMatch = imageData.match(/^data:(image\/[a-zA-Z]+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData,
          mimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setScanError(data.error || "Failed to scan receipt. You can add items manually.");
        return;
      }

      if (data.success && data.items && data.items.length > 0) {
        // Add all scanned items
        addReceiptItems(
          data.items.map((item: { name: string; quantity: number; price: number }) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            assignedTo: [],
          }))
        );
        setScanError(null);
      }
    } catch (error) {
      console.error("Error scanning receipt:", error);
      setScanError("Failed to scan receipt. You can add items manually.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        setReceiptImage(imageData);
        // Automatically scan the receipt after upload
        await scanReceipt(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRescan = async () => {
    if (receiptImage) {
      await scanReceipt(receiptImage);
    }
  };

  const handleRemoveImage = () => {
    setReceiptImage(null);
    setScanError(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContinue = () => {
    calculateItemizedSplit();
    setCurrentStep("summary");
  };

  const startEditing = (item: typeof receiptItems[0]) => {
    setEditingItemId(item.id);
    setEditForm({
      name: item.name,
      quantity: item.quantity.toString(),
      price: item.price.toString(),
    });
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditForm({ name: "", quantity: "", price: "" });
  };

  const saveEditing = (itemId: string) => {
    const quantity = parseInt(editForm.quantity) || 1;
    const price = parseFloat(editForm.price) || 0;
    
    if (editForm.name.trim()) {
      updateReceiptItem(itemId, {
        name: editForm.name.trim(),
        quantity,
        price,
      });
    }
    
    setEditingItemId(null);
    setEditForm({ name: "", quantity: "", price: "" });
  };

  if (!transactionInfo) return null;

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
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
        {receiptImage ? (
          <div className="relative">
            <img
              src={receiptImage}
              alt="Receipt"
              className={`w-full h-32 object-cover rounded-lg ${isScanning ? "opacity-50" : ""}`}
            />
            {isScanning ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-stone-600" />
                  <span className="text-sm text-stone-600">Scanning receipt...</span>
                </div>
              </div>
            ) : (
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-white/90 hover:bg-white"
                  onClick={handleRescan}
                  title="Re-scan receipt"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-20 border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
          >
            <ImagePlus className="h-5 w-5 mr-2" />
            Upload or Capture Receipt Image
          </Button>
        )}
      </div>

      {/* Scan Error Alert */}
      {scanError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{scanError}</p>
            <p className="text-xs text-red-500 mt-1">
              You can add items manually below or try uploading a different image.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-400 hover:text-red-600"
            onClick={() => setScanError(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Add Item Form - pass remaining amount for placeholder */}
      <ReceiptItemForm remainingAmount={isUnder ? difference : undefined} />

      <Separator className="my-4" />

      {/* Items List Header with Total and Difference */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-stone-900">Items ({receiptItems.length})</h4>
          <span className="text-sm text-stone-500">
            Total: {formatCurrency(itemsTotal)}
          </span>
        </div>
        {/* Difference Display */}
        {receiptItems.length > 0 && (
          <div className="flex items-center justify-end mt-1">
            {isExactMatch ? (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Totals match
              </span>
            ) : isUnder ? (
              <span className="text-xs text-amber-600">
                {formatCurrency(difference)} remaining
              </span>
            ) : isOver ? (
              <span className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {formatCurrency(Math.abs(difference))} over
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Total Mismatch Warning Banner */}
      {receiptItems.length > 0 && !isExactMatch && (
        <div className={`mb-3 p-2 rounded-lg text-xs ${
          isOver 
            ? "bg-red-50 border border-red-200 text-red-700" 
            : "bg-amber-50 border border-amber-200 text-amber-700"
        }`}>
          <p>
            Items total <strong>{formatCurrency(itemsTotal)}</strong> but transaction is{" "}
            <strong>{formatCurrency(transactionTotal)}</strong>.
            {isUnder && " Add more items or adjust prices."}
            {isOver && " Remove items or adjust prices."}
          </p>
        </div>
      )}

      <ScrollArea className="flex-1 -mx-1 px-1">
        {receiptItems.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No items added yet</p>
            <p className="text-xs mt-1">Upload a receipt to scan or add items manually</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {receiptItems.map((item) => {
              const isEditing = editingItemId === item.id;
              
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-white border border-stone-200"
                >
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Item name"
                          className="flex-1"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="w-20">
                          <Input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                            placeholder="Qty"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            placeholder="Price"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEditing(item.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div 
                          className="flex-1 cursor-pointer hover:bg-stone-50 rounded p-1 -m-1 transition-colors"
                          onClick={() => startEditing(item)}
                          title="Click to edit"
                        >
                          <p className="font-medium text-stone-900 flex items-center gap-1">
                            {item.name}
                            <Pencil className="h-3 w-3 text-stone-400 opacity-0 group-hover:opacity-100" />
                          </p>
                          <p className="text-sm text-stone-500">
                            {item.quantity} × {formatCurrency(item.price)} ={" "}
                            {formatCurrency(item.quantity * item.price)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-400 hover:text-stone-600"
                            onClick={() => startEditing(item)}
                            title="Edit item"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-400 hover:text-red-500"
                            onClick={() => removeReceiptItem(item.id)}
                            title="Delete item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                    </>
                  )}
                </div>
              );
            })}
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
