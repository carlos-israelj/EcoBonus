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
  1: {message:"MissionNotFound"},
  2: {message:"MissionNotPending"},
  3: {message:"MissionNotActive"},
  4: {message:"MissionExpired"},
  5: {message:"MissionFull"},
  6: {message:"MissionAlreadyFunded"},
  7: {message:"CannotCancel"},
  10: {message:"InvalidRewardAmount"},
  11: {message:"InvalidMaxClaimers"},
  12: {message:"InvalidDeadline"},
  13: {message:"InvalidLocation"},
  20: {message:"AlreadyClaimed"},
  21: {message:"ClaimNotFound"},
  30: {message:"Unauthorized"},
  31: {message:"NotAdmin"},
  32: {message:"NotCreator"},
  40: {message:"InsufficientFunds"},
  41: {message:"InvalidProof"}
}


/**
 * Mission struct
 */
export interface Mission {
  creator: string;
  current_claimers: u32;
  deadline: u64;
  evidence_required: u32;
  funded_amount: i128;
  id: u64;
  location: Location;
  max_claimers: u32;
  metadata_uri: string;
  reward_amount: i128;
  status: MissionStatus;
}


/**
 * GPS Location with radius
 */
export interface Location {
  latitude: i64;
  longitude: i64;
  radius: u32;
}


/**
 * Claim record (stored separately in RewardContract)
 */
export interface ClaimRecord {
  claimer: string;
  mission_id: u64;
  proof_uri: string;
  timestamp: u64;
}

/**
 * Mission status enum
 */
export type MissionStatus = {tag: "Pending", values: void} | {tag: "Active", values: void} | {tag: "Completed", values: void} | {tag: "Expired", values: void} | {tag: "Cancelled", values: void};

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the contract
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_mission transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get mission details
   */
  get_mission: ({mission_id}: {mission_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Mission>>>

  /**
   * Construct and simulate a fund_mission transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fund a mission to activate it
   */
  fund_mission: ({mission_id, funder, amount}: {mission_id: u64, funder: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a claim_mission transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Claim a mission
   * Returns claim ID (to be used in RewardContract)
   */
  claim_mission: ({mission_id, claimer, proof_uri}: {mission_id: u64, claimer: string, proof_uri: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a cancel_mission transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a mission (only creator or admin)
   */
  cancel_mission: ({mission_id, canceler}: {mission_id: u64, canceler: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_mission transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new mission
   * Returns the mission ID
   */
  create_mission: ({creator, location, reward_amount, max_claimers, deadline, metadata_uri, evidence_required}: {creator: string, location: Location, reward_amount: i128, max_claimers: u32, deadline: u64, metadata_uri: string, evidence_required: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_mission_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total number of missions
   */
  get_mission_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_user_missions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get missions by user (claimed)
   */
  get_user_missions: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a get_creator_missions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get missions by creator
   */
  get_creator_missions: ({creator}: {creator: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a get_active_missions_near transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get active missions near a location
   */
  get_active_missions_near: ({latitude, longitude, radius_km}: {latitude: i64, longitude: i64, radius_km: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Mission>>>

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
      new ContractSpec([ "AAAAAAAAABdJbml0aWFsaXplIHRoZSBjb250cmFjdAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAABNHZXQgbWlzc2lvbiBkZXRhaWxzAAAAAAtnZXRfbWlzc2lvbgAAAAABAAAAAAAAAAptaXNzaW9uX2lkAAAAAAAGAAAAAQAAA+kAAAfQAAAAB01pc3Npb24AAAAAAw==",
        "AAAAAAAAAB1GdW5kIGEgbWlzc2lvbiB0byBhY3RpdmF0ZSBpdAAAAAAAAAxmdW5kX21pc3Npb24AAAADAAAAAAAAAAptaXNzaW9uX2lkAAAAAAAGAAAAAAAAAAZmdW5kZXIAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAD9DbGFpbSBhIG1pc3Npb24KUmV0dXJucyBjbGFpbSBJRCAodG8gYmUgdXNlZCBpbiBSZXdhcmRDb250cmFjdCkAAAAADWNsYWltX21pc3Npb24AAAAAAAADAAAAAAAAAAptaXNzaW9uX2lkAAAAAAAGAAAAAAAAAAdjbGFpbWVyAAAAABMAAAAAAAAACXByb29mX3VyaQAAAAAAABAAAAABAAAD6QAAAAYAAAAD",
        "AAAAAAAAAChDYW5jZWwgYSBtaXNzaW9uIChvbmx5IGNyZWF0b3Igb3IgYWRtaW4pAAAADmNhbmNlbF9taXNzaW9uAAAAAAACAAAAAAAAAAptaXNzaW9uX2lkAAAAAAAGAAAAAAAAAAhjYW5jZWxlcgAAABMAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAACtDcmVhdGUgYSBuZXcgbWlzc2lvbgpSZXR1cm5zIHRoZSBtaXNzaW9uIElEAAAAAA5jcmVhdGVfbWlzc2lvbgAAAAAABwAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAhsb2NhdGlvbgAAB9AAAAAITG9jYXRpb24AAAAAAAAADXJld2FyZF9hbW91bnQAAAAAAAALAAAAAAAAAAxtYXhfY2xhaW1lcnMAAAAEAAAAAAAAAAhkZWFkbGluZQAAAAYAAAAAAAAADG1ldGFkYXRhX3VyaQAAABAAAAAAAAAAEWV2aWRlbmNlX3JlcXVpcmVkAAAAAAAABAAAAAEAAAPpAAAABgAAAAM=",
        "AAAAAAAAABxHZXQgdG90YWwgbnVtYmVyIG9mIG1pc3Npb25zAAAAEWdldF9taXNzaW9uX2NvdW50AAAAAAAAAAAAAAEAAAAG",
        "AAAAAAAAAB5HZXQgbWlzc2lvbnMgYnkgdXNlciAoY2xhaW1lZCkAAAAAABFnZXRfdXNlcl9taXNzaW9ucwAAAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAA+oAAAAG",
        "AAAAAAAAABdHZXQgbWlzc2lvbnMgYnkgY3JlYXRvcgAAAAAUZ2V0X2NyZWF0b3JfbWlzc2lvbnMAAAABAAAAAAAAAAdjcmVhdG9yAAAAABMAAAABAAAD6gAAAAY=",
        "AAAAAAAAACNHZXQgYWN0aXZlIG1pc3Npb25zIG5lYXIgYSBsb2NhdGlvbgAAAAAYZ2V0X2FjdGl2ZV9taXNzaW9uc19uZWFyAAAAAwAAAAAAAAAIbGF0aXR1ZGUAAAAHAAAAAAAAAAlsb25naXR1ZGUAAAAAAAAHAAAAAAAAAAlyYWRpdXNfa20AAAAAAAAEAAAAAQAAA+oAAAfQAAAAB01pc3Npb24A",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAEgAAAAAAAAAPTWlzc2lvbk5vdEZvdW5kAAAAAAEAAAAAAAAAEU1pc3Npb25Ob3RQZW5kaW5nAAAAAAAAAgAAAAAAAAAQTWlzc2lvbk5vdEFjdGl2ZQAAAAMAAAAAAAAADk1pc3Npb25FeHBpcmVkAAAAAAAEAAAAAAAAAAtNaXNzaW9uRnVsbAAAAAAFAAAAAAAAABRNaXNzaW9uQWxyZWFkeUZ1bmRlZAAAAAYAAAAAAAAADENhbm5vdENhbmNlbAAAAAcAAAAAAAAAE0ludmFsaWRSZXdhcmRBbW91bnQAAAAACgAAAAAAAAASSW52YWxpZE1heENsYWltZXJzAAAAAAALAAAAAAAAAA9JbnZhbGlkRGVhZGxpbmUAAAAADAAAAAAAAAAPSW52YWxpZExvY2F0aW9uAAAAAA0AAAAAAAAADkFscmVhZHlDbGFpbWVkAAAAAAAUAAAAAAAAAA1DbGFpbU5vdEZvdW5kAAAAAAAAFQAAAAAAAAAMVW5hdXRob3JpemVkAAAAHgAAAAAAAAAITm90QWRtaW4AAAAfAAAAAAAAAApOb3RDcmVhdG9yAAAAAAAgAAAAAAAAABFJbnN1ZmZpY2llbnRGdW5kcwAAAAAAACgAAAAAAAAADEludmFsaWRQcm9vZgAAACk=",
        "AAAAAQAAAA5NaXNzaW9uIHN0cnVjdAAAAAAAAAAAAAdNaXNzaW9uAAAAAAsAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAQY3VycmVudF9jbGFpbWVycwAAAAQAAAAAAAAACGRlYWRsaW5lAAAABgAAAAAAAAARZXZpZGVuY2VfcmVxdWlyZWQAAAAAAAAEAAAAAAAAAA1mdW5kZWRfYW1vdW50AAAAAAAACwAAAAAAAAACaWQAAAAAAAYAAAAAAAAACGxvY2F0aW9uAAAH0AAAAAhMb2NhdGlvbgAAAAAAAAAMbWF4X2NsYWltZXJzAAAABAAAAAAAAAAMbWV0YWRhdGFfdXJpAAAAEAAAAAAAAAANcmV3YXJkX2Ftb3VudAAAAAAAAAsAAAAAAAAABnN0YXR1cwAAAAAH0AAAAA1NaXNzaW9uU3RhdHVzAAAA",
        "AAAAAQAAABhHUFMgTG9jYXRpb24gd2l0aCByYWRpdXMAAAAAAAAACExvY2F0aW9uAAAAAwAAAAAAAAAIbGF0aXR1ZGUAAAAHAAAAAAAAAAlsb25naXR1ZGUAAAAAAAAHAAAAAAAAAAZyYWRpdXMAAAAAAAQ=",
        "AAAAAQAAADJDbGFpbSByZWNvcmQgKHN0b3JlZCBzZXBhcmF0ZWx5IGluIFJld2FyZENvbnRyYWN0KQAAAAAAAAAAAAtDbGFpbVJlY29yZAAAAAAEAAAAAAAAAAdjbGFpbWVyAAAAABMAAAAAAAAACm1pc3Npb25faWQAAAAAAAYAAAAAAAAACXByb29mX3VyaQAAAAAAABAAAAAAAAAACXRpbWVzdGFtcAAAAAAAAAY=",
        "AAAAAgAAABNNaXNzaW9uIHN0YXR1cyBlbnVtAAAAAAAAAAANTWlzc2lvblN0YXR1cwAAAAAAAAUAAAAAAAAAAAAAAAdQZW5kaW5nAAAAAAAAAAAAAAAABkFjdGl2ZQAAAAAAAAAAAAAAAAAJQ29tcGxldGVkAAAAAAAAAAAAAAAAAAAHRXhwaXJlZAAAAAAAAAAAAAAAAAlDYW5jZWxsZWQAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        get_mission: this.txFromJSON<Result<Mission>>,
        fund_mission: this.txFromJSON<Result<void>>,
        claim_mission: this.txFromJSON<Result<u64>>,
        cancel_mission: this.txFromJSON<Result<void>>,
        create_mission: this.txFromJSON<Result<u64>>,
        get_mission_count: this.txFromJSON<u64>,
        get_user_missions: this.txFromJSON<Array<u64>>,
        get_creator_missions: this.txFromJSON<Array<u64>>,
        get_active_missions_near: this.txFromJSON<Array<Mission>>
  }
}