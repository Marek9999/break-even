"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Link2, CheckCircle2, AlertCircle } from "lucide-react";

// Generate a random color for the bank account card
const ACCOUNT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function getRandomColor() {
  return ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)];
}

interface PlaidLinkProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function PlaidLink({
  variant = "default",
  size = "default",
  className,
  children,
  onSuccess,
}: PlaidLinkProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const createFromPlaid = useMutation(api.bankAccounts.createFromPlaid);
  const bulkCreateTransactions = useMutation(api.transactions.bulkCreateFromPlaid);

  // Fetch link token on mount (only when authenticated)
  useEffect(() => {
    // Don't fetch if not loaded or not signed in
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const fetchLinkToken = async () => {
      try {
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
        });

        // Check if response is ok and is JSON
        if (!response.ok) {
          console.error("Failed to create link token:", response.status);
          setError("Failed to initialize bank connection");
          return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Response is not JSON");
          setError("Failed to initialize bank connection");
          return;
        }

        const data = await response.json();
        if (data.link_token) {
          setLinkToken(data.link_token);
        } else {
          setError(data.error || "Failed to initialize bank connection");
        }
      } catch (err) {
        console.error("Error fetching link token:", err);
        setError("Failed to initialize bank connection");
      }
    };

    fetchLinkToken();
  }, [isLoaded, isSignedIn]);

  // Handle successful Plaid Link flow
  const handleOnSuccess = useCallback(
    async (publicToken: string) => {
      setIsExchanging(true);
      setError(null);
      setWarningMessage(null);

      try {
        // Step 1: Exchange public token for access token
        const exchangeResponse = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token: publicToken }),
        });
        const exchangeData = await exchangeResponse.json();

        if (!exchangeData.success) {
          throw new Error("Failed to link bank account");
        }

        // Step 2: Create bank accounts in Convex (with duplicate detection)
        const newAccounts: Array<{ id: string; accessToken: string; bankName: string }> = [];
        const existingAccounts: Array<{ bankName: string }> = [];
        
        for (const account of exchangeData.accounts) {
          const result = await createFromPlaid({
            bankName: account.bankName,
            accountNumberLast4: account.accountNumberLast4,
            accountType: account.accountType,
            balance: account.balance,
            color: getRandomColor(),
            plaidItemId: account.plaidItemId,
            plaidAccessToken: account.plaidAccessToken,
            plaidAccountId: account.plaidAccountId,
          });
          
          if (result.alreadyExisted) {
            existingAccounts.push({ bankName: result.bankName });
          } else {
            newAccounts.push({
              id: result.accountId,
              accessToken: account.plaidAccessToken,
              bankName: result.bankName,
            });
          }
        }

        // Step 3: Only sync transactions for newly created accounts
        for (const account of newAccounts) {
          const syncResponse = await fetch("/api/plaid/sync-transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: account.accessToken }),
          });
          const syncData = await syncResponse.json();

          if (syncData.success && syncData.transactions.length > 0) {
            await bulkCreateTransactions({
              bankAccountId: account.id as never,
              transactions: syncData.transactions.map((txn: {
                merchant: string;
                amount: number;
                date: string;
                category: string;
                description: string;
                plaidTransactionId: string;
              }) => ({
                merchant: txn.merchant,
                amount: txn.amount,
                date: txn.date,
                category: txn.category,
                description: txn.description,
                plaidTransactionId: txn.plaidTransactionId,
              })),
            });
          }
        }

        // Generate appropriate feedback message
        const totalAccounts = newAccounts.length + existingAccounts.length;
        
        if (existingAccounts.length === totalAccounts) {
          // All accounts already existed
          setWarningMessage(
            totalAccounts === 1
              ? "This account is already linked"
              : `All ${totalAccounts} account(s) are already linked`
          );
          setTimeout(() => setWarningMessage(null), 4000);
        } else if (existingAccounts.length > 0) {
          // Mix of new and existing
          setSuccessMessage(
            `Linked ${newAccounts.length} new account(s). ${existingAccounts.length} already linked.`
          );
          setTimeout(() => setSuccessMessage(null), 4000);
          onSuccess?.();
        } else {
          // All new accounts
          setSuccessMessage(`Successfully linked ${newAccounts.length} account(s)!`);
          setTimeout(() => setSuccessMessage(null), 3000);
          onSuccess?.();
        }
      } catch (err) {
        console.error("Error during Plaid flow:", err);
        setError("Failed to link bank account. Please try again.");
      } finally {
        setIsExchanging(false);
      }
    },
    [createFromPlaid, bulkCreateTransactions, onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: (err, metadata) => {
      console.log("Plaid Link exit metadata:", metadata);
      if (err) {
        console.error("Plaid Link exit error:", {
          error_type: err.error_type,
          error_code: err.error_code,
          error_message: err.error_message,
          display_message: err.display_message,
        });
        setError(err.display_message || err.error_message || "Bank connection failed");
      }
    },
  });

  const handleClick = () => {
    setIsLoading(true);
    open();
    // Reset loading state after a short delay (Plaid Link opens in modal)
    setTimeout(() => setIsLoading(false), 500);
  };

  // Don't render if not authenticated
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  // Show success message
  if (successMessage) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
        {successMessage}
      </Button>
    );
  }

  // Show warning message (accounts already linked)
  if (warningMessage) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
        {warningMessage}
      </Button>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-2">
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => window.location.reload()}
        >
          Retry Connection
        </Button>
        <p className="text-xs text-red-500 text-center">{error}</p>
      </div>
    );
  }

  // Show loading/exchanging state
  if (isExchanging) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Linking Account...
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={!ready || isLoading || !linkToken}
    >
      {isLoading || !linkToken ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : children ? null : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      {children || "Connect Bank Account"}
    </Button>
  );
}

// Alternative component for first-time users
export function PlaidLinkPrompt({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-full bg-stone-100 mb-4">
        <Link2 className="h-8 w-8 text-stone-600" />
      </div>
      <h3 className="font-semibold text-lg text-stone-900 mb-2">
        Link Your Bank Account
      </h3>
      <p className="text-sm text-stone-500 mb-4 max-w-xs">
        Connect your bank to automatically import transactions and start splitting bills with friends.
      </p>
      <PlaidLink onSuccess={onSuccess} />
    </div>
  );
}
