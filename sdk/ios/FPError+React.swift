//
//  FPError+React.swift
//  RNFingerprint
//
//  Created by Petr Palata on 14.09.2022.
//

import Foundation
import Fingerprint

// The React Native layer collapses every error into a single `FingerprintError` (see
// `sdk/src/errors.ts`). We reject the promise with the API v4 snake_case `code`, the human-readable
// `message`, and — for server errors — the `eventId` carried in the `NSError`'s `userInfo`, which
// React Native forwards to JS as `error.code` / `error.message` / `error.userInfo.eventId`.
extension FPError {
    // The canonical snake_case error code, shared with Android and `@fingerprint/agent`.
    var reactCode: String {
        switch self {
        case .invalidURL:
            return "invalid_url"
        case .invalidURLParams:
            return "invalid_url_params"
        case .apiError(let apiError):
            return apiError.reactCode
        case .networkError:
            return "network_error"
        case .jsonParsingError:
            return "json_parsing_error"
        case .invalidResponseType:
            return "invalid_response_type"
        case .clientTimeout:
            return "client_timeout"
        case .unknownError:
            fallthrough
        @unknown default:
            return "unknown_error"
        }
    }

    // A human-readable message. For API errors we prefer the server-provided message.
    var reactMessage: String {
        switch self {
        case .apiError(let apiError):
            return apiError.message ?? self.description
        case .networkError(let networkError):
            return networkError.localizedDescription
        case .jsonParsingError(let jsonParsingError):
            return jsonParsingError.localizedDescription
        default:
            return self.description
        }
    }

    // The Server API event ID, present only for API errors — populates `FingerprintError.event_id`.
    var reactEventId: String? {
        switch self {
        case .apiError(let apiError):
            return apiError.reactEventId
        default:
            return nil
        }
    }
}

extension APIError {
    // The event ID the Server API attached to the failed request, or `nil` when absent.
    var reactEventId: String? {
        let eventId = self.eventId
        return eventId.isEmpty ? nil : eventId
    }

    // The SDK's `APIError.Code` has no explicit raw values, so `rawValue` is the camelCase case name
    // (e.g. `tooManyRequests`). Map it to the canonical snake_case codes shared with Android and
    // `@fingerprint/agent` so `FingerprintError.code` is identical across platforms. Falls back to
    // the generic `unknown_error` code when the server error carries no recognized code.
    var reactCode: String {
        guard let code = self.errorDetails?.code else {
            return "unknown_error"
        }
        switch code {
        case .requestCannotBeParsed: return "request_cannot_be_parsed"
        case .requestReadTimeout: return "request_read_timeout"
        case .publicApiKeyRequired: return "public_api_key_required"
        case .publicApiKeyNotFound: return "public_api_key_not_found"
        case .subscriptionNotActive: return "subscription_not_active"
        case .wrongRegion: return "wrong_region"
        case .featureNotEnabled: return "feature_not_enabled"
        case .visitorNotFound: return "visitor_not_found"
        case .tooManyRequests: return "too_many_requests"
        case .failed: return "failed"
        case .missingModule: return "missing_module"
        case .payloadTooLarge: return "payload_too_large"
        case .serviceUnavailable: return "service_unavailable"
        case .invalidProxyIntegrationSecret: return "invalid_proxy_integration_secret"
        case .proxyIntegrationSecretEnvironmentMismatch: return "proxy_integration_secret_environment_mismatch"
        case .invalidProxyIntegrationHeaders: return "invalid_proxy_integration_headers"
        case .subscriptionRestricted: return "subscription_restricted"
        case .environmentRestricted: return "environment_restricted"
        case .installationMethodRestricted: return "installation_method_restricted"
        // A future SDK may add codes; fall back to the raw value rather than losing the information.
        @unknown default: return code.rawValue
        }
    }

    var message: String? {
        return self.errorDetails?.message
    }
}
