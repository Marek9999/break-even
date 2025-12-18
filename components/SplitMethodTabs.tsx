"use client";

import { useSplit } from "@/lib/split-context";
import { formatCurrency } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EqualSplit } from "./EqualSplit";
import { PercentageSplit } from "./PercentageSplit";
import { CustomSplit } from "./CustomSplit";
import { ItemizedSplit } from "./ItemizedSplit";
import { ArrowLeft, Equal, Percent, DollarSign, Receipt } from "lucide-react";

export function SplitMethodTabs() {
  const { selectedTransaction, splitMethod, setSplitMethod, setCurrentStep } = useSplit();

  if (!selectedTransaction) return null;

  return (
    <div className="flex flex-col pb-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentStep("contacts")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="font-semibold text-stone-900">
            {selectedTransaction.merchant}
          </h3>
          <p className="text-sm text-stone-500">
            {formatCurrency(selectedTransaction.amount)}
          </p>
        </div>
      </div>

      {/* Method Tabs */}
      <Tabs
        value={splitMethod}
        onValueChange={(value) => setSplitMethod(value as typeof splitMethod)}
        className="flex flex-col"
      >
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="equal" className="flex flex-col gap-1 h-auto py-2">
            <Equal className="h-4 w-4" />
            <span className="text-xs">Equal</span>
          </TabsTrigger>
          <TabsTrigger value="percentage" className="flex flex-col gap-1 h-auto py-2">
            <Percent className="h-4 w-4" />
            <span className="text-xs">Percent</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex flex-col gap-1 h-auto py-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Custom</span>
          </TabsTrigger>
          <TabsTrigger value="itemized" className="flex flex-col gap-1 h-auto py-2">
            <Receipt className="h-4 w-4" />
            <span className="text-xs">Items</span>
          </TabsTrigger>
        </TabsList>

        <div>
          <TabsContent value="equal" className="mt-0">
            <EqualSplit />
          </TabsContent>
          <TabsContent value="percentage" className="mt-0">
            <PercentageSplit />
          </TabsContent>
          <TabsContent value="custom" className="mt-0">
            <CustomSplit />
          </TabsContent>
          <TabsContent value="itemized" className="mt-0">
            <ItemizedSplit />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}



