<p align="center">
  <a href="https://fingerprint.com">
    <picture>
     <source media="(prefers-color-scheme: dark)" srcset="https://fingerprintjs.github.io/home/resources/logo_light.svg" />
     <source media="(prefers-color-scheme: light)" srcset="https://fingerprintjs.github.io/home/resources/logo_dark.svg" />
     <img src="https://fingerprintjs.github.io/home/resources/logo_dark.svg" alt="Fingerprint logo" width="312px" />
   </picture>
  </a>
</p>
<p align="center">
  <a href="https://fingerprintjs.github.io/react-native/coverage/">
    <img src="https://fingerprintjs.github.io/react-native/coverage/badges.svg" alt="coverage">
  </a>
  <a href="https://www.npmjs.com/package/@fingerprint/react-native">
    <img src="https://img.shields.io/npm/v/@fingerprint/react-native.svg?style=flat" alt="Current NPM version"/>
  </a>
  <a href="https://www.npmjs.com/package/@fingerprint/react-native">
    <img src="https://img.shields.io/npm/dm/@fingerprint/react-native.svg" alt="Monthly downloads from NPM">
  </a>
   <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/:license-mit-blue.svg?style=flat"/>
  </a>
  <a href="https://discord.gg/39EpE2neBg">
    <img src="https://img.shields.io/discord/852099967190433792?style=logo&label=Discord&logo=Discord&logoColor=white" alt="Discord server">
  </a>
    <a href="https://fingerprintjs.github.io/react-native/">
      <img src="https://img.shields.io/badge/-Documentation-green" alt="Discord server">
    </a>
</p>

# Fingerprint Pro React Native

[Fingerprint](https://fingerprint.com/) is a device intelligence platform offering industry-leading accuracy.
Fingerprint Pro React Native SDK is an easy way to integrate Fingerprint Pro into your React Native
application to call the native Fingerprint Pro libraries (Android and iOS) and identify devices.

## Table of contents

- [Fingerprint Pro React Native](#fingerprint-pro-react-native)
  - [Table of contents](#table-of-contents)
  - [Requirements and limitations](#requirements-and-limitations)
  - [Dependencies](#dependencies)
  - [How to install](#how-to-install)
    - [Expo setup](#expo-setup)
      - [1. Add config plugin](#1-add-config-plugin)
      - [2. Rebuild the native code](#2-rebuild-the-native-code)
      - [3. Rebuild the app](#3-rebuild-the-app)
    - [Bare react-native](#bare-react-native-setup)
      - [1. Configure iOS dependencies (if developing on iOS)](#1-configure-ios-dependencies-if-developing-on-ios)
      - [2. Configure Android dependencies (if developing on Android)](#2-configure-android-dependencies-if-developing-on-android)
  - [Usage](#usage)
    - [Hooks approach](#hooks-approach)
    - [API Client approach](#api-client-approach)
    - [Response format](#response-format)
    - [Error handling](#error-handling)
    - [Linking and tagging information](#linking-and-tagging-information)
  - [API Reference](#api-reference)
  - [Additional Resources](#additional-resources)
  - [Support and feedback](#support-and-feedback)
  - [License](#license)

## Requirements and limitations

- React Native 0.80 or higher is supported (New Architecture only)
- Expo 54.0.0 or higher is supported
- Android 7.0 (API level 24+) or higher
- iOS 15.1+/tvOS 15.1+, Swift 5.9 or higher (stable releases)

- Fingerprint Pro [request filtering](https://dev.fingerprint.com/docs/request-filtering) is not supported right now. Allowed and forbidden origins cannot be used.

## Dependencies

- [Fingerprint Pro iOS](https://github.com/fingerprintjs/fingerprintjs-pro-ios)
- [Fingerprint Pro Android](https://github.com/fingerprintjs/fingerprintjs-pro-android)

## How to install

Install the package using your favorite package manager:

- [NPM](https://npmjs.org):

  ```shell
  npm install @fingerprint/react-native --save
  ```

- [Yarn](https://yarnpkg.com):

  ```shell
  yarn add @fingerprint/react-native
  ```

- [PNPM](https://pnpm.js.org):
  ```shell
  pnpm add @fingerprint/react-native
  ```

## Expo setup

> ℹ️ Our SDK cannot be used in [Expo Go](https://expo.dev/go) because it requires custom native code.

<details>
<summary>Web support</summary>
To use the SDK on the web, install the peer dependency with your preferred package manager:

- [NPM](https://npmjs.org):

  ```shell
  npm install @fingerprint/agent --save
  ```

- [Yarn](https://yarnpkg.com):

  ```shell
  yarn add @fingerprint/agent
  ```

- [PNPM](https://pnpm.js.org):
  ```shell
  pnpm add @fingerprint/agent
  ```

Then, use the SDK as you would with the native version.
</details>

### 1. Add config plugin
```json
{
  "expo": {
    "plugins": [
      "@fingerprint/react-native"
    ]
  }
}
```

### 2. Rebuild the native code
```bash
npx expo prebuild --clean
```

### 3. Rebuild the app
For Android:
```bash
npx expo run:android
```

For iOS:
```bash
npx expo run:ios
```

## Bare react-native setup

### 1. Configure iOS dependencies (if developing on iOS)

```shell
cd ios && pod install
```

### 2. Configure Android dependencies (if developing on Android)

Add the repositories to your Gradle configuration file. The location for these additions depends on your project's structure and the Gradle version you're using:

You likely manage repositories in the `dependencyResolutionManagement` block in `{rootDir}/android/settings.gradle`. Add the Maven repositories in this block:

```groovy
dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
  repositories {
    google()
    mavenCentral()
    maven {
      url("https://maven.fpregistry.io/releases") // Add this
    }
  }
}
```

## Usage

To identify visitors, you need a Fingerprint Pro account (you can [sign up for free](https://dashboard.fingerprint.com/signup/)).

- Go to [the Fingerprint Pro dashboard](https://dashboard.fingerprint.com/).
- Open **App Settings** > **API Keys** to find your Public API key.

### Hooks approach

Configure the SDK by wrapping your application in `FingerprintProvider`.

> ⚠️ **Important**: Applications should create only one client across the entire app, either through `FingerprintProvider` or through the API client (`start()`). If you create another client, it will overwrite the underlying native client of the first one.

```javascript
// src/index.js
import React from 'react';
import { AppRegistry } from 'react-native';
import { FingerprintProvider } from '@fingerprint/react-native';
import App from './App';
import { name as appName } from './app.json';

const WrappedApp = () => (
        <FingerprintProvider apiKey={'your-fpjs-public-api-key'} region={'eu'}>
          <App />
        </FingerprintProvider>
)

AppRegistry.registerComponent(appName, () => WrappedApp);
```

Use the `useVisitorData` hook in your components to perform visitor identification and get the data.

```javascript
// src/App.js
import React from 'react'
import {Button, SafeAreaView, Text, View} from 'react-native'
import {useVisitorData} from '@fingerprint/react-native'

export default function App() {
  const {isLoading, isFetched, error, data, getData} = useVisitorData()

  return (
          <SafeAreaView>
            <View style={{ margin: 8 }}>
              <Button title='Reload data' onPress={() => getData().catch(() => {})} />
              {isLoading ? (
                      <Text>Loading...</Text>
              ) : (
                      <>
                        <Text>VisitorId: {data?.visitor_id}</Text>
                        <Text>Full visitor data:</Text>
                        <Text>{error ? error.message : JSON.stringify(data, null, 2)}</Text>
                      </>
              )}
            </View>
          </SafeAreaView>
  )
}
```

> ℹ️ By default the hook does **not** fetch automatically. Pass `useVisitorData({ immediate: true })`
> to identify on mount and whenever the request options change.


> ⚠️ Caching is available only on **web** and is disabled by default.
> To enable caching on web, pass the JavaScript agent [cache](https://docs.fingerprint.com/reference/js-agent-start-function#cache) option:
> ```jsx
> <FingerprintProvider apiKey={'your-fpjs-public-api-key'} region={'eu'} web={{ cache: { storage: 'sessionStorage', duration: 'optimize-cost' } }}>
>   <App />
> </FingerprintProvider>
> ```
### API Client approach

Create a client with `start()` and call `get()`:

> ⚠️ **Important**: Applications should create only one client across the entire app, either through `FingerprintProvider` or through the API client (`start()`). If you create another client, it will overwrite the underlying native client of the first one.

```javascript
import React, { useEffect } from 'react';
import { start } from '@fingerprint/react-native';

// ...

useEffect(() => {
  async function getVisitorInfo() {
    try {
      const fp = start({ apiKey: 'PUBLIC_API_KEY', region: 'eu' }); // Region may be 'us', 'eu', or 'ap'
      const result = await fp.get();
      console.log(result.visitor_id, result.event_id);
    } catch (e) {
      console.error('Error: ', e);
    }
  }
  getVisitorInfo();
}, []);
```

Inside the React tree you can also get the same client from context with the `useFingerprint()` hook:

```javascript
import { useFingerprint } from '@fingerprint/react-native';

const fp = useFingerprint();
const result = await fp.get({ linkedId: 'user_1234' });
```

### Response format

The response is a flat, snake_case object that matches the Fingerprint Server API v4 and the JS agent.

```typescript
interface FingerprintResponse {
  visitor_id?: string // `undefined` if [zero-trust-mode](https://docs.fingerprint.com/docs/zero-trust-mode) is enabled
  event_id: string
  suspect_score?: number // present only when Smart Signals are enabled
  sealed_result: string | null // base64 sealed result, or null when unavailable
  cache_hit?: boolean // Used only on web, on native always set to `undefined`
}
```

### Error handling

Every failure is thrown as a single `FingerprintError` carrying a machine-friendly `code` (e.g.
`too_many_requests`) and a resolution-oriented `message`:

```javascript
import { isFingerprintError } from '@fingerprint/react-native';

try {
  await fp.get();
} catch (error) {
  if (isFingerprintError(error) && error.code === 'too_many_requests') {
    // handle rate limiting
  }
}
```

### Linking and tagging information

The `visitor_id` provided by Fingerprint Identification is especially useful when combined with information you already know about your users, for example, account IDs, order IDs, etc. To learn more about various applications of the `linkedId` and `tags`, see [Linking and tagging information](https://docs.fingerprint.com/docs/tagging-information).

Pass `tags` and `linkedId` in a single options object:

```javascript
const tags = {
  userAction: 'login',
  analyticsId: 'UA-5555-1111-1'
};
const linkedId = 'user_1234';

// Using hooks
const { getData } = useVisitorData();
const visitorData = await getData({ tags, linkedId });

// Using the client
const fp = start({ apiKey: 'PUBLIC_API_KEY' });
const visitor = await fp.get({ tags, linkedId });
```

### Proximity Detection

Proximity detection is a complementary, location-based signal available only on mobile platforms.
You can find more information in [Android SDK documentation](https://dev.fingerprint.com/docs/native-android-integration#proximity-detection-for-android-devices) or in
[iOS SDK documentation](https://dev.fingerprint.com/docs/ios-sdk#using-location-data-for-proximity-detection).

Platform-only options are grouped under `android` and `ios`. The Fingerprint SDK will only collect
location data if `allowUseOfLocationData` is set to `true`.

```javascript
return (
        <FingerprintProvider apiKey={PUBLIC_API_KEY} android={{ allowUseOfLocationData: true }} ios={{ allowUseOfLocationData: true }}>
          <App />
        </FingerprintProvider>
)
```

For the Android platform it's possible to configure the location retrieval timeout by setting the `locationTimeoutMillis` option to a desired value. By default, it's set to 5 seconds.
The SDK will delay identification up to the specified timeout to collect the device location. If it cannot collect the location information within the specified time, identification continues without location information.

```javascript
return (
        <FingerprintProvider apiKey={PUBLIC_API_KEY} android={{ allowUseOfLocationData: true, locationTimeoutMillis: 10000 }}>
          <App />
        </FingerprintProvider>
)
```

### Custom endpoints

To avoid ad blockers, proxy identification through a [proxy integration](https://docs.fingerprint.com/docs/protecting-the-javascript-agent-from-adblockers). Pass identification URLs as `endpoints`, first to last.

We recommend including the default API URL for your [region](https://docs.fingerprint.com/docs/regions) as a fallback: `https://api.fpjs.io` (US), `https://eu.api.fpjs.io` (EU), `https://ap.api.fpjs.io` (Asia). There are no fallbacks by default.


```javascript
return (
        <FingerprintProvider 
                apiKey={PUBLIC_API_KEY} 
                endpoints={[
                  'https://metrics.yourwebsite.com',
                  'https://api.fpjs.io'
        ]}>
          <App />
        </FingerprintProvider>
)
```

## API Reference

See the full [generated API Reference](https://fingerprintjs.github.io/react-native/).

## Additional Resources

- [Server-to-Server API](https://dev.fingerprint.com/docs/server-api)
- [Fingerprint Pro documentation](https://dev.fingerprint.com/docs)

## Support and feedback

To report problems, ask questions or provide feedback, please
use [Issues](https://github.com/fingerprintjs/react-native/issues). If you need private support,
please email us at `oss-support@fingerprint.com`.

## License

This project is licensed under the [MIT license](https://github.com/fingerprintjs/react-native/blob/main/LICENSE).
