export interface SampleAccount {
  id: string;
  name: string;
  institution: string;
  type: "bank" | "cash" | "credit";
  balanceFormatted: string;
  isCredit?: boolean;
}

export interface SampleTransaction {
  id: string;
  description: string;
  category: string;
  account: string;
  date: string;
  amountFormatted: string;
  type: "income" | "expense";
}

export const SAMPLE_FINANCIAL_DATA = {
  caption: "Sample data for illustration",
  netWorth: {
    formatted: "₹3,84,500",
    change: "+₹42,800 vs last month",
    positive: true,
  },
  monthlyInflow: {
    formatted: "₹95,000",
    label: "Income this month",
  },
  monthlyOutflow: {
    formatted: "₹38,200",
    label: "Expenses this month",
  },
  netCashFlow: {
    formatted: "+₹56,800",
    label: "Net savings retained",
    positive: true,
  },
  accounts: [
    {
      id: "acc_1",
      name: "HDFC Salary Account",
      institution: "HDFC Bank",
      type: "bank",
      balanceFormatted: "₹1,85,000",
    },
    {
      id: "acc_2",
      name: "ICICI Savings Account",
      institution: "ICICI Bank",
      type: "bank",
      balanceFormatted: "₹1,42,500",
    },
    {
      id: "acc_3",
      name: "Emergency Cash Stash",
      institution: "Physical Cash",
      type: "cash",
      balanceFormatted: "₹25,000",
    },
    {
      id: "acc_4",
      name: "OneCard Metal",
      institution: "FPL Technologies",
      type: "credit",
      balanceFormatted: "₹32,000",
      isCredit: true,
    },
  ] as SampleAccount[],
  recentTransactions: [
    {
      id: "tx_1",
      description: "Monthly Tech Salary",
      category: "Salary",
      account: "HDFC Salary",
      date: "01 Nov",
      amountFormatted: "+₹95,000",
      type: "income",
    },
    {
      id: "tx_2",
      description: "Apartment Rent",
      category: "Housing",
      account: "HDFC Salary",
      date: "02 Nov",
      amountFormatted: "-₹22,000",
      type: "expense",
    },
    {
      id: "tx_3",
      description: "Supermarket & Groceries",
      category: "Food & Groceries",
      account: "OneCard Metal",
      date: "03 Nov",
      amountFormatted: "-₹6,450",
      type: "expense",
    },
    {
      id: "tx_4",
      description: "Metro & Fuel Expense",
      category: "Transportation",
      account: "OneCard Metal",
      date: "03 Nov",
      amountFormatted: "-₹2,750",
      type: "expense",
    },
  ] as SampleTransaction[],
};

