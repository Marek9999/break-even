import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

// Validate required environment variables
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

if (!PLAID_CLIENT_ID) {
  throw new Error("Missing PLAID_CLIENT_ID environment variable");
}

if (!PLAID_SECRET) {
  throw new Error("Missing PLAID_SECRET environment variable");
}

// Configure Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
    },
  },
});

// Export configured Plaid client
export const plaidClient = new PlaidApi(configuration);

// Export environment for reference
export const plaidEnv = PLAID_ENV;
