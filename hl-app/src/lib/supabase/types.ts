export interface DemoAccount {
  id: string
  user_id: string
  balance: number
  created_at: string
  updated_at: string
}

export interface Position {
  id: string
  account_id: string
  coin: string
  side: 'Long' | 'Short'
  size: number
  entry_price: number
  leverage: number
  margin_mode: 'cross' | 'isolated'
  liquidation_price: number
  fee: number
  created_at: string
}

export interface OrderHistory {
  id: string
  account_id: string
  coin: string
  side: 'Long' | 'Short'
  order_type: 'market' | 'limit'
  size: number
  price: number
  status: 'filled' | 'cancelled'
  fee: number
  created_at: string
}

export interface TradeHistory {
  id: string
  account_id: string
  coin: string
  side: 'Long' | 'Short'
  size: number
  entry_price: number
  close_price: number
  leverage: number
  pnl: number
  fee: number
  liquidated: boolean
  closed_at: string
}

export interface DemoFundRequest {
  id: string
  account_id: string
  amount: number
  status: 'completed' | 'pending'
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      demo_accounts: {
        Row: DemoAccount
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: Position
        Insert: {
          id?: string
          account_id: string
          coin: string
          side: 'Long' | 'Short'
          size: number
          entry_price: number
          leverage?: number
          margin_mode?: 'cross' | 'isolated'
          liquidation_price: number
          fee?: number
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          coin?: string
          side?: 'Long' | 'Short'
          size?: number
          entry_price?: number
          leverage?: number
          margin_mode?: 'cross' | 'isolated'
          liquidation_price?: number
          fee?: number
        }
        Relationships: []
      }
      order_history: {
        Row: OrderHistory
        Insert: {
          id?: string
          account_id: string
          coin: string
          side: 'Long' | 'Short'
          order_type: 'market' | 'limit'
          size: number
          price: number
          status?: 'filled' | 'cancelled'
          fee?: number
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          coin?: string
          side?: 'Long' | 'Short'
          order_type?: 'market' | 'limit'
          size?: number
          price?: number
          status?: 'filled' | 'cancelled'
          fee?: number
        }
        Relationships: []
      }
      trade_history: {
        Row: TradeHistory
        Insert: {
          id?: string
          account_id: string
          coin: string
          side: 'Long' | 'Short'
          size: number
          entry_price: number
          close_price: number
          leverage?: number
          pnl?: number
          fee?: number
          liquidated?: boolean
          closed_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          coin?: string
          side?: 'Long' | 'Short'
          size?: number
          entry_price?: number
          close_price?: number
          leverage?: number
          pnl?: number
          fee?: number
          liquidated?: boolean
        }
        Relationships: []
      }
      demo_fund_requests: {
        Row: DemoFundRequest
        Insert: {
          id?: string
          account_id: string
          amount: number
          status?: 'completed' | 'pending'
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          amount?: number
          status?: 'completed' | 'pending'
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
