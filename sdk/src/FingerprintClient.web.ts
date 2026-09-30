import * as Fingerprint from '@fingerprint/agent'
import type { FingerprintClient, FingerprintResponse, GetOptions, StartOptions } from './types'
import { unwrapError } from './unwrapError'
import { isEmptyArray, isTruthy } from './utils'

const packageVersion = '__VERSION__'

/**
 * Web implementation backed by `@fingerprint/agent`.
 *
 * @group API Client approach
 * @platform web
 */
class WebFingerprintClient implements FingerprintClient {
  private readonly agent: Fingerprint.Agent

  constructor({ apiKey, region, endpoints: endpointsParam, web }: StartOptions) {
    const endpoints =
      isTruthy(endpointsParam) && !isEmptyArray(endpointsParam)
        ? Fingerprint.withoutDefault(endpointsParam)
        : endpointsParam

    this.agent = Fingerprint.start({
      apiKey,
      region,
      endpoints,
      storageKeyPrefix: web?.storageKeyPrefix,
      urlHashing: web?.urlHashing,
      cache: web?.cache,
      integrationInfo: [`fingerprint-pro-react-native/${packageVersion}/web`],
    })
  }

  public async get(options?: GetOptions): Promise<FingerprintResponse> {
    try {
      const result = await this.agent.get({
        tags: options?.tags,
        linkedId: options?.linkedId,
        timeout: options?.timeout,
      })

      return {
        // `visitor_id` is only omitted by the backend in zeroTrust mode; default to '' to keep the
        // cross-platform shape stable.
        visitor_id: result.visitor_id ?? undefined,
        event_id: result.event_id,
        suspect_score: result.suspect_score,
        sealed_result: result.sealed_result ? result.sealed_result.base64() : null,
        cache_hit: result.cache_hit,
      }
    } catch (error) {
      throw unwrapError(error)
    }
  }
}

/**
 * Creates a Fingerprint client with the given options.
 *
 * @group API Client approach
 * @platform web
 */
export function start(options: StartOptions): FingerprintClient {
  return new WebFingerprintClient(options)
}
