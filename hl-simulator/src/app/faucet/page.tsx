"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { AuthForm } from "@/components/AuthForm";
import { NotificationContainer, notify } from "@/components/Notification";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { formatNumber, cn } from "@/lib/utils";
import type { FundRequest } from "@/lib/supabase/types";

const AMOUNTS = [1000, 5000, 10000, 50000];

export default function FaucetPage() {
  const { user, account, loading: authLoading, signOut, updateBalance, refetchAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(10000);
  const [requests, setRequests] = useState<FundRequest[]>([]);

  const supabase = createClient();

  // Load request history
  useEffect(() => {
    if (!account?.id) return;

    const loadRequests = async () => {
      const { data } = await supabase
        .from("demo_fund_requests")
        .select("*")
        .eq("account_id", account.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setRequests(data);
    };

    loadRequests();
  }, [account?.id, supabase]);

  const handleRequest = async () => {
    if (!account?.id) return;

    setLoading(true);
    try {
      // Add funds to balance
      const newBalance = (account.balance || 0) + selectedAmount;

      // Update balance
      const { error: balanceError } = await supabase
        .from("demo_accounts")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", account.id);

      if (balanceError) throw balanceError;

      // Record the request
      const { data: request, error: requestError } = await supabase
        .from("demo_fund_requests")
        .insert({
          account_id: account.id,
          amount: selectedAmount,
          status: "completed",
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Update local state
      updateBalance(newBalance);
      if (request) {
        setRequests((prev) => [request, ...prev]);
      }

      notify(`+${formatNumber(selectedAmount)} USDC added to your account!`, "success");
    } catch (error) {
      console.error("Failed to request funds:", error);
      notify("Failed to add funds", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!account?.id) return;

    setLoading(true);
    try {
      // Reset to 10,000
      const { error } = await supabase
        .from("demo_accounts")
        .update({ balance: 10000, updated_at: new Date().toISOString() })
        .eq("id", account.id);

      if (error) throw error;

      updateBalance(10000);
      notify("Balance reset to 10,000 USDC", "info");
    } catch (error) {
      console.error("Failed to reset balance:", error);
      notify("Failed to reset balance", "error");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-brd border-t-acc rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg pb-16 md:pb-0">
      <NotificationContainer />
      <Navigation
        balance={account?.balance ?? 10000}
        isConnected={true}
        onSignOut={signOut}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Faucet Card */}
          <div className="bg-s2 border border-brd rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-acc to-grn flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-black"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold">Demo Faucet</h1>
                <p className="text-[11px] text-t3">
                  Request demo USDC for paper trading
                </p>
              </div>
            </div>

            {/* Current balance */}
            <div className="bg-s1 border border-brd rounded-lg p-4 mb-6">
              <div className="text-[10px] text-t4 font-medium mb-1">
                Current Balance
              </div>
              <div className="text-2xl font-bold text-acc font-tabular">
                ${formatNumber(account?.balance ?? 10000)}
              </div>
            </div>

            {/* Amount selection */}
            <div className="mb-6">
              <div className="text-[11px] text-t3 font-medium mb-2">
                Select Amount
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={cn(
                      "py-3 rounded-lg font-bold text-sm transition-colors border",
                      selectedAmount === amount
                        ? "bg-acc/10 border-acc text-acc"
                        : "bg-s3 border-brd text-t2 hover:border-t4"
                    )}
                  >
                    ${formatNumber(amount, 0)}
                  </button>
                ))}
              </div>
            </div>

            {/* Request button */}
            <button
              onClick={handleRequest}
              disabled={loading}
              className="w-full py-4 bg-acc text-black font-bold rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? "Processing..." : `Request $${formatNumber(selectedAmount, 0)} USDC`}
            </button>

            {/* Reset button */}
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-3 bg-s3 border border-brd text-t2 font-semibold rounded-lg text-[11px] hover:border-t4 transition-colors disabled:opacity-50"
            >
              Reset Balance to $10,000
            </button>
          </div>

          {/* Request History */}
          {requests.length > 0 && (
            <div className="mt-6 bg-s2 border border-brd rounded-lg p-4">
              <h2 className="text-sm font-semibold mb-3">Recent Requests</h2>
              <div className="space-y-2">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-2 border-b border-brd last:border-0"
                  >
                    <div>
                      <span className="text-grn font-semibold text-[11px]">
                        +${formatNumber(req.amount, 0)}
                      </span>
                      <span className="text-t4 text-[10px] ml-2">USDC</span>
                    </div>
                    <span className="text-[10px] text-t4">
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <p className="text-center text-[10px] text-t4 mt-4">
            Demo funds have no real value and are for practice only
          </p>
        </div>
      </div>
    </div>
  );
}
