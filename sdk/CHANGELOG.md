# @fingerprint/react-native

## 4.0.0

### Major Changes

- Dropped React Native Old Architecture support. The native module is now a TurboModule (New Architecture only) exposed via a Codegen spec.

  Migrated the project to [Strict TypeScript API](https://reactnative.dev/docs/strict-typescript-api).

  This is a breaking change: the SDK now requires React Native >= 0.80 (Expo SDK >= 54) with the [New Architecture](https://reactnative.dev/architecture/landing-page) enabled. ([e83c165](https://github.com/fingerprintjs/react-native/commit/e83c165cc7282d6820f70d06d8ad1ae8e11450a1))

- Migrated the SDK to Fingerprint API v4 and realigned the public API with `@fingerprint/react`. This is a breaking change on every platform (web, iOS, Android).

  **Renamed API**

  - `FingerprintJsProProvider` → `FingerprintProvider`.
  - `FingerprintJsProAgent` (constructed with `new`) → `start(options)`, returning a client with a single `get(options)` method (`getVisitorId`/`getVisitorData` are removed).
  - Added `useFingerprint()` to read the client from context.

  **Single options object**

  - `getData(tags, linkedId, options)` → `getData({ tags, linkedId, timeout })`.
  - `useVisitorData` now returns a discriminated union (`data`/`isLoading`/`isFetched`/`error`), and `getData` always throws on error. The `throwOnError` option is removed. `immediate` defaults to `false`.

  **Grouped provider/start options**

  - Platform-only options are nested: `android` (`allowUseOfLocationData`, `locationTimeoutMillis`), `ios` (`allowUseOfLocationData`), `web` (`storageKeyPrefix`, `urlHashing`, `cache`). `locationTimeoutMillisAndroid` moves to `android.locationTimeoutMillis`.
  - `endpointUrl` + `fallbackEndpointUrls` are replaced by a single `endpoints` (string or string[]).

  **snake_case response**

  - The response is now the flat, snake_case `FingerprintResponse` (`visitor_id`, `event_id`, `suspect_score?`, `sealed_result`), matching the Server API v4 and JS agent. `requestId` is replaced by `event_id`, `confidence` is removed, and `suspect_score` is a new optional Smart Signals value; `sealedResult` is renamed to `sealed_result`. The nested extended fields (`ipLocation`, `firstSeenAt`, etc.) and the `extendedResponseFormat` option are removed (v4 always returns the flat format).

  **Single error type**

  - The ~28 error classes are replaced by a single `FingerprintError` (`{ name, code, event_id }`) plus an `isFingerprintError` type guard. Discriminate on `error.code` (e.g. `too_many_requests`).
  - Every network failure reports `code: 'network_error'` on all platforms. The platform-specific `network_unavailable` (Android), `network_connection` and `network_abort` (web) codes are not emitted.

  **Web**

  - The web implementation now uses `@fingerprint/agent` (v4) instead of `@fingerprintjs/fingerprintjs-pro-spa`. Install `@fingerprint/agent` as the web peer dependency.
  - ️Caching is available only on **web** and is disabled by default. To enable caching on web, pass the JavaScript agent [cache](https://docs.fingerprint.com/reference/js-agent-start-function#cache) option:
    ```jsx
    <FingerprintProvider
      apiKey={'your-fpjs-public-api-key'}
      region={'eu'}
      web={{cache: {storage: 'sessionStorage', duration: 'optimize-cost'}}}
    >
      <App />
    </FingerprintProvider>
    ```

  **iOS**:
  - The new version floor for iOS is **15.1**.

  **Android**:
  - The new version floor for Android is **Android 7.0 (API level 24+)**.

  ## Migration

  **Provider**

  ```diff
  - import { FingerprintJsProProvider } from '@fingerprint/react-native'
  + import { FingerprintProvider } from '@fingerprint/react-native'

  - <FingerprintJsProProvider apiKey="PUBLIC_API_KEY" region="eu">
  + <FingerprintProvider apiKey="PUBLIC_API_KEY" region="eu">
      <App />
  - </FingerprintJsProProvider>
  + </FingerprintProvider>
  ```

  **Hook (`useVisitorData`)**

  ```diff
  - const { isLoading, error, data, getData } = useVisitorData()
  + const { isLoading, isFetched, error, data, getData } = useVisitorData()

    // positional args + opt-in throwing → single options object, always throws
  - await getData({ userAction: 'login' }, 'user_1234', { timeout: 5000, throwOnError: true })
  + await getData({ tags: { userAction: 'login' }, linkedId: 'user_1234', timeout: 5000 })

  - data?.visitorId
  - data?.confidence.score
  + data?.visitor_id
  + data?.suspect_score
  ```

  **Imperative client**

  ```diff
  - import { FingerprintJsProAgent } from '@fingerprint/react-native'
  + import { start } from '@fingerprint/react-native'

  - const client = new FingerprintJsProAgent({ apiKey: 'PUBLIC_API_KEY', region: 'eu' })
  - const visitorId = await client.getVisitorId()
  - const data = await client.getVisitorData()
  + const fp = start({ apiKey: 'PUBLIC_API_KEY', region: 'eu' })
  + const result = await fp.get()
  + result.visitor_id
  ```

  **Provider / start options**

  ```diff
    {
      apiKey: 'PUBLIC_API_KEY',
      region: 'eu',
  -   endpointUrl: 'https://metrics.example.com',
  -   fallbackEndpointUrls: ['https://metrics2.example.com'],
  +   endpoints: ['https://metrics.example.com', 'https://metrics2.example.com'],
  -   extendedResponseFormat: true,
  -   allowUseOfLocationData: true,
  -   locationTimeoutMillisAndroid: 5000,
  +   android: { allowUseOfLocationData: true, locationTimeoutMillis: 5000 },
  +   ios: { allowUseOfLocationData: true },
    }
  ```

  **Errors**

  ```diff
  - import { TooManyRequestError } from '@fingerprint/react-native'
  + import { isFingerprintError } from '@fingerprint/react-native'

    try {
      await fp.get()
    } catch (error) {
  -   if (error instanceof TooManyRequestError) {
  +   if (isFingerprintError(error) && error.code === 'too_many_requests') {
        // handle rate limiting
      }
    }
  ```

  **Web peer dependency**

  ```diff
  - npm install @fingerprintjs/fingerprintjs-pro-spa
  + npm install @fingerprint/agent
  ```

  --- ([64f1dfb](https://github.com/fingerprintjs/react-native/commit/64f1dfbc04ae9913a5cbccd9aad75a94949ea913))

### Minor Changes

- Added experimental support for [Swift Package Manager](https://swift.org/package-manager/). The library now ships with its own `Package.swift`.

  If you are on React Native >= 0.87, you can run:

  ```bash
  cd ios
  # deintegrate will remove CocoaPods from your project
  npx react-native spm --deintegrate
  ```

  to consume the library via Swift Package Manager. ([7af274f](https://github.com/fingerprintjs/react-native/commit/7af274f34db8990e047bf6062f531ae2c6c73da4))

### Patch Changes

- Fixed `tags` validation to reject circular references with a clear `TypeError` instead of throwing an unhandled `RangeError: Maximum call stack size exceeded`. ([f102cf0](https://github.com/fingerprintjs/react-native/commit/f102cf0591a9b3be86c467a97073c7bb92aa3b6c))

### Supported Native SDK Version Range

- Fingerprint iOS SDK Version Range: **`~> 4.1.0`**
- Fingerprint Android SDK Version Range: **`>= 4.1.0 and < 4.2.0`**

## 4.0.0-rc.1

### Major Changes

- Migrated the SDK to Fingerprint API v4 and realigned the public API with `@fingerprint/react`. This is a breaking change on every platform (web, iOS, Android).

  **Renamed API**

  - `FingerprintJsProProvider` → `FingerprintProvider`.
  - `FingerprintJsProAgent` (constructed with `new`) → `start(options)`, returning a client with a single `get(options)` method (`getVisitorId`/`getVisitorData` are removed).
  - Added `useFingerprint()` to read the client from context.

  **Single options object**

  - `getData(tags, linkedId, options)` → `getData({ tags, linkedId, timeout })`.
  - `useVisitorData` now returns a discriminated union (`data`/`isLoading`/`isFetched`/`error`), and `getData` always throws on error. The `throwOnError` option is removed. `immediate` defaults to `false`.

  **Grouped provider/start options**

  - Platform-only options are nested: `android` (`allowUseOfLocationData`, `locationTimeoutMillis`), `ios` (`allowUseOfLocationData`), `web` (`storageKeyPrefix`, `urlHashing`, `cache`). `locationTimeoutMillisAndroid` moves to `android.locationTimeoutMillis`.
  - `endpointUrl` + `fallbackEndpointUrls` are replaced by a single `endpoints` (string or string[]).

  **snake_case response**

  - The response is now the flat, snake_case `FingerprintResponse` (`visitor_id`, `event_id`, `suspect_score?`, `sealed_result`), matching the Server API v4 and JS agent. `requestId` is replaced by `event_id`, `confidence` is removed, and `suspect_score` is a new optional Smart Signals value; `sealedResult` is renamed to `sealed_result`. The nested extended fields (`ipLocation`, `firstSeenAt`, etc.) and the `extendedResponseFormat` option are removed (v4 always returns the flat format).

  **Single error type**

  - The ~28 error classes are replaced by a single `FingerprintError` (`{ name, code, event_id }`) plus an `isFingerprintError` type guard. Discriminate on `error.code` (e.g. `too_many_requests`).
  - Every network failure reports `code: 'network_error'` on all platforms. The platform-specific `network_unavailable` (Android), `network_connection` and `network_abort` (web) codes are not emitted.

  **Web**

  - The web implementation now uses `@fingerprint/agent` (v4) instead of `@fingerprintjs/fingerprintjs-pro-spa`. Install `@fingerprint/agent` as the web peer dependency.
  - ️Caching is available only on **web** and is disabled by default. To enable caching on web, pass the JavaScript agent [cache](https://docs.fingerprint.com/reference/js-agent-start-function#cache) option:
    ```jsx
    <FingerprintProvider
      apiKey={'your-fpjs-public-api-key'}
      region={'eu'}
      web={{cache: {storage: 'sessionStorage', duration: 'optimize-cost'}}}
    >
      <App />
    </FingerprintProvider>
    ```

  **iOS**:
  - The new version floor for iOS is **15.1**.

  **Android**:
  - The new version floor for Android is **Android 7.0 (API level 24+)**.

  ## Migration

  **Provider**

  ```diff
  - import { FingerprintJsProProvider } from '@fingerprint/react-native'
  + import { FingerprintProvider } from '@fingerprint/react-native'

  - <FingerprintJsProProvider apiKey="PUBLIC_API_KEY" region="eu">
  + <FingerprintProvider apiKey="PUBLIC_API_KEY" region="eu">
      <App />
  - </FingerprintJsProProvider>
  + </FingerprintProvider>
  ```

  **Hook (`useVisitorData`)**

  ```diff
  - const { isLoading, error, data, getData } = useVisitorData()
  + const { isLoading, isFetched, error, data, getData } = useVisitorData()

    // positional args + opt-in throwing → single options object, always throws
  - await getData({ userAction: 'login' }, 'user_1234', { timeout: 5000, throwOnError: true })
  + await getData({ tags: { userAction: 'login' }, linkedId: 'user_1234', timeout: 5000 })

  - data?.visitorId
  - data?.confidence.score
  + data?.visitor_id
  + data?.suspect_score
  ```

  **Imperative client**

  ```diff
  - import { FingerprintJsProAgent } from '@fingerprint/react-native'
  + import { start } from '@fingerprint/react-native'

  - const client = new FingerprintJsProAgent({ apiKey: 'PUBLIC_API_KEY', region: 'eu' })
  - const visitorId = await client.getVisitorId()
  - const data = await client.getVisitorData()
  + const fp = start({ apiKey: 'PUBLIC_API_KEY', region: 'eu' })
  + const result = await fp.get()
  + result.visitor_id
  ```

  **Provider / start options**

  ```diff
    {
      apiKey: 'PUBLIC_API_KEY',
      region: 'eu',
  -   endpointUrl: 'https://metrics.example.com',
  -   fallbackEndpointUrls: ['https://metrics2.example.com'],
  +   endpoints: ['https://metrics.example.com', 'https://metrics2.example.com'],
  -   extendedResponseFormat: true,
  -   allowUseOfLocationData: true,
  -   locationTimeoutMillisAndroid: 5000,
  +   android: { allowUseOfLocationData: true, locationTimeoutMillis: 5000 },
  +   ios: { allowUseOfLocationData: true },
    }
  ```

  **Errors**

  ```diff
  - import { TooManyRequestError } from '@fingerprint/react-native'
  + import { isFingerprintError } from '@fingerprint/react-native'

    try {
      await fp.get()
    } catch (error) {
  -   if (error instanceof TooManyRequestError) {
  +   if (isFingerprintError(error) && error.code === 'too_many_requests') {
        // handle rate limiting
      }
    }
  ```

  **Web peer dependency**

  ```diff
  - npm install @fingerprintjs/fingerprintjs-pro-spa
  + npm install @fingerprint/agent
  ```

  --- ([64f1dfb](https://github.com/fingerprintjs/react-native/commit/64f1dfbc04ae9913a5cbccd9aad75a94949ea913))

### Minor Changes

- Added experimental support for [Swift Package Manager](https://swift.org/package-manager/). The library now ships with its own `Package.swift`.

  If you are on React Native >= 0.87, you can run:

  ```bash
  cd ios
  # deintegrate will remove CocoaPods from your project
  npx react-native spm --deintegrate
  ```

  to consume the library via Swift Package Manager. ([7af274f](https://github.com/fingerprintjs/react-native/commit/7af274f34db8990e047bf6062f531ae2c6c73da4))

## 4.0.0-rc.0

### Major Changes

- Dropped React Native Old Architecture support. The native module is now a TurboModule (New Architecture only) exposed via a Codegen spec.

  This is a breaking change: the SDK now requires React Native >= 0.79 (Expo SDK >= 53) with the [New Architecture](https://reactnative.dev/architecture/landing-page) enabled. ([e83c165](https://github.com/fingerprintjs/fingerprintjs-pro-react-native/commit/e83c165cc7282d6820f70d06d8ad1ae8e11450a1))

## 3.17.1

### Patch Changes

- Fix logic in `FingerprintJsProProvider` that prevented the agent from being updated after its parameters changed ([01d5667](https://github.com/fingerprintjs/react-native/commit/01d56671b991f86bb13025c8f03dc50fc5d2714b))

## 3.17.0

### Minor Changes

- Add an option to rethrow errors from `useVisitorData().getData`. ([86230b3](https://github.com/fingerprintjs/react-native/commit/86230b35ccf27e6281cb7dd7670b805cd9b19f28))

### Supported Native SDK Version Range

- Fingerprint iOS SDK Version Range: **`~> 2.17.0`**
- Fingerprint Android SDK Version Range: **`>= 2.17.0 and < 2.18.0`**

## 3.16.0

### Minor Changes

- Update mobile agents to v2.17.0

  - [iOS Agent v2.17.0](https://docs.fingerprint.com/docs/changelog-ios-sdk#v2-17-0)
  - [Android Agent v2.17.0](https://docs.fingerprint.com/docs/changelog-android-sdk#v2-17-0) ([d80abd8](https://github.com/fingerprintjs/react-native/commit/d80abd810567a90d54cc009372164041c8330083))

### Supported Native SDK Version Range

- Fingerprint iOS SDK Version Range: **`~> 2.17.0`**
- Fingerprint Android SDK Version Range: **`>= 2.17.0 and < 2.18.0`**

## 3.15.0

### Minor Changes

- Update mobile agents to v2.16.0

  - [iOS Agent v2.16.0](https://docs.fingerprint.com/docs/changelog-ios-sdk#v2-16-0)
  - [Android Agent v2.16.0](https://docs.fingerprint.com/docs/changelog-android-sdk#v2-16-0) ([aed5000](https://github.com/fingerprintjs/react-native/commit/aed50007498ebd184608c18ec68585586aec27a1))

### Supported Native SDK Version Range

- Fingerprint iOS SDK Version Range: **`~> 2.16.0`**
- Fingerprint Android SDK Version Range: **`>= 2.16.0 and < 2.17.0`**

## 3.15.0-test.0

### Minor Changes

- Update mobile agents to v2.16.0

  - [iOS Agent v2.16.0](https://docs.fingerprint.com/docs/changelog-ios-sdk#v2-16-0)
  - [Android Agent v2.16.0](https://docs.fingerprint.com/docs/changelog-android-sdk#v2-16-0) ([aed5000](https://github.com/fingerprintjs/react-native/commit/aed50007498ebd184608c18ec68585586aec27a1))

## [3.14.0](https://github.com/fingerprintjs/react-native/compare/v3.13.0...v3.14.0) (2026-05-05)

### Features

- use Fingerprint Pro iOS v2.15.0 ([d0e3807](https://github.com/fingerprintjs/react-native/commit/d0e3807fe6d3bc00d908ac09381d7707a9a9a435))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.15.0 and < 2.16.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.15.0`**

## [3.13.0](https://github.com/fingerprintjs/react-native/compare/v3.12.0...v3.13.0) (2026-04-28)

### Features

- use Fingerprint Pro Android v2.15.0 ([0b69968](https://github.com/fingerprintjs/react-native/commit/0b699685fdb7cca3a432488ea4e70dc886a2426e))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.15.0 and < 2.16.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.14.0`**

## [3.12.0](https://github.com/fingerprintjs/react-native/compare/v3.11.0...v3.12.0) (2026-03-31)

### Features

- use Fingerprint Pro Android v2.14.0 ([abc4513](https://github.com/fingerprintjs/react-native/commit/abc4513c72aaf8bdbaaf2181e005aa3eb2a75c17))
- use Fingerprint Pro iOS v2.14.0 ([ebbc9e4](https://github.com/fingerprintjs/react-native/commit/ebbc9e468b55b54337c9510244407c9b9ac29f18))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.14.0 and < 2.15.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.14.0`**

## [3.11.0](https://github.com/fingerprintjs/react-native/compare/v3.10.0...v3.11.0) (2026-02-18)

### Features

- use Fingerprint Pro Android v2.13.0 ([4844102](https://github.com/fingerprintjs/react-native/commit/4844102d20268da61b78f4abce38b7198810f588))
- use Fingerprint Pro iOS v2.13.0 ([3f4252d](https://github.com/fingerprintjs/react-native/commit/3f4252d4eb9489f87a3e26397e7855048f692520))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.13.1 and < 2.14.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.13.0`**

## [3.10.0](https://github.com/fingerprintjs/react-native/compare/v3.9.0...v3.10.0) (2025-12-11)

### Features

- use Fingerprint Pro Android v2.12.0 ([332376a](https://github.com/fingerprintjs/react-native/commit/332376a641e5232036cfc84c2645459f4aab4520))
- use Fingerprint Pro iOS v2.12.0 ([0b73ef2](https://github.com/fingerprintjs/react-native/commit/0b73ef2ff0b0580f0512ca810a64c1b8d6669545))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.12.0 and < 2.13.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.12.0`**

## [3.9.0](https://github.com/fingerprintjs/react-native/compare/v3.8.0...v3.9.0) (2025-10-28)

### Features

- use Fingerprint Pro Android v2.11.0 ([00ddc39](https://github.com/fingerprintjs/react-native/commit/00ddc3936ad26a2aa17bf3e80f17e47ee9d1492e))
- use Fingerprint Pro iOS v2.11.0 ([fb90c9a](https://github.com/fingerprintjs/react-native/commit/fb90c9aa177088826f7a8fc8aead2c75a7b7e9f8))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.11.0 and < 2.12.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.11.0`**

## [3.8.0](https://github.com/fingerprintjs/react-native/compare/v3.7.0...v3.8.0) (2025-09-23)

### Features

- add Proximity Detection init options (`allowUseOfLocationData` - to allow collect location data and `locationTimeoutMillisAndroid` - to configure the location retrieval timeout on Android ([636622c](https://github.com/fingerprintjs/react-native/commit/636622cb02f781c3e0a5a0c973d42d34201c3136))

### Bug Fixes

- remove `src` folder from the release artifacts ([a0c9121](https://github.com/fingerprintjs/react-native/commit/a0c9121c9d30c87547424c243ba30a79256dfbc9))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.10.0 and < 2.11.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.10.0`**

## [3.8.0-test.2](https://github.com/fingerprintjs/react-native/compare/v3.8.0-test.1...v3.8.0-test.2) (2025-09-23)

### Bug Fixes

- remove `src` folder from the release artifacts ([a0c9121](https://github.com/fingerprintjs/react-native/commit/a0c9121c9d30c87547424c243ba30a79256dfbc9))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.10.0 and < 2.11.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.10.0`**

## [3.8.0-test.1](https://github.com/fingerprintjs/react-native/compare/v3.7.0...v3.8.0-test.1) (2025-09-23)

### Features

- add Proximity Detection init options (`allowUseOfLocationData` - to allow collect location data and `locationTimeoutMillisAndroid` - to configure the location retrieval timeout on Android ([636622c](https://github.com/fingerprintjs/react-native/commit/636622cb02f781c3e0a5a0c973d42d34201c3136))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.10.0 and < 2.11.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.10.0`**

## [3.7.0](https://github.com/fingerprintjs/react-native/compare/v3.6.0...v3.7.0) (2025-09-09)

### Features

- use Fingerprint Pro Android v2.10.0 ([7553f92](https://github.com/fingerprintjs/react-native/commit/7553f925a28a5b0f4d376436271e65f90926c454))
- use Fingerprint Pro iOS v2.10.0 ([5ece1e6](https://github.com/fingerprintjs/react-native/commit/5ece1e6f7a2c9776b7bf3c521c8ac70c9794e047))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.10.0 and < 2.11.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.10.0`**

## [3.6.0](https://github.com/fingerprintjs/react-native/compare/v3.5.0...v3.6.0) (2025-09-03)

### Features

- add official web support ([44a954c](https://github.com/fingerprintjs/react-native/commit/44a954c4c50b938c7625057df582853e1eec8de6))
- introduce official expo support ([07291e1](https://github.com/fingerprintjs/react-native/commit/07291e1a6dffee30c8efc5b801fbc2c020e20dad))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.9.0 and < 2.10.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.9.0`**

## [3.5.0](https://github.com/fingerprintjs/react-native/compare/v3.4.1...v3.5.0) (2025-08-26)

### Features

- add `InvalidProxyIntegrationHeadersError` and `InvalidProxyIntegrationSecretError` ([4e38a66](https://github.com/fingerprintjs/react-native/commit/4e38a66a056c27ff2715cb9c91b1fd8385af034e))
- add `ProxyIntegrationSecretEnvironmentMismatch` error ([ac29477](https://github.com/fingerprintjs/react-native/commit/ac294771cad76fb38980f2e033261757cff665cb))
- use Fingerprint Pro Android v2.9.0 ([7ca1703](https://github.com/fingerprintjs/react-native/commit/7ca17034460105fd162ca1a0bc57b83a0c3342dd))
- use Fingerprint Pro iOS v2.9.0 ([d20c88d](https://github.com/fingerprintjs/react-native/commit/d20c88db445fc45bff6ddf3b848d83bf381d0996))

### Build System

- **deps:** bump form-data from 4.0.0 to 4.0.4 ([a495670](https://github.com/fingerprintjs/react-native/commit/a49567083c20017dccda91ce076caa709fbe76f9))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.9.0 and < 2.10.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.9.0`**

## [3.4.1](https://github.com/fingerprintjs/react-native/compare/v3.4.0...v3.4.1) (2025-06-26)

### Bug Fixes

- pin Fingerprint native dependencies to MINOR version instead of MAJOR ([280c7de](https://github.com/fingerprintjs/react-native/commit/280c7dedfd5152f14915e946f23f3989d7e790b1))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.8.0 and < 2.9.0`**
- Fingerprint iOS SDK Version Range: **`~> 2.8.2`**

## [3.4.0](https://github.com/fingerprintjs/react-native/compare/v3.3.1...v3.4.0) (2025-05-12)

### Features

- **android:** set minSdkVersion to 24 ([78a96d9](https://github.com/fingerprintjs/react-native/commit/78a96d9f9e5efea0770ff1c51ec9b9d0136c8f49))

### Bug Fixes

- don't convert boolean fields of `tag` to int for iOS platform ([82c91a8](https://github.com/fingerprintjs/react-native/commit/82c91a8256ef0c98c2a9905fdd77a6fb07bb3a09))
- **ios:** revert podspec to dsl format ([38fc9ae](https://github.com/fingerprintjs/react-native/commit/38fc9aefbf646fd96c678d1d7b5c28ed37a7afde))

### Documentation

- **README:** mention support for react-native version up to 0.79 ([a783162](https://github.com/fingerprintjs/react-native/commit/a783162f7a6f279f3424d594744f76de71ee221d))
- **README:** update package description ([62d3f91](https://github.com/fingerprintjs/react-native/commit/62d3f91b6fe507b99dfd38176a76e1323d786dd0))

### Supported Native SDK Version Range

- Fingerprint Android SDK Version Range: **`>= 2.7.0 and < 3.0.0`**
- Fingerprint iOS SDK Version Range: **`>= 2.7.0 and < 3.0.0`**

## [3.3.1](https://github.com/fingerprintjs/react-native/compare/v3.3.0...v3.3.1) (2025-01-30)

### Bug Fixes

- fix compatibility with React Native new architecture (v0.76+) ([8b2003b](https://github.com/fingerprintjs/react-native/commit/8b2003bf4e535721e816106a3a15760fa79baf59))
- improve Android types to make project Kotlin v2 compatible (RN 0.77+) ([891c9c3](https://github.com/fingerprintjs/react-native/commit/891c9c37544ae09e90f94cb51da18c6cf332bb80))

## [3.3.0](https://github.com/fingerprintjs/react-native/compare/v3.2.0...v3.3.0) (2025-01-09)

### Features

- add custom timeout feature ([02757ef](https://github.com/fingerprintjs/react-native/commit/02757ef0beb1caaf887f9380b22ddd492d9efdfc))
- add sealed result support ([37dbe7f](https://github.com/fingerprintjs/react-native/commit/37dbe7f41fcce22ad05e9a52d15300f33ef29d29))
- update iOS and Android SDKs to v2.7.0 ([eafa1d4](https://github.com/fingerprintjs/react-native/commit/eafa1d4e573db6bcd99b5e5f8615f7b5062faca4))

## [3.2.0](https://github.com/fingerprintjs/react-native/compare/v3.1.0...v3.2.0) (2024-10-08)

### Features

- use Fingerprint Pro Android v2.6.0 ([8d5c417](https://github.com/fingerprintjs/react-native/commit/8d5c417ecb0668cdbeed5bb8fd6c7042b3167c84))

## [3.1.0](https://github.com/fingerprintjs/react-native/compare/v3.0.2...v3.1.0) (2024-08-22)

### Features

- add `fallbackEndpointUrls` configuration param ([5ce1864](https://github.com/fingerprintjs/react-native/commit/5ce1864bd3a22a8c3b741bcc6c05882c7d1e5a88))
- update Android agent to v2.5.0 ([6dfcb88](https://github.com/fingerprintjs/react-native/commit/6dfcb8883f10696e56e3245d1b42753740651db4))
- update iOS agent to v2.6.0 ([dfe83b2](https://github.com/fingerprintjs/react-native/commit/dfe83b20c4f8e96243d17f4fda9446bc43b600cb))

### Documentation

- **README:** unify and simplify linkedId section ([67cb56e](https://github.com/fingerprintjs/react-native/commit/67cb56ea9d1913b360dcca28858539efe524568e))

## [3.0.2](https://github.com/fingerprintjs/react-native/compare/v3.0.1...v3.0.2) (2024-03-28)

### Build System

- **deps:** bump ip from 1.1.8 to 1.1.9 ([cb27362](https://github.com/fingerprintjs/react-native/commit/cb27362394d3b29e87a863e9610eb98bc2dfa91a))

## [3.0.1](https://github.com/fingerprintjs/react-native/compare/v3.0.0...v3.0.1) (2024-03-20)

### Bug Fixes

- publish package with correct version in integration info ([a561071](https://github.com/fingerprintjs/react-native/commit/a561071d46c3e4f011b7f6d1076d2fe26dc2883c))

## [3.0.0](https://github.com/fingerprintjs/react-native/compare/v2.6.0...v3.0.0) (2024-01-22)

### ⚠ BREAKING CHANGES

- migrated to Gradle 8
- minimum supported React Native version is 0.73

### Features

- bump major version ([401272a](https://github.com/fingerprintjs/react-native/commit/401272a113c16c19affce720c438df983ddb090c))
- update Android agent to 2.3.4 ([76ac218](https://github.com/fingerprintjs/react-native/commit/76ac2181b8b1a2e1265062ef301f8d31920a3143))
- upgrade rn to 0.73.2 ([ed3148c](https://github.com/fingerprintjs/react-native/commit/ed3148c3189d5210ae23bb763fe556f870bf6119))

### Documentation

- update requirements section ([8229a3c](https://github.com/fingerprintjs/react-native/commit/8229a3c3dd5314eacba4fa5f0cd22add9ad760a8))

## [2.6.0](https://github.com/fingerprintjs/react-native/compare/v2.5.3...v2.6.0) (2023-11-28)

### Features

- update iOS agent to 2.3.1 ([6b6f8cf](https://github.com/fingerprintjs/react-native/commit/6b6f8cfedc24602f591e9af6041a7562d8ce61f1))

### Documentation

- update requirements section ([ae5e74f](https://github.com/fingerprintjs/react-native/commit/ae5e74f0f8d4e7f68163536133aff69af1638257))

## [2.5.3](https://github.com/fingerprintjs/react-native/compare/v2.5.2...v2.5.3) (2023-10-17)

### Documentation

- add `support and feedback` section, merge `limitations` with `requirements` ([46ba804](https://github.com/fingerprintjs/react-native/commit/46ba8043472202d580cd97b84743a7de502ce3b9))
- add requirements section, revisit README.md ([c298393](https://github.com/fingerprintjs/react-native/commit/c298393026de445b627d4e7cbae874ce97661a65))
- add table of contents ([c95748d](https://github.com/fingerprintjs/react-native/commit/c95748d40bca37ad60bedea361d6f0a1dd920a7c))

## [2.5.2](https://github.com/fingerprintjs/react-native/compare/v2.5.1...v2.5.2) (2023-09-20)

### Bug Fixes

- fix package publishing problems ([cb51a80](https://github.com/fingerprintjs/react-native/commit/cb51a8037b281c29079d6aa61f3fdedd97ca6626))
- use `dist` folder instead of `build` for build artifacts to unify dx with other projects ([be9b5ca](https://github.com/fingerprintjs/react-native/commit/be9b5cad715b6b79a125f44b84d3cdc9639bf8f2))

## [2.5.1](https://github.com/fingerprintjs/react-native/compare/v2.5.0...v2.5.1) (2023-09-07)

### Documentation

- **README:** add minumum OS versions requirement ([c734fc9](https://github.com/fingerprintjs/react-native/commit/c734fc90523bd79d422d8e0f394270cf75711306))

## [2.5.0](https://github.com/fingerprintjs/react-native/compare/v2.4.0...v2.5.0) (2023-08-07)

### Features

- update Android agent to v2.3.2 ([fb5f655](https://github.com/fingerprintjs/react-native/commit/fb5f655e92d6832f3210984ae0e37fd30380d8f2))

## [2.4.0](https://github.com/fingerprintjs/react-native/compare/v2.3.1...v2.4.0) (2023-06-29)

### Features

- bump iOS Agent to v2.2.0 to introduce new Smart Signals ([e47613b](https://github.com/fingerprintjs/react-native/commit/e47613ba74e13dbbc34c30158755c25964188303))

## [2.3.1](https://github.com/fingerprintjs/react-native/compare/v2.3.0...v2.3.1) (2023-06-27)

### Bug Fixes

- mark library as not required in MainQueue [#79](https://github.com/fingerprintjs/react-native/issues/79) ([e544d7e](https://github.com/fingerprintjs/react-native/commit/e544d7e680f945ac46e085bfa88e0858cdb494f8))

## [2.3.0](https://github.com/fingerprintjs/react-native/compare/v2.2.2...v2.3.0) (2023-04-28)

### Features

- bump android dependencies ([862b327](https://github.com/fingerprintjs/react-native/commit/862b327f3385e9b6a7d111066dbc188e0a39fd28))

## [2.2.2](https://github.com/fingerprintjs/react-native/compare/v2.2.1...v2.2.2) (2023-03-22)

### Bug Fixes

- update Android agent to 2.3.0 ([de724a1](https://github.com/fingerprintjs/react-native/commit/de724a1b5914a483cf2ff6f42404ca3973fb9bf7))

## [2.2.1](https://github.com/fingerprintjs/react-native/compare/v2.2.0...v2.2.1) (2023-03-14)

### Documentation

- code snippet fix for FingerprintJsProProvider ([4249f53](https://github.com/fingerprintjs/react-native/commit/4249f53fe45b2ebb4eec82634c3bb12e1131f311))
- readme fix code snippets ([6a11ef3](https://github.com/fingerprintjs/react-native/commit/6a11ef36242584fa51f905a55e1296f1aadd2c55))

## [2.2.0](https://github.com/fingerprintjs/react-native/compare/v2.1.1...v2.2.0) (2023-02-17)

### Features

- update agents to add proxy integrations support ([51a6b45](https://github.com/fingerprintjs/react-native/commit/51a6b45a876e25d0cec272a8b9437030ca677727))

### Bug Fixes

- update Android agent to 2.2.3 to fix Cloudflare support ([cbfd260](https://github.com/fingerprintjs/react-native/commit/cbfd260dab73ea8820ca650dbd0134d11091727c))
- update iOS agent to 2.1.8 to fix fingerprintjs/fingerprintjs-pro-ios[#27](https://github.com/fingerprintjs/react-native/issues/27) ([f7929b3](https://github.com/fingerprintjs/react-native/commit/f7929b3492edd9b2f77b137a193cfc80b3fa269f))

## [2.1.1](https://github.com/fingerprintjs/react-native/compare/v2.1.0...v2.1.1) (2023-01-11)

### Bug Fixes

- remove redundant gradle dependency from library ([d7439d2](https://github.com/fingerprintjs/react-native/commit/d7439d2b21696828d610277a9d0e3ffe4be729ed))

## [2.1.0](https://github.com/fingerprintjs/react-native/compare/v2.0.0...v2.1.0) (2022-11-18)

### Features

- update android agent to 2.2.0 version ([212f601](https://github.com/fingerprintjs/react-native/commit/212f601d8d24629d69378982f21caa6e4b67c6a9))

## [2.0.0](https://github.com/fingerprintjs/react-native/compare/v1.0.4...v2.0.0) (2022-09-27)

### ⚠ BREAKING CHANGES

- In previous version `FingerprintJsProAgent` constructor had several position arguments.
  In new version it is one `params` argument of type `FingerprintJsProAgentParams`.
  Type `FingerprintJsProAgentParams` will be used instead of type `FingerprintJsProProviderOptions`.
- `getData` method of the `useVisitorData` hook now returns answer of type `VisitorData` instead of simple `visitorId` string type.

### Features

- add `extendedResponseFormat` configuration flag ([2add6cc](https://github.com/fingerprintjs/react-native/commit/2add6cc63a23410db0fab86c2097a30ec7dded63))
- add `getVisitorData` method to the react-native agent ([16b4378](https://github.com/fingerprintjs/react-native/commit/16b4378be2acbe97e592fb1fc1e3fed480977280))
- better error reporting ([f011cb7](https://github.com/fingerprintjs/react-native/commit/f011cb76f8d9f8d00ebb9577a8f3d2c03c01eb4e))
- change `FingerprintJsProAgent` constructor interface ([1b8aab9](https://github.com/fingerprintjs/react-native/commit/1b8aab9f89be378be67a15f4603068844f165a41))
- send integration info ([f52e2cf](https://github.com/fingerprintjs/react-native/commit/f52e2cfdb7b617e7d5b56c674024977d19839d71))
- support `linkedId` param for identification requests ([e8557db](https://github.com/fingerprintjs/react-native/commit/e8557db4c9d6ae1e9e341a8c40be0acba91d72c4))
- update android agent to the latest version ([4051a7b](https://github.com/fingerprintjs/react-native/commit/4051a7ba7dc5f91dc439c3c5dcc41b7f7cdab02c))
- update iOS agent to 2.1.3 ([14a0e42](https://github.com/fingerprintjs/react-native/commit/14a0e4232c4ca71bcb204d92aa9e51e64b2c12e7))
- update iOS agent to the latest version ([a33d160](https://github.com/fingerprintjs/react-native/commit/a33d160ad410b1e9bf6f43039f72fa81b5d965e0))
- update iOS agent to v2.1.1 ([f4541f2](https://github.com/fingerprintjs/react-native/commit/f4541f253b0333ee9bcd3e963799a7a78790d579))
- update iOS native agent to 2.1.2 to return support of iOS 12 ([20c7342](https://github.com/fingerprintjs/react-native/commit/20c73420eb882b4e0710f1de598498e9980239be))
- update react-native to 0.70.1 ([22b8d33](https://github.com/fingerprintjs/react-native/commit/22b8d33ee42d4c3d851ba6a97085da1a3eb0cea8))

### Bug Fixes

- async code example ([e0bd804](https://github.com/fingerprintjs/react-native/commit/e0bd804190524995c4960a13663d3992ae83a3e3))
- change substitution literal in .husky/commit_msg ([2267a30](https://github.com/fingerprintjs/react-native/commit/2267a302a22e1d0426316f05b53993527652b5af))
- error description ([c82c45b](https://github.com/fingerprintjs/react-native/commit/c82c45bfd8f9f09d7b0d3902f0b41970199b9053))
- expand Tags type ([08e6a73](https://github.com/fingerprintjs/react-native/commit/08e6a73ec91c20f9a01560b9d6eb2856330da171))
- generate iOS Metadata even if linkedId is nil ([858ac51](https://github.com/fingerprintjs/react-native/commit/858ac5171bd95b7c88abfddd08528a244c9b38af))
- getVisitorId error handling ([c2971cd](https://github.com/fingerprintjs/react-native/commit/c2971cd1e55d92e0a200d09eb73370dc18b09e17))
- pass correct `linkedId` type to the android library ([68fa2e4](https://github.com/fingerprintjs/react-native/commit/68fa2e405f924738d255de58d43fe9fd36aab696))
- tag functionality for new iOS library ([be590e6](https://github.com/fingerprintjs/react-native/commit/be590e6a4e944f00327b3484fdc6348dd2743355))

### Documentation

- **README:** add documentation badge ([62a3df1](https://github.com/fingerprintjs/react-native/commit/62a3df1a4e9f560dad4c666198ea7492b022ecff))

#### 1.0.4 (2022-08-05)

##### Bug Fixes

- add types field to package.json (42ccce56)

#### 1.0.3 (2022-07-25)

##### Chores

- add production environment for publish task (94309b78)

##### Documentation Changes

- replace fingerptintjs.com domain in links to fingerprint.com (bd14519d)
- update logo (0f06f85e)

##### Bug Fixes

- readme (71b47abe)

#### 1.0.2 (2022-05-13)

##### Documentation Changes

- second attempt to fix logo for npmjs.com (4daf6fb3)

#### 1.0.1 (2022-05-13)

##### Documentation Changes

- fix fingerprint logo for npmjs.com (c59e820a)

## 1.0.0 (2022-05-12)

##### Breaking changes

- Added react hooks approach, read [the documentation](../README.md#hooks-approach) for more details
- Due to creating hooks approach, API of client has changed, read more in [the documentation](../README.md#api-client-approach)

##### Chores

- add changelog generation and release commands (77967653)
- add publish action (e8332a73)
- fix npm package files section (63fb5641)
- change iOS codeowner (77f8f3d5)
- add iOS and Android folder to sync script (8f2ab4c1)
- update build environment (d73ad61b)
- add linter, run prettier (bcf9bbcf)
- change author in podspec to FingerprintJS Inc (ec63bfcd)
- add github action for tests and typecheck (051ebb40)
- add CODEOWNERS (25a610ab)
- fix typecheck (abd940a6)
- use rollup build (0c1d7476)
- fixed iOS build (2f2a7694)
- make agent compatible with mocks (285a7351)
- **deps:**
  - bump vulnerable simple-plist from 1.3.0 to 1.3.1 (f35317a8)
  - bump ansi-regex from 4.1.0 to 4.1.1 (584b8a60)
  - bump minimist from 1.2.5 to 1.2.6 (bd02e14f)
  - bump plist from 3.0.4 to 3.0.5 (b35d3b90)
  - bump plist from 3.0.4 to 3.0.5 in /TestProject (a9e6b776)
  - bump async from 2.6.3 to 2.6.4 (7caf632b)
  - bump minimist from 1.2.5 to 1.2.6 in /TestProject (2abc2347)
  - bump async from 2.6.3 to 2.6.4 in /TestProject (97212225)
  - bump ansi-regex from 4.1.0 to 4.1.1 in /TestProject (a465ae5a)

##### Documentation Changes

- add jsdoc to code, fix readme example (4a9e9490)
- add iOS contributing instruction (03c7da7b)
- add contributing.md (1afb9460)
- add new badges, fix existing (2e89589b)
- improve usage snippet (1f3b411e)

##### New Features

- support ap region (dcf7fd23)
- add dotenv support to TestApp, use public API key from env. (470701b7)
- add hooks approach #10, fix dev build (1a8976d1)
- add tags property to getVisitorData function (a78772f0)

##### Bug Fixes

- fix endpoint param in iOS #14 (82dc9629)

##### Tests

- add tests for provider and useVisitorData hook (fee4d8af)
