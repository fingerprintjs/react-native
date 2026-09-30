package com.fingerprint.reactnative

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.fingerprint.android.Configuration
import com.fingerprint.android.Fingerprint
import com.fingerprint.android.FingerprintFactory
import com.fingerprint.android.FingerprintResponse
import com.fingerprint.android.Error
import com.fingerprint.android.ApiKeyRequired
import com.fingerprint.android.ApiKeyNotFound
import com.fingerprint.android.RequestCannotBeParsed
import com.fingerprint.android.Failed
import com.fingerprint.android.RequestTimeout
import com.fingerprint.android.TooManyRequest
import com.fingerprint.android.WrongRegion
import com.fingerprint.android.SubscriptionNotActive
import com.fingerprint.android.SubscriptionRestricted
import com.fingerprint.android.InstallationMethodRestricted
import com.fingerprint.android.EnvironmentRestricted
import com.fingerprint.android.ResponseCannotBeParsed
import com.fingerprint.android.NetworkError
import com.fingerprint.android.NetworkUnavailableError
import com.fingerprint.android.ClientTimeout
import com.fingerprint.android.UnknownError
import com.fingerprint.android.VisitorNotFound
import com.fingerprint.android.ServiceUnavailable
import com.fingerprint.android.FeatureNotEnabled
import com.fingerprint.android.MissingModule
import com.fingerprint.android.PayloadTooLarge
import com.fingerprint.android.InvalidProxyIntegrationHeaders
import com.fingerprint.android.InvalidProxyIntegrationSecret
import com.fingerprint.android.ProxyIntegrationSecretEnvironmentMismatch
import java.lang.Exception


@ReactModule(name = RNFingerprintModule.NAME)
class RNFingerprintModule(reactContext: ReactApplicationContext) : NativeRNFingerprintSpec(reactContext) {
  private var fpjsClient: Fingerprint? = null

  override fun getName(): String {
    return NAME
  }

  override fun configure(
      apiToken: String,
      pluginVersion: String,
      fallbackEndpointUrls: ReadableArray,
      allowUseOfLocationData: Boolean,
      locationTimeoutMillis: Double,
      regionKey: String?,
      endpointUrl: String?
  ) {
    val factory = FingerprintFactory(reactApplicationContext)
    val region = when(regionKey) {
      "eu" -> Configuration.Region.EU
      "us" -> Configuration.Region.US
      "ap" -> Configuration.Region.AP
      else -> Configuration.Region.US
    }
    val integrationInfo = listOf(Pair("fingerprint-pro-react-native", pluginVersion))
    val configuration = Configuration(
      apiToken,
      region,
      endpointUrl ?: region.endpointUrl,
      fallbackEndpointUrls.toArrayList().filterIsInstance<String>(),
      integrationInfo,
      allowUseOfLocationData,
      locationTimeoutMillis.toLong()
    )
    fpjsClient = factory.createInstance(configuration)
  }

  override fun getVisitorData(tag: ReadableMap?, linkedId: String?, timeout: Double?, promise: Promise) {
    try {
      val callback = { result: FingerprintResponse ->
        val visitorData = Arguments.createMap().apply {
          putString("visitorId", result.visitorId)
          putString("eventId", result.eventId)
          putDouble("suspectScore", (result.suspectScore ?: -1).toDouble())
          putString("sealedResult", result.sealedResult ?: "")
        }
        promise.resolve(visitorData)
      }
      val errorCallback = { error: Error ->
        // Carry the optional event ID through `userInfo` — RN surfaces it as `error.userInfo.eventId`.
        // `Error.eventId` defaults to the `"Unknown"` sentinel when the failure never reached the
        // server, in which case it is omitted so `FingerprintError.event_id` stays `null`.
        val userInfo = Arguments.createMap().apply {
          val id = error.eventId
          if (id.isNotEmpty() && id != UNKNOWN_EVENT_ID) putString("eventId", id)
        }
        promise.reject(getErrorCode(error), error.description ?: "", userInfo)
      }
      val timeoutMillis = timeout?.toInt()

      if (timeoutMillis != null) {
        fpjsClient?.getVisitorId(timeoutMillis, getTags(tag), linkedId ?: "", callback, errorCallback)
      } else {
        fpjsClient?.getVisitorId(getTags(tag), linkedId ?: "", callback, errorCallback)
      }
    } catch (e: Exception) {
      promise.reject("unknown_error", e)
    }
  }

  private fun getTags(tags: ReadableMap?): Map<String, Any> {
    return tags
      ?.toHashMap()
      ?.filterValues { it != null }
      ?.mapValues { it.value!! }
      ?: emptyMap()
  }

  // The React Native layer collapses every error into a single `FingerprintError` carrying a
  // machine-friendly `code` (see `sdk/src/errors.ts`). We reject the promise with this code (surfaced
  // as `error.code` in JS); codes mirror `@fingerprint/agent`'s `ErrorCode` values so identical
  // failures report the same `code` on web and native.
  //
  // The `else` is intentional even though it currently covers every `Error` subclass: the dependency
  // range is `[4.0.0, 5.0.0)`, so a future 4.x minor may introduce new error types, which the `else`
  // degrades to `unknown_error` instead of failing the build.
  @Suppress("REDUNDANT_ELSE_IN_WHEN")
  private fun getErrorCode(error: Error): String {
    return when(error) {
      is ApiKeyRequired -> "public_api_key_required"
      is ApiKeyNotFound -> "public_api_key_not_found"
      is RequestCannotBeParsed -> "request_cannot_be_parsed"
      is Failed -> "failed"
      is RequestTimeout -> "request_read_timeout"
      is TooManyRequest -> "too_many_requests"
      is WrongRegion -> "wrong_region"
      is SubscriptionNotActive -> "subscription_not_active"
      is SubscriptionRestricted -> "subscription_restricted"
      is InstallationMethodRestricted -> "installation_method_restricted"
      is EnvironmentRestricted -> "environment_restricted"
      is ResponseCannotBeParsed -> "response_cannot_be_parsed"
      // Both network failures collapse into one code, matching iOS and the web agent.
      is NetworkError -> "network_error"
      is NetworkUnavailableError -> "network_error"
      is ClientTimeout -> "client_timeout"
      is VisitorNotFound -> "visitor_not_found"
      is ServiceUnavailable -> "service_unavailable"
      is FeatureNotEnabled -> "feature_not_enabled"
      is MissingModule -> "missing_module"
      is PayloadTooLarge -> "payload_too_large"
      is UnknownError -> "unknown_error"
      is InvalidProxyIntegrationHeaders -> "invalid_proxy_integration_headers"
      is InvalidProxyIntegrationSecret -> "invalid_proxy_integration_secret"
      is ProxyIntegrationSecretEnvironmentMismatch -> "proxy_integration_secret_environment_mismatch"
      else -> "unknown_error"
    }
  }

  companion object {
    const val NAME = "RNFingerprint"

    // The Android SDK's `Error.eventId` sentinel for "no event id available" (see the SDK's
    // `Error` sealed class default).
    private const val UNKNOWN_EVENT_ID = "Unknown"
  }
}
