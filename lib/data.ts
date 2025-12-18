// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string; // last 4 digits only
  accountType: "checking" | "savings" | "credit";
  balance: number;
  color: string;
  logo?: string;
}

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: "food" | "shopping" | "utilities" | "entertainment" | "travel" | "groceries";
  description: string;
  bankAccountId: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  assignedTo: string[]; // array of contact IDs
}

export interface Participant {
  contactId: string;
  amount: number;
  percentage?: number;
  items?: string[]; // array of item IDs for itemized splits
}

export type SplitMethod = "equal" | "percentage" | "custom" | "itemized";

export interface Split {
  id: string;
  transactionId: string;
  method: SplitMethod;
  participants: Participant[];
  items: ReceiptItem[];
  receiptImage?: string; // base64 or URL
  createdAt: string;
}

// Saved split with full transaction and contact details for history
export interface SavedSplit {
  id: string;
  transaction: Transaction;
  method: SplitMethod;
  participants: Array<{
    contact: Contact;
    amount: number;
    percentage: number;
  }>;
  items: ReceiptItem[];
  receiptImage?: string;
  createdAt: string;
  status: "pending" | "settled";
}

// Avatar colors for contacts
const avatarColors = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
];

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Dummy Contacts
export const dummyContacts: Contact[] = [
  {
    id: "c1",
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    initials: "AJ",
    color: avatarColors[0],
  },
  {
    id: "c2",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    initials: "SC",
    color: avatarColors[1],
  },
  {
    id: "c3",
    name: "Mike Williams",
    email: "mike.w@email.com",
    initials: "MW",
    color: avatarColors[2],
  },
  {
    id: "c4",
    name: "Emma Davis",
    email: "emma.davis@email.com",
    initials: "ED",
    color: avatarColors[3],
  },
  {
    id: "c5",
    name: "James Wilson",
    email: "james.wilson@email.com",
    initials: "JW",
    color: avatarColors[4],
  },
  {
    id: "c6",
    name: "Olivia Brown",
    email: "olivia.b@email.com",
    initials: "OB",
    color: avatarColors[5],
  },
  {
    id: "c7",
    name: "Daniel Lee",
    email: "daniel.lee@email.com",
    initials: "DL",
    color: avatarColors[6],
  },
  {
    id: "c8",
    name: "Sophie Martinez",
    email: "sophie.m@email.com",
    initials: "SM",
    color: avatarColors[7],
  },
  {
    id: "c9",
    name: "Ryan Taylor",
    email: "ryan.taylor@email.com",
    initials: "RT",
    color: avatarColors[8],
  },
  {
    id: "c10",
    name: "Chloe Anderson",
    email: "chloe.a@email.com",
    initials: "CA",
    color: avatarColors[9],
  },
];

// Dummy User
export const dummyUser: User = {
  id: "user-1",
  name: "Jordan Smith",
  email: "jordan.smith@email.com",
  phone: "+1 (555) 123-4567",
};

// Dummy Bank Accounts
export const dummyBankAccounts: BankAccount[] = [
  {
    id: "bank-1",
    bankName: "Chase",
    accountNumber: "4892",
    accountType: "checking",
    balance: 4892.50,
    color: "bg-blue-600",
  },
  {
    id: "bank-2",
    bankName: "Bank of America",
    accountNumber: "7231",
    accountType: "savings",
    balance: 12450.00,
    color: "bg-red-600",
  },
];

// Dummy Transactions
export const dummyTransactions: Transaction[] = [
  {
    id: "t1",
    merchant: "The Italian Kitchen",
    amount: 156.80,
    date: "2024-12-15",
    category: "food",
    description: "Dinner with friends",
    bankAccountId: "bank-1",
  },
  {
    id: "t2",
    merchant: "Costco Wholesale",
    amount: 234.56,
    date: "2024-12-14",
    category: "groceries",
    description: "Weekly groceries",
    bankAccountId: "bank-1",
  },
  {
    id: "t3",
    merchant: "Netflix",
    amount: 15.99,
    date: "2024-12-13",
    category: "entertainment",
    description: "Monthly subscription",
    bankAccountId: "bank-2",
  },
  {
    id: "t4",
    merchant: "Shell Gas Station",
    amount: 65.40,
    date: "2024-12-13",
    category: "travel",
    description: "Road trip fuel",
    bankAccountId: "bank-1",
  },
  {
    id: "t5",
    merchant: "Best Buy",
    amount: 899.99,
    date: "2024-12-12",
    category: "shopping",
    description: "New TV for living room",
    bankAccountId: "bank-2",
  },
  {
    id: "t6",
    merchant: "Sushi Palace",
    amount: 89.50,
    date: "2024-12-11",
    category: "food",
    description: "Team lunch",
    bankAccountId: "bank-1",
  },
  {
    id: "t7",
    merchant: "Electric Company",
    amount: 142.30,
    date: "2024-12-10",
    category: "utilities",
    description: "Monthly electricity bill",
    bankAccountId: "bank-1",
  },
  {
    id: "t8",
    merchant: "Airbnb",
    amount: 450.00,
    date: "2024-12-09",
    category: "travel",
    description: "Weekend getaway accommodation",
    bankAccountId: "bank-2",
  },
  {
    id: "t9",
    merchant: "Whole Foods Market",
    amount: 178.23,
    date: "2024-12-08",
    category: "groceries",
    description: "Grocery shopping",
    bankAccountId: "bank-1",
  },
  {
    id: "t10",
    merchant: "AMC Theatres",
    amount: 48.00,
    date: "2024-12-07",
    category: "entertainment",
    description: "Movie night tickets",
    bankAccountId: "bank-1",
  },
  {
    id: "t11",
    merchant: "Target",
    amount: 156.78,
    date: "2024-12-06",
    category: "shopping",
    description: "Household items",
    bankAccountId: "bank-2",
  },
  {
    id: "t12",
    merchant: "Uber Eats",
    amount: 42.35,
    date: "2024-12-05",
    category: "food",
    description: "Late night delivery",
    bankAccountId: "bank-1",
  },
  {
    id: "t13",
    merchant: "Water Utility Co",
    amount: 45.00,
    date: "2024-12-04",
    category: "utilities",
    description: "Water bill",
    bankAccountId: "bank-1",
  },
  {
    id: "t14",
    merchant: "Cheesecake Factory",
    amount: 198.45,
    date: "2024-12-03",
    category: "food",
    description: "Birthday dinner",
    bankAccountId: "bank-2",
  },
  {
    id: "t15",
    merchant: "Amazon",
    amount: 324.99,
    date: "2024-12-02",
    category: "shopping",
    description: "Kitchen appliances",
    bankAccountId: "bank-1",
  },
  {
    id: "t16",
    merchant: "Spotify",
    amount: 10.99,
    date: "2024-12-01",
    category: "entertainment",
    description: "Music subscription",
    bankAccountId: "bank-2",
  },
  {
    id: "t17",
    merchant: "Delta Airlines",
    amount: 567.00,
    date: "2024-11-30",
    category: "travel",
    description: "Flight tickets",
    bankAccountId: "bank-2",
  },
  {
    id: "t18",
    merchant: "Trader Joe's",
    amount: 89.34,
    date: "2024-11-29",
    category: "groceries",
    description: "Grocery run",
    bankAccountId: "bank-1",
  },
];

// Category configuration for styling
export const categoryConfig: Record<
  Transaction["category"],
  { label: string; color: string; bgColor: string }
> = {
  food: { label: "Food & Dining", color: "text-orange-600", bgColor: "bg-orange-100" },
  shopping: { label: "Shopping", color: "text-blue-600", bgColor: "bg-blue-100" },
  utilities: { label: "Utilities", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  entertainment: { label: "Entertainment", color: "text-purple-600", bgColor: "bg-purple-100" },
  travel: { label: "Travel", color: "text-emerald-600", bgColor: "bg-emerald-100" },
  groceries: { label: "Groceries", color: "text-green-600", bgColor: "bg-green-100" },
};

// Helper functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getContactById(id: string): Contact | undefined {
  return dummyContacts.find((c) => c.id === id);
}

export function getTransactionById(id: string): Transaction | undefined {
  return dummyTransactions.find((t) => t.id === id);
}

export function getBankAccountById(id: string): BankAccount | undefined {
  return dummyBankAccounts.find((b) => b.id === id);
}

// Helper to generate initials from name
export function generateInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Helper to generate a random avatar color
export function generateAvatarColor(): string {
  const colors = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

