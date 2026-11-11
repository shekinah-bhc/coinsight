export interface SampleAccount {
  id: string;
  name: string;
  institution: string;
  type: "bank" | "cash" | "credit";
  balance: number;
  balanceFormatted: string;
  isCredit?: boolean;
}

export interface SampleTransaction {
  id: string;
  description: string;
  category: string;
  account: string;
  date: string;
  amount: number;
  amountFormatted: string;
  type: "income" | "expense";
}

export const SAMPLE_FINANCIAL_DATA = {
  caption: "Sample data for illustration",
  netWorth: {
    amount: 384500,
    formatted: "₹3,84,500",
    changeAmount: 42800,
    changeFormatted: "+₹42,800",
    change: "+₹42,800 vs last month",
    positive: true,
    // Six months of closing net worth, oldest first.
    trend: [298000, 305400, 301900, 322800, 341700, 384500],
    trendMonths: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
  },
  monthlyInflow: {
    amount: 95000,
    formatted: "₹95,000",
    label: "Income this month",
  },
  monthlyOutflow: {
    amount: 38200,
    formatted: "₹38,200",
    label: "Expenses this month",
  },
  netCashFlow: {
    amount: 56800,
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
      balance: 249000,
      balanceFormatted: "₹2,49,000",
    },
    {
      id: "acc_2",
      name: "ICICI Savings Account",
      institution: "ICICI Bank",
      type: "bank",
      balance: 142500,
      balanceFormatted: "₹1,42,500",
    },
    {
      id: "acc_3",
      name: "Emergency Cash Stash",
      institution: "Physical Cash",
      type: "cash",
      balance: 25000,
      balanceFormatted: "₹25,000",
    },
    {
      id: "acc_4",
      name: "OneCard Metal",
      institution: "FPL Technologies",
      type: "credit",
      balance: 32000,
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
      amount: 95000,
      amountFormatted: "+₹95,000",
      type: "income",
    },
    {
      id: "tx_2",
      description: "Apartment Rent",
      category: "Housing",
      account: "HDFC Salary",
      date: "02 Nov",
      amount: -22000,
      amountFormatted: "-₹22,000",
      type: "expense",
    },
    {
      id: "tx_3",
      description: "Supermarket & Groceries",
      category: "Food & Groceries",
      account: "OneCard Metal",
      date: "03 Nov",
      amount: -6450,
      amountFormatted: "-₹6,450",
      type: "expense",
    },
    {
      id: "tx_4",
      description: "Metro & Fuel Expense",
      category: "Transportation",
      account: "OneCard Metal",
      date: "03 Nov",
      amount: -2750,
      amountFormatted: "-₹2,750",
      type: "expense",
    },
    {
      id: "tx_5",
      description: "Electricity & Broadband",
      category: "Utilities",
      account: "HDFC Salary",
      date: "05 Nov",
      amount: -4000,
      amountFormatted: "-₹4,000",
      type: "expense",
    },
    {
      id: "tx_6",
      description: "Pharmacy & Health",
      category: "Health",
      account: "OneCard Metal",
      date: "06 Nov",
      amount: -3000,
      amountFormatted: "-₹3,000",
      type: "expense",
    },
  ] as SampleTransaction[],
};
