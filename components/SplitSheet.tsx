"use client";

import { useSplit } from "@/lib/split-context";
import { formatCurrency } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ContactSelector } from "./ContactSelector";
import { SplitMethodTabs } from "./SplitMethodTabs";
import { SplitSummary } from "./SplitSummary";

export function SplitSheet() {
  const { isSheetOpen, closeSplitSheet, selectedTransaction, currentStep } =
    useSplit();

  const renderStep = () => {
    switch (currentStep) {
      case "contacts":
        return <ContactSelector />;
      case "method":
      case "configure":
        return <SplitMethodTabs />;
      case "summary":
        return <SplitSummary />;
      default:
        return <ContactSelector />;
    }
  };

  return (
    <Dialog open={isSheetOpen} onOpenChange={(open) => !open && closeSplitSheet()}>
      <DialogContent className="sm:max-w-lg flex flex-col h-[90vh] max-h-[90vh] overflow-hidden">
        <DialogHeader className="text-left shrink-0">
          <DialogTitle>
            {currentStep === "contacts"
              ? "Split Transaction"
              : currentStep === "summary"
              ? "Review Split"
              : "Configure Split"}
          </DialogTitle>
          <DialogDescription>
            {selectedTransaction && currentStep === "contacts" && (
              <>
                {selectedTransaction.merchant} •{" "}
                {formatCurrency(selectedTransaction.amount)}
              </>
            )}
            {currentStep === "method" && "Choose how to split the amount"}
            {currentStep === "summary" && "Confirm and share your split"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2">
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
