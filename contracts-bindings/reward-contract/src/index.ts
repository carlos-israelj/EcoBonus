import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export const Errors = {
  1: {message:"PoolNotFound"},
  2: {message:"PoolAlreadyExists"},
  3: {message:"PoolInactive"},
  4: {message:"InsufficientPoolBalance"},
  10: {message:"ClaimNotFound"},
  11: {message:"ClaimAlreadyProcessed"},
  12: {message:"ClaimExpired"},
  13: {message:"InvalidProofUri"},
  20: {message:"InvalidAmount"},
  21: {message:"InvalidValidator"},
  22: {message:"ClaimNotPending"},
  30: {message:"Unauthorized"},
  31: {message:"NotSponsor"},
  32: {message:"NotValidator"},
  40: {message:"TokenTransferFailed"},
  41: {message:"InvalidTokenAddress"}
}


/**
 * Claim submitted by a user
 */
export interface Claim {
  amount: i128;
  claimer: string;
  id: u64;
  mission_id: u64;
  proof_uri: string;
  status: ClaimStatus;
  submitted_at: u64;
  validated_at: Option<u64>;
  validator: Option<string>;
}


/**
 * Reward pool managed by a sponsor
 */
export interface RewardPool {
  available_balance: i128;
  is_active: boolean;
  sponsor: string;
  token_address: string;
  total_distributed: i128;
  total_funded: i128;
}

/**
 * Status of a claim
 */
export type ClaimStatus = {tag: "Pending", values: void} | {tag: "Approved", values: void} | {tag: "Rejected", values: void} | {tag: "Disputed", values: void};


/**
 * Validation result from AI oracle
 */
export interface ValidationResult {
  category: string;
  confidence: u32;
  estimated_weight_kg: u32;
  valid: boolean;
}

export interface Client {
  /**
   * Construct and simulate a get_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get pool stats
   */
  get_pool: ({sponsor}: {sponsor: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<RewardPool>>>

  /**
   * Construct and simulate a fund_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fund an existing pool
   */
  fund_pool: ({sponsor, amount}: {sponsor: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get claim details
   */
  get_claim: ({claim_id}: {claim_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Claim>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the contract
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a create_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new reward pool
   */
  create_pool: ({sponsor, token_address, initial_amount}: {sponsor: string, token_address: string, initial_amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a is_validator transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if address is a validator
   */
  is_validator: ({address}: {address: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a submit_claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit a claim for validation
   */
  submit_claim: ({mission_id, claimer, amount, proof_uri, sponsor}: {mission_id: u64, claimer: string, amount: i128, proof_uri: string, sponsor: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a add_validator transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add a validator (admin only)
   */
  add_validator: ({admin, validator}: {admin: string, validator: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a withdraw_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw funds from pool (sponsor only)
   */
  withdraw_pool: ({sponsor, amount}: {sponsor: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a validate_claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Validate a claim (validator or admin only)
   */
  validate_claim: ({claim_id, validator, approved}: {claim_id: u64, validator: string, approved: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a deactivate_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deactivate pool (sponsor or admin only)
   */
  deactivate_pool: ({sponsor, caller}: {sponsor: string, caller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_user_claims transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get user's claims
   */
  get_user_claims: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a remove_validator transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Remove a validator (admin only)
   */
  remove_validator: ({admin, validator}: {admin: string, validator: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a distribute_reward transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Distribute reward after validation (automatic after approval)
   */
  distribute_reward: ({claim_id}: {claim_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_sponsor_claims transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get sponsor's claims
   */
  get_sponsor_claims: ({sponsor}: {sponsor: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAA5HZXQgcG9vbCBzdGF0cwAAAAAACGdldF9wb29sAAAAAQAAAAAAAAAHc3BvbnNvcgAAAAATAAAAAQAAA+kAAAfQAAAAClJld2FyZFBvb2wAAAAAAAM=",
        "AAAAAAAAABVGdW5kIGFuIGV4aXN0aW5nIHBvb2wAAAAAAAAJZnVuZF9wb29sAAAAAAAAAgAAAAAAAAAHc3BvbnNvcgAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAABFHZXQgY2xhaW0gZGV0YWlscwAAAAAAAAlnZXRfY2xhaW0AAAAAAAABAAAAAAAAAAhjbGFpbV9pZAAAAAYAAAABAAAD6QAAB9AAAAAFQ2xhaW0AAAAAAAAD",
        "AAAAAAAAABdJbml0aWFsaXplIHRoZSBjb250cmFjdAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAABhDcmVhdGUgYSBuZXcgcmV3YXJkIHBvb2wAAAALY3JlYXRlX3Bvb2wAAAAAAwAAAAAAAAAHc3BvbnNvcgAAAAATAAAAAAAAAA10b2tlbl9hZGRyZXNzAAAAAAAAEwAAAAAAAAAOaW5pdGlhbF9hbW91bnQAAAAAAAsAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAB9DaGVjayBpZiBhZGRyZXNzIGlzIGEgdmFsaWRhdG9yAAAAAAxpc192YWxpZGF0b3IAAAABAAAAAAAAAAdhZGRyZXNzAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAB1TdWJtaXQgYSBjbGFpbSBmb3IgdmFsaWRhdGlvbgAAAAAAAAxzdWJtaXRfY2xhaW0AAAAFAAAAAAAAAAptaXNzaW9uX2lkAAAAAAAGAAAAAAAAAAdjbGFpbWVyAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAJcHJvb2ZfdXJpAAAAAAAAEAAAAAAAAAAHc3BvbnNvcgAAAAATAAAAAQAAA+kAAAAGAAAAAw==",
        "AAAAAAAAABxBZGQgYSB2YWxpZGF0b3IgKGFkbWluIG9ubHkpAAAADWFkZF92YWxpZGF0b3IAAAAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACXZhbGlkYXRvcgAAAAAAABMAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAACdXaXRoZHJhdyBmdW5kcyBmcm9tIHBvb2wgKHNwb25zb3Igb25seSkAAAAADXdpdGhkcmF3X3Bvb2wAAAAAAAACAAAAAAAAAAdzcG9uc29yAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAACpWYWxpZGF0ZSBhIGNsYWltICh2YWxpZGF0b3Igb3IgYWRtaW4gb25seSkAAAAAAA52YWxpZGF0ZV9jbGFpbQAAAAAAAwAAAAAAAAAIY2xhaW1faWQAAAAGAAAAAAAAAAl2YWxpZGF0b3IAAAAAAAATAAAAAAAAAAhhcHByb3ZlZAAAAAEAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAACdEZWFjdGl2YXRlIHBvb2wgKHNwb25zb3Igb3IgYWRtaW4gb25seSkAAAAAD2RlYWN0aXZhdGVfcG9vbAAAAAACAAAAAAAAAAdzcG9uc29yAAAAABMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAABFHZXQgdXNlcidzIGNsYWltcwAAAAAAAA9nZXRfdXNlcl9jbGFpbXMAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6gAAAAY=",
        "AAAAAAAAAB9SZW1vdmUgYSB2YWxpZGF0b3IgKGFkbWluIG9ubHkpAAAAABByZW1vdmVfdmFsaWRhdG9yAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAl2YWxpZGF0b3IAAAAAAAATAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAD1EaXN0cmlidXRlIHJld2FyZCBhZnRlciB2YWxpZGF0aW9uIChhdXRvbWF0aWMgYWZ0ZXIgYXBwcm92YWwpAAAAAAAAEWRpc3RyaWJ1dGVfcmV3YXJkAAAAAAAAAQAAAAAAAAAIY2xhaW1faWQAAAAGAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAABRHZXQgc3BvbnNvcidzIGNsYWltcwAAABJnZXRfc3BvbnNvcl9jbGFpbXMAAAAAAAEAAAAAAAAAB3Nwb25zb3IAAAAAEwAAAAEAAAPqAAAABg==",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAEAAAAAAAAAAMUG9vbE5vdEZvdW5kAAAAAQAAAAAAAAARUG9vbEFscmVhZHlFeGlzdHMAAAAAAAACAAAAAAAAAAxQb29sSW5hY3RpdmUAAAADAAAAAAAAABdJbnN1ZmZpY2llbnRQb29sQmFsYW5jZQAAAAAEAAAAAAAAAA1DbGFpbU5vdEZvdW5kAAAAAAAACgAAAAAAAAAVQ2xhaW1BbHJlYWR5UHJvY2Vzc2VkAAAAAAAACwAAAAAAAAAMQ2xhaW1FeHBpcmVkAAAADAAAAAAAAAAPSW52YWxpZFByb29mVXJpAAAAAA0AAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAUAAAAAAAAABBJbnZhbGlkVmFsaWRhdG9yAAAAFQAAAAAAAAAPQ2xhaW1Ob3RQZW5kaW5nAAAAABYAAAAAAAAADFVuYXV0aG9yaXplZAAAAB4AAAAAAAAACk5vdFNwb25zb3IAAAAAAB8AAAAAAAAADE5vdFZhbGlkYXRvcgAAACAAAAAAAAAAE1Rva2VuVHJhbnNmZXJGYWlsZWQAAAAAKAAAAAAAAAATSW52YWxpZFRva2VuQWRkcmVzcwAAAAAp",
        "AAAAAQAAABlDbGFpbSBzdWJtaXR0ZWQgYnkgYSB1c2VyAAAAAAAAAAAAAAVDbGFpbQAAAAAAAAkAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAHY2xhaW1lcgAAAAATAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAKbWlzc2lvbl9pZAAAAAAABgAAAAAAAAAJcHJvb2ZfdXJpAAAAAAAAEAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAAC0NsYWltU3RhdHVzAAAAAAAAAAAMc3VibWl0dGVkX2F0AAAABgAAAAAAAAAMdmFsaWRhdGVkX2F0AAAD6AAAAAYAAAAAAAAACXZhbGlkYXRvcgAAAAAAA+gAAAAT",
        "AAAAAQAAACBSZXdhcmQgcG9vbCBtYW5hZ2VkIGJ5IGEgc3BvbnNvcgAAAAAAAAAKUmV3YXJkUG9vbAAAAAAABgAAAAAAAAARYXZhaWxhYmxlX2JhbGFuY2UAAAAAAAALAAAAAAAAAAlpc19hY3RpdmUAAAAAAAABAAAAAAAAAAdzcG9uc29yAAAAABMAAAAAAAAADXRva2VuX2FkZHJlc3MAAAAAAAATAAAAAAAAABF0b3RhbF9kaXN0cmlidXRlZAAAAAAAAAsAAAAAAAAADHRvdGFsX2Z1bmRlZAAAAAs=",
        "AAAAAgAAABFTdGF0dXMgb2YgYSBjbGFpbQAAAAAAAAAAAAALQ2xhaW1TdGF0dXMAAAAABAAAAAAAAAAAAAAAB1BlbmRpbmcAAAAAAAAAAAAAAAAIQXBwcm92ZWQAAAAAAAAAAAAAAAhSZWplY3RlZAAAAAAAAAAAAAAACERpc3B1dGVk",
        "AAAAAQAAACBWYWxpZGF0aW9uIHJlc3VsdCBmcm9tIEFJIG9yYWNsZQAAAAAAAAAQVmFsaWRhdGlvblJlc3VsdAAAAAQAAAAAAAAACGNhdGVnb3J5AAAAEAAAAAAAAAAKY29uZmlkZW5jZQAAAAAABAAAAAAAAAATZXN0aW1hdGVkX3dlaWdodF9rZwAAAAAEAAAAAAAAAAV2YWxpZAAAAAAAAAE=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_pool: this.txFromJSON<Result<RewardPool>>,
        fund_pool: this.txFromJSON<Result<void>>,
        get_claim: this.txFromJSON<Result<Claim>>,
        initialize: this.txFromJSON<null>,
        create_pool: this.txFromJSON<Result<void>>,
        is_validator: this.txFromJSON<boolean>,
        submit_claim: this.txFromJSON<Result<u64>>,
        add_validator: this.txFromJSON<Result<void>>,
        withdraw_pool: this.txFromJSON<Result<void>>,
        validate_claim: this.txFromJSON<Result<void>>,
        deactivate_pool: this.txFromJSON<Result<void>>,
        get_user_claims: this.txFromJSON<Array<u64>>,
        remove_validator: this.txFromJSON<Result<void>>,
        distribute_reward: this.txFromJSON<Result<void>>,
        get_sponsor_claims: this.txFromJSON<Array<u64>>
  }
}