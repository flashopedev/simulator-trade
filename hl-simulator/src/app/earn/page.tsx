"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";
import { NotificationContainer, notify } from "@/components/Notification";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatNumber } from "@/lib/utils";
import { Droplets, Gift, Coins, Clock, CheckCircle2, AlertCircle } from "lucide-react";

type EarnTab = "faucet" | "rewards" | "staking";

export default function EarnPage() {
  const { user, account, loading: authLoading, signOut, updateBalance, refetchAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<EarnTab>("faucet");
  const [claiming, setClaiming] = useState(false);
  const [lastClaim, setLastClaim] = useState<Date | null>(null);

  const handleClaimFaucet = async () => {
    if (!account || claiming) return;

    setClaiming(true);
    try {
      // Add 1000 USDC to balance
      await updateBalance(account.balance + 1000);
      await refetchAccount();
      setLastClaim(new Date());
      notify("+1,000 USDC claimed successfully!", "success");
    } catch (error) {
      notify("Failed to claim faucet. Please try again.", "error");
    } finally {
      setClaiming(false);
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

  const tabs: { key: EarnTab; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { key: "faucet", label: "Testnet Faucet", icon: <Droplets className="w-4 h-4" /> },
    { key: "rewards", label: "Rewards", icon: <Gift className="w-4 h-4" />, disabled: true },
    { key: "staking", label: "Staking", icon: <Coins className="w-4 h-4" />, disabled: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <NotificationContainer />
      <Navigation balance={account?.balance ?? 10000} isConnected={true} onSignOut={signOut} />

      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-t1">Earn</h1>
          <p className="text-[12px] text-t3 mt-1">Get testnet funds and earn rewards</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-brd">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-[12px] font-medium border-b-2 transition-colors",
                tab.disabled
                  ? "text-t4 border-transparent cursor-not-allowed"
                  : activeTab === tab.key
                    ? "text-t1 border-acc"
                    : "text-t3 border-transparent hover:text-t2"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.disabled && (
                <span className="text-[9px] px-1.5 py-0.5 bg-s3 rounded text-t4">Soon</span>
              )}
            </button>
          ))}
        </div>

        {/* Faucet Tab */}
        {activeTab === "faucet" && (
          <div className="space-y-6">
            {/* Current Balance Card */}
            <div className="bg-s1 border border-brd rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-acc/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-acc" />
                </div>
                <div>
                  <div className="text-[10px] text-t4 uppercase tracking-wide">Current Balance</div>
                  <div className="text-[24px] font-bold font-tabular text-t1">
                    ${formatNumber(account?.balance ?? 10000)}
                  </div>
                </div>
              </div>
            </div>

            {/* Faucet Card */}
            <div className="bg-s1 border border-brd rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blu/10 flex items-center justify-center flex-shrink-0">
                  <Droplets className="w-6 h-6 text-blu" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-semibold text-t1 mb-1">Testnet USDC Faucet</h3>
                  <p className="text-[12px] text-t3 mb-4">
                    Claim free testnet USDC to practice trading on the Hyperliquid Simulator.
                    This is simulated money with no real value.
                  </p>

                  <div className="bg-s2 border border-brd rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-t4 uppercase tracking-wide mb-1">Claim Amount</div>
                        <div className="text-[20px] font-bold text-acc font-tabular">+1,000 USDC</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-t4 uppercase tracking-wide mb-1">Cooldown</div>
                        <div className="text-[13px] font-medium text-t2">None</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleClaimFaucet}
                    disabled={claiming}
                    className={cn(
                      "w-full py-3.5 rounded-lg font-bold text-[14px] transition-all",
                      claiming
                        ? "bg-s3 text-t3 cursor-not-allowed"
                        : "bg-acc text-black hover:brightness-110"
                    )}
                  >
                    {claiming ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-t3 border-t-transparent rounded-full animate-spin" />
                        Claiming...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Droplets className="w-4 h-4" />
                        Claim 1,000 USDC
                      </span>
                    )}
                  </button>

                  {lastClaim && (
                    <div className="flex items-center gap-2 mt-3 text-[11px] text-grn">
                      <CheckCircle2 className="w-4 h-4" />
                      Last claimed: {lastClaim.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-s1 border border-brd rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-t4 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[12px] font-semibold text-t2 mb-1">About Testnet Funds</h4>
                  <p className="text-[11px] text-t3 leading-relaxed">
                    These funds are for simulation purposes only and have no real monetary value.
                    Use them to practice trading strategies, learn the platform, and test your skills
                    before trading with real assets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards Tab (Disabled) */}
        {activeTab === "rewards" && (
          <div className="bg-s1 border border-brd rounded-lg p-8 text-center">
            <Gift className="w-12 h-12 text-t4 mx-auto mb-4" />
            <h3 className="text-[15px] font-semibold text-t1 mb-2">Trading Rewards</h3>
            <p className="text-[12px] text-t3 max-w-md mx-auto">
              Earn rewards based on your trading volume and performance.
              This feature is coming soon to the simulator.
            </p>
          </div>
        )}

        {/* Staking Tab (Disabled) */}
        {activeTab === "staking" && (
          <div className="bg-s1 border border-brd rounded-lg p-8 text-center">
            <Coins className="w-12 h-12 text-t4 mx-auto mb-4" />
            <h3 className="text-[15px] font-semibold text-t1 mb-2">Staking</h3>
            <p className="text-[12px] text-t3 max-w-md mx-auto">
              Stake your assets to earn passive income.
              This feature is coming soon to the simulator.
            </p>
          </div>
        )}
      </div>

      <Footer isConnected={true} />
    </div>
  );
}
