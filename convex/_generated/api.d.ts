/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bankAccounts from "../bankAccounts.js";
import type * as friendships from "../friendships.js";
import type * as model_auth from "../model/auth.js";
import type * as model_bankAccounts from "../model/bankAccounts.js";
import type * as model_friendships from "../model/friendships.js";
import type * as model_splits from "../model/splits.js";
import type * as model_transactions from "../model/transactions.js";
import type * as model_users from "../model/users.js";
import type * as seed from "../seed.js";
import type * as splits from "../splits.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bankAccounts: typeof bankAccounts;
  friendships: typeof friendships;
  "model/auth": typeof model_auth;
  "model/bankAccounts": typeof model_bankAccounts;
  "model/friendships": typeof model_friendships;
  "model/splits": typeof model_splits;
  "model/transactions": typeof model_transactions;
  "model/users": typeof model_users;
  seed: typeof seed;
  splits: typeof splits;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
