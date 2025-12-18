"use client";

import { useState } from "react";
import { useSplit } from "@/lib/split-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ReceiptItemFormProps {
  onItemAdded?: () => void;
}

export function ReceiptItemForm({ onItemAdded }: ReceiptItemFormProps) {
  const { addReceiptItem } = useSplit();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price) return;

    addReceiptItem({
      name: name.trim(),
      quantity: parseInt(quantity) || 1,
      price: parseFloat(price) || 0,
      assignedTo: [],
    });

    setName("");
    setQuantity("1");
    setPrice("");
    onItemAdded?.();
  };

  const isValid = name.trim() && parseFloat(price) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-stone-50 rounded-lg">
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-2">
          <Label htmlFor="item-name" className="text-xs text-stone-500">
            Item Name
          </Label>
          <Input
            id="item-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Pizza"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="item-qty" className="text-xs text-stone-500">
            Qty
          </Label>
          <Input
            id="item-qty"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="item-price" className="text-xs text-stone-500">
            Price ($)
          </Label>
          <Input
            id="item-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="mt-1"
          />
        </div>
      </div>
      <Button type="submit" size="sm" className="w-full" disabled={!isValid}>
        <Plus className="h-4 w-4 mr-1" />
        Add Item
      </Button>
    </form>
  );
}



