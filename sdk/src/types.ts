import type { FingerprintError } from './errors'

/**
 * The {@link https://dev.fingerprint.com/docs/regions | region} of your application.
 * The parameter is optional because the agent detects the region automatically using the provided
 * API key. Nevertheless, we recommend always specifying it. Otherwise, the default region is `us`.
 *
 * @group Types and interfaces
 */
export type Region = 'us' | 'eu' | 'ap'

/**
 * One or many endpoint URLs.
 * If multiple URLs are given, the agent will try them one by one until it finds a working one.
 *
 * @group Types and interfaces
 */
export type Endpoints = string | string[]

/**
 * Options shared across every platform (web, iOS, Android).
 *
 * @group Types and interfaces
 */
export interface SharedStartOptions {
  /**
   * Your public API key that authenticates the agent with the Fingerprint API.
   */
  apiKey: string
  /**
   * Which region to use.
   */
  region?: Region
  /**
   * API endpoint(s). Should only be used with a custom subdomain or proxy integration.
   */
  endpoints?: Endpoints
}

/**
 * Android-only options.
 *
 * @group Types and interfaces
 */
export interface AndroidStartOptions {
  /**
   * Set this flag to allow the SDK to collect location data.
   */
  allowUseOfLocationData?: boolean
  /**
   * Location retrieval timeout in milliseconds.
   * The SDK will delay identification up to the specified timeout to collect the device location.
   * If it cannot collect the location information within the specified time, identification continues
   * without location information.
   *
   * @default 5000
   */
  locationTimeoutMillis?: number
}

/**
 * iOS-only options.
 *
 * @group Types and interfaces
 */
export interface IosStartOptions {
  /**
   * Set this flag to allow the SDK to collect location data.
   */
  allowUseOfLocationData?: boolean
}

/**
 * Hashes URL parts before sending them to the Fingerprint server.
 * Сan be used to hide sensitive data (tokens, payment info, etc) that these URLs may contain.
 *
 * @group Types and interfaces
 */
export interface UrlHashing {
  /** Set to `true` to hash the path part of the URL (between the origin and `?`) */
  path?: boolean
  /** Set to `true` to hash the query part of the URL (between `?` and `#`) */
  query?: boolean
  /** Set to `true` to hash the fragment part of the URL (after `#`) */
  fragment?: boolean
}

/**
 * Configuration for caching agent results on web. Disabled by default when not provided.
 *
 * @group Types and interfaces
 */
export interface CacheConfig {
  /** The storage location for the cache. */
  storage: 'sessionStorage' | 'localStorage' | 'agent'
  /**
   * The cache duration in seconds. Can be a predefined value
   * (`'optimize-cost'` = 1 hour, `'aggressive'` = 12 hours) or a custom number. Max value is `43200` (12 hours).
   */
  duration: 'optimize-cost' | 'aggressive' | number
  /** Optional prefix for cache keys. Defaults to none. */
  cachePrefix?: string
}

/**
 * Web-only options. Mirrors the `StartOptions` of `@fingerprint/agent`.
 *
 * @group Types and interfaces
 */
export interface WebStartOptions {
  /**
   * Override storages name (cookies, localStorage, etc).
   * Should only be used when the default name conflicts with some of your existing names.
   *
   * @default '_vid_'
   */
  storageKeyPrefix?: string
  /**
   * Hashes URL parts before sending them to the Fingerprint server.
   */
  urlHashing?: UrlHashing
  /**
   * Enables caching the result of the `get` call.
   */
  cache?: CacheConfig
}

/**
 * Configuration options for {@link start} and {@link FingerprintProvider}.
 *
 * Shared options live at the top level; platform-only options are grouped under `android`, `ios`,
 * and `web` so an option cannot silently no-op on a platform that does not support it.
 *
 * @group Types and interfaces
 */
export interface StartOptions extends SharedStartOptions {
  /**
   * Android-only options.
   */
  android?: AndroidStartOptions
  /**
   * iOS-only options.
   */
  ios?: IosStartOptions
  /**
   * Web-only options.
   */
  web?: WebStartOptions
}

/**
 * Any simple value or an object (not arrays). The size must not exceed 16KB.
 *
 * @group Types and interfaces
 */
export type TagsPrimitive = string | number | boolean

/**
 * @group Types and interfaces
 */
export interface TagsObject {
  [key: string]: TagsValue | TagsValue[]
}

/**
 * `Tag` is a user-provided value or object that will be saved together with the analysis event and
 * returned back to you in a webhook message or when searching for the visit in the Server API.
 *
 * @group Types and interfaces
 */
export type TagsValue = TagsPrimitive | TagsObject

/**
 * Alias of {@link TagsValue}.
 *
 * @group Types and interfaces
 */
export type Tags = TagsValue

/**
 * Options for a single identification request.
 *
 * @group Types and interfaces
 */
export interface GetOptions {
  /**
   * A way of linking the current identification event with a custom identifier. This can be helpful
   * to be able to filter API visit information later.
   */
  linkedId?: string
  /**
   * A user-provided value or object that will be returned back to you in a webhook message.
   */
  tags?: TagsValue
  /**
   * Custom timeout for the request, in milliseconds.
   * On iOS, values below 500 are raised to 500.
   */
  timeout?: number
}

/**
 * Visitor identification data returned by the Fingerprint API v4.
 *
 * The shape is snake_case (matching the Server API v4 and the JS agent), so it can be forwarded to
 * your backend unchanged and is identical across web, iOS, and Android.
 *
 * @group Types and interfaces
 */
export interface FingerprintResponse {
  /**
   * The visitor identifier. `undefined` if [zero-trust-mode](https://docs.fingerprint.com/docs/zero-trust-mode) is enabled.
   */
  visitor_id?: string
  /**
   * A unique id associated with the successful identification request.
   */
  event_id: string
  /**
   * Suspect score. Present only if Smart Signals are enabled.
   */
  suspect_score?: number
  /**
   * Sealed result - the encrypted `/events` Server API response for this `event_id`, encoded in
   * base64. `null` if Sealed Results are disabled or unavailable.
   *
   * Compared to @fingerprint/agent, this is stored as base64 string, not as `BinaryOutput`.
   *
   * @see https://dev.fingerprint.com/docs/sealed-client-results
   */
  sealed_result: string | null

  /**
   * Indicates whether the response was retrieved from the cache, used only on web. Always set to `undefined` on native platforms.
   *
   * @platform web
   * */
  cache_hit?: boolean
}

/**
 * The imperative client returned by {@link start}.
 *
 * @group API Client approach
 */
export interface FingerprintClient {
  /**
   * Performs an identification request and returns the visitor data.
   * Rejects with a {@link FingerprintError} when identification fails.
   */
  get(options?: GetOptions): Promise<FingerprintResponse>
}

/**
 * @group Hooks approach
 */
export type QueryIdle = {
  data: undefined
  isLoading: false
  isFetched: false
  error: undefined
}

/**
 * @group Hooks approach
 */
export type QueryLoading = {
  data: undefined
  isLoading: true
  isFetched: false
  error: undefined
}

/**
 * @group Hooks approach
 */
export type QueryFetched<TData> = {
  data: TData
  isLoading: false
  isFetched: true
  error: undefined
}

/**
 * @group Hooks approach
 */
export type QueryError<TError = FingerprintError> = {
  data: undefined
  isLoading: false
  isFetched: false
  error: TError
}

/**
 * Discriminated union describing the state of an identification query. Checking `isLoading`,
 * `isFetched`, or `error` narrows `data` to the correct type.
 *
 * @group Hooks approach
 */
export type QueryResult<TData, TError = FingerprintError> =
  QueryIdle | QueryLoading | QueryFetched<TData> | QueryError<TError>
