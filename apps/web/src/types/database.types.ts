export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'user' | 'admin' | 'banned'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'user' | 'admin' | 'banned'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'user' | 'admin' | 'banned'
          created_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          id: string
          seller_id: string
          title: string
          description: string | null
          price_amount: number
          currency: string
          images: string[]
          status: 'active' | 'sold' | 'hidden'
          created_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          description?: string | null
          price_amount: number
          currency?: string
          images?: string[]
          status?: 'active' | 'sold' | 'hidden'
          created_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          description?: string | null
          price_amount?: number
          currency?: string
          images?: string[]
          status?: 'active' | 'sold' | 'hidden'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          amount: number
          currency: string
          stripe_payment_intent_id: string | null
          status: 'requires_payment' | 'paid' | 'shipped' | 'refunded'
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_id: string
          amount: number
          currency: string
          stripe_payment_intent_id?: string | null
          status?: 'requires_payment' | 'paid' | 'shipped' | 'refunded'
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_id?: string
          amount?: number
          currency?: string
          stripe_payment_intent_id?: string | null
          status?: 'requires_payment' | 'paid' | 'shipped' | 'refunded'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }
      shipping_addresses: {
        Row: {
          id: string
          order_id: string
          buyer_id: string
          name: string
          line1: string
          line2: string | null
          postal_code: string
          city: string
          country: string
        }
        Insert: {
          id?: string
          order_id: string
          buyer_id: string
          name: string
          line1: string
          line2?: string | null
          postal_code: string
          city: string
          country: string
        }
        Update: {
          id?: string
          order_id?: string
          buyer_id?: string
          name?: string
          line1?: string
          line2?: string | null
          postal_code?: string
          city?: string
          country?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_addresses_buyer_id_fkey"
            columns: ["buyer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_addresses_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      connect_accounts: {
        Row: {
          user_id: string
          stripe_account_id: string
          charges_enabled: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          stripe_account_id: string
          charges_enabled?: boolean
          updated_at?: string
        }
        Update: {
          user_id?: string
          stripe_account_id?: string
          charges_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connect_accounts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      bans: {
        Row: {
          id: string
          user_id: string
          reason: string
          banned_by: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reason: string
          banned_by: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reason?: string
          banned_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bans_banned_by_fkey"
            columns: ["banned_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bans_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      v_sales_overview: {
        Row: {
          sale_date: string | null
          total_orders: number | null
          total_amount: number | null
          avg_amount: number | null
        }
        Relationships: []
      }
      v_top_sellers: {
        Row: {
          seller_id: string | null
          seller_email: string | null
          total_orders: number | null
          total_sales: number | null
          avg_sale_amount: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'user' | 'admin' | 'banned'
      listing_status: 'active' | 'sold' | 'hidden'
      order_status: 'requires_payment' | 'paid' | 'shipped' | 'refunded'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
