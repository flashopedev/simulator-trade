export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      demo_accounts: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      positions: {
        Row: {
          id: string;
          account_id: string;
          coin: string;
          side: "Long" | "Short";
          size: number;
          entry_price: number;
          leverage: number;
          margin_mode: "cross" | "isolated";
          liquidation_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          coin: string;
          side: "Long" | "Short";
          size: number;
          entry_price: number;
          leverage: number;
          margin_mode?: "cross" | "isolated";
          liquidation_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          coin?: string;
          side?: "Long" | "Short";
          size?: number;
          entry_price?: number;
          leverage?: number;
          margin_mode?: "cross" | "isolated";
          liquidation_price?: number;
          created_at?: string;
        };
      };
      order_history: {
        Row: {
          id: string;
          account_id: string;
          coin: string;
          side: "Long" | "Short";
          order_type: "market" | "limit";
          size: number;
          price: number;
          status: "filled" | "cancelled" | "pending";
          fee: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          coin: string;
          side: "Long" | "Short";
          order_type: "market" | "limit";
          size: number;
          price: number;
          status?: "filled" | "cancelled" | "pending";
          fee?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          coin?: string;
          side?: "Long" | "Short";
          order_type?: "market" | "limit";
          size?: number;
          price?: number;
          status?: "filled" | "cancelled" | "pending";
          fee?: number;
          created_at?: string;
        };
      };
      trade_history: {
        Row: {
          id: string;
          account_id: string;
          position_id: string | null;
          coin: string;
          side: "Long" | "Short";
          size: number;
          entry_price: number;
          exit_price: number;
          pnl: number;
          leverage: number;
          liquidated: boolean;
          closed_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          position_id?: string | null;
          coin: string;
          side: "Long" | "Short";
          size: number;
          entry_price: number;
          exit_price: number;
          pnl: number;
          leverage: number;
          liquidated?: boolean;
          closed_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          position_id?: string | null;
          coin?: string;
          side?: "Long" | "Short";
          size?: number;
          entry_price?: number;
          exit_price?: number;
          pnl?: number;
          leverage?: number;
          liquidated?: boolean;
          closed_at?: string;
        };
      };
      demo_fund_requests: {
        Row: {
          id: string;
          account_id: string;
          amount: number;
          status: "pending" | "completed" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          amount: number;
          status?: "pending" | "completed" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          amount?: number;
          status?: "pending" | "completed" | "rejected";
          created_at?: string;
        };
      };
    };
  };
};

export type Position = Database["public"]["Tables"]["positions"]["Row"];
export type OrderHistory = Database["public"]["Tables"]["order_history"]["Row"];
export type TradeHistory = Database["public"]["Tables"]["trade_history"]["Row"];
export type DemoAccount = Database["public"]["Tables"]["demo_accounts"]["Row"];
export type FundRequest = Database["public"]["Tables"]["demo_fund_requests"]["Row"];
