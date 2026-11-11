/**
 * Coinsight Database Types
 *
 * Source: SQL Schema (supabase/migrations/20261103100000_initial_schema.sql,
 *                   supabase/migrations/20261103100100_functions_triggers_views.sql,
 *                   supabase/migrations/20261103100200_rls_policies.sql)
 *
 * IMPORTANT NOTICE:
 * These types were manually constructed to mirror the reviewed PostgreSQL schema.
 * They have NOT been generated via `supabase gen types` against a live database,
 * as per the project requirement to avoid local Docker / Supabase CLI environments.
 *
 * PRECISION NOTE:
 * - Table columns (`opening_balance`, `credit_limit`, `amount`) are stored as BIGINT
 *   (integer minor currency units up to 10^12) and map to TypeScript `number`.
 * - Aggregate calculations in `account_balances` view are calculated in PostgreSQL `NUMERIC`
 *   and cast explicitly to `TEXT` in the view to prevent JavaScript double-precision
 *   floating point loss during PostgREST JSON serialization. They are typed as `string`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountType = 'cash' | 'bank' | 'wallet' | 'credit_card';
export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'ai' | 'receipt';
export type MonthlyIncomeRange =
  | 'below_20k'
  | '20k_40k'
  | '40k_60k'
  | '60k_100k'
  | 'above_100k'
  | 'prefer_not_to_say';
export type FinancialGoalKey =
  | 'track_expenses'
  | 'build_savings'
  | 'control_spending'
  | 'manage_subscriptions'
  | 'understand_spending'
  | 'track_debt'
  | 'plan_budgets';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          currency: string;
          timezone: string;
          country_code: string | null;
          monthly_income_range: MonthlyIncomeRange | null;
          salary_credit_day: number | null;
          onboarding_completed: boolean;
          onboarding_completed_at: string | null;
          onboarding_step: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          timezone?: string;
          country_code?: string | null;
          monthly_income_range?: MonthlyIncomeRange | null;
          salary_credit_day?: number | null;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          onboarding_step?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          timezone?: string;
          country_code?: string | null;
          monthly_income_range?: MonthlyIncomeRange | null;
          salary_credit_day?: number | null;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          onboarding_step?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      user_financial_goals: {
        Row: {
          id: string;
          user_id: string;
          goal_key: FinancialGoalKey;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_key: FinancialGoalKey;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_key?: FinancialGoalKey;
          created_at?: string;
        };
        Relationships: [];
      };

      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          account_type: AccountType;
          currency: string;
          opening_balance: number;
          credit_limit: number | null;
          institution_name: string | null;
          institution: string | null;
          notes: string | null;
          account_number_last_four: string | null;
          color: string | null;
          icon: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          account_type: AccountType;
          currency?: string;
          opening_balance?: number;
          credit_limit?: number | null;
          institution_name?: string | null;
          institution?: string | null;
          notes?: string | null;
          account_number_last_four?: string | null;
          color?: string | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          account_type?: AccountType;
          currency?: string;
          opening_balance?: number;
          credit_limit?: number | null;
          institution_name?: string | null;
          institution?: string | null;
          notes?: string | null;
          account_number_last_four?: string | null;
          color?: string | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'accounts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: CategoryType;
          icon: string | null;
          color: string | null;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          type: CategoryType;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: CategoryType;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          type: TransactionType;
          amount: number;
          description: string | null;
          merchant: string | null;
          transaction_date: string;
          notes: string | null;
          source: TransactionSource;
          receipt_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          account_id: string;
          category_id?: string | null;
          type: TransactionType;
          amount: number;
          description?: string | null;
          merchant?: string | null;
          transaction_date?: string;
          notes?: string | null;
          source?: TransactionSource;
          receipt_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          type?: TransactionType;
          amount?: number;
          description?: string | null;
          merchant?: string | null;
          transaction_date?: string;
          notes?: string | null;
          source?: TransactionSource;
          receipt_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_transactions_account_ownership';
            columns: ['account_id', 'user_id'];
            referencedRelation: 'accounts';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'fk_transactions_category_ownership_type';
            columns: ['category_id', 'user_id', 'type'];
            referencedRelation: 'categories';
            referencedColumns: ['id', 'user_id', 'type'];
          },
        ];
      };

      transfers: {
        Row: {
          id: string;
          user_id: string;
          from_account_id: string;
          to_account_id: string;
          currency: string;
          amount: number;
          transfer_date: string;
          description: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          from_account_id: string;
          to_account_id: string;
          currency: string;
          amount: number;
          transfer_date?: string;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_account_id?: string;
          to_account_id?: string;
          currency?: string;
          amount?: number;
          transfer_date?: string;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_transfers_from_account_currency';
            columns: ['from_account_id', 'user_id', 'currency'];
            referencedRelation: 'accounts';
            referencedColumns: ['id', 'user_id', 'currency'];
          },
          {
            foreignKeyName: 'fk_transfers_to_account_currency';
            columns: ['to_account_id', 'user_id', 'currency'];
            referencedRelation: 'accounts';
            referencedColumns: ['id', 'user_id', 'currency'];
          },
        ];
      };

      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          period_start: string;
          period_end: string;
          category_type: 'expense';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          category_id: string;
          amount: number;
          period_start: string;
          period_end: string;
          category_type?: 'expense';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          period_start?: string;
          period_end?: string;
          category_type?: 'expense';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_budgets_category_ownership';
            columns: ['category_id', 'user_id', 'category_type'];
            referencedRelation: 'categories';
            referencedColumns: ['id', 'user_id', 'type'];
          },
        ];
      };
    };

    Views: {
      account_balances: {
        Row: {
          account_id: string;
          user_id: string;
          account_name: string;
          account_type: AccountType;
          currency: string;
          is_active: boolean;
          opening_balance: number;
          current_balance: string;
          total_income: string;
          total_expense: string;
          total_outgoing_transfers: string;
          total_incoming_transfers: string;
          institution: string | null;
          notes: string | null;
          credit_limit: number | null;
          has_activity: boolean;
          transaction_count: number;
          created_at: string;
          updated_at: string;
        };
        Relationships: [
          {
            foreignKeyName: 'account_balances_account_id_fkey';
            columns: ['account_id'];
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
        ];
      };
      net_worth_summary: {
        Row: {
          user_id: string;
          total_assets: string;
          total_liabilities: string;
          net_worth: string;
          active_accounts_count: number;
        };
        Relationships: [];
      };
    };

    Functions: {
      init_default_categories: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      complete_onboarding: {
        Args: {
          p_goal_keys?: string[];
        };
        Returns: void;
      };
    };

    Enums: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type UserFinancialGoal = Database['public']['Tables']['user_financial_goals']['Row'];
export type UserFinancialGoalInsert = Database['public']['Tables']['user_financial_goals']['Insert'];


export type AccountBalance = Database['public']['Views']['account_balances']['Row'];
export type NetWorthSummary = Database['public']['Views']['net_worth_summary']['Row'];
export type Account = Database['public']['Tables']['accounts']['Row'];
export type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
export type AccountUpdate = Database['public']['Tables']['accounts']['Update'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];
export type Budget = Database['public']['Tables']['budgets']['Row'];
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

