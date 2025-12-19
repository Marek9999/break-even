"use client";

import { useSplit, ManualTransactionData } from "@/lib/split-context";
import { formatCurrency, categoryConfig } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContactSelector } from "./ContactSelector";
import { SplitMethodTabs } from "./SplitMethodTabs";
import { SplitSummary } from "./SplitSummary";
import { ArrowRight, DollarSign, Receipt } from "lucide-react";
import { useState, useEffect } from "react";

// Transaction info form component
function TransactionInfoForm() {
  const { setManualTransactionData, setCurrentStep, manualTransactionData } = useSplit();
  
  const [merchant, setMerchant] = useState(manualTransactionData?.merchant || "");
  const [amount, setAmount] = useState(manualTransactionData?.amount?.toString() || "");
  const [date, setDate] = useState(
    manualTransactionData?.date || new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState(manualTransactionData?.category || "");
  const [description, setDescription] = useState(manualTransactionData?.description || "");

  const isValid = merchant.trim() !== "" && parseFloat(amount) > 0;

  const handleContinue = () => {
    if (!isValid) return;

    const data: ManualTransactionData = {
      merchant: merchant.trim(),
      amount: parseFloat(amount),
      date: date || undefined,
      category: category || undefined,
      description: description || undefined,
    };

    setManualTransactionData(data);
    setCurrentStep("contacts");
  };

  // Available categories from the config
  const categories = Object.entries(categoryConfig).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  return (
    <div className="flex flex-col pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-100">
          <Receipt className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-stone-900">Transaction Details</h3>
          <p className="text-sm text-stone-500">Enter the cash transaction information</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Merchant Name - Required */}
        <div className="space-y-2">
          <Label htmlFor="merchant">
            Transaction Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="merchant"
            placeholder="e.g., Dinner at Restaurant"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="bg-white"
          />
        </div>

        {/* Amount - Required */}
        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Date - Optional */}
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white"
          />
        </div>

        {/* Category - Optional */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description - Optional */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Add a note (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-white"
          />
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-4 border-t">
        <Button
          className="w-full"
          onClick={handleContinue}
          disabled={!isValid}
        >
          Continue to Split
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function AddManualTransactionDialog() {
  const {
    isSheetOpen,
    closeSplitSheet,
    currentStep,
    isManualTransactionMode,
    manualTransactionData,
  } = useSplit();

  // Only show this dialog when in manual transaction mode
  if (!isManualTransactionMode) return null;

  const getTitle = () => {
    switch (currentStep) {
      case "transaction-info":
        return "Add Cash Transaction";
      case "contacts":
        return "Split Transaction";
      case "method":
      case "configure":
        return "Configure Split";
      case "summary":
        return "Review Split";
      default:
        return "Add Cash Transaction";
    }
  };

  const getDescription = () => {
    switch (currentStep) {
      case "transaction-info":
        return "Enter details for your cash transaction";
      case "contacts":
        return manualTransactionData
          ? `${manualTransactionData.merchant} • ${formatCurrency(manualTransactionData.amount)}`
          : "Choose who to split with";
      case "method":
        return "Choose how to split the amount";
      case "summary":
        return "Confirm and save your split";
      default:
        return "";
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "transaction-info":
        return <TransactionInfoForm />;
      case "contacts":
        return <ContactSelector />;
      case "method":
      case "configure":
        return <SplitMethodTabs />;
      case "summary":
        return <SplitSummary />;
      default:
        return <TransactionInfoForm />;
    }
  };

  return (
    <Dialog open={isSheetOpen} onOpenChange={(open) => !open && closeSplitSheet()}>
      <DialogContent className="sm:max-w-lg flex flex-col h-[90vh] max-h-[90vh] overflow-hidden">
        <DialogHeader className="text-left shrink-0">
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2">
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

