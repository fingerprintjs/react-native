// swift-tools-version: 6.0
//
// Swift Package Manager manifest for
// @fingerprint/react-native, consumed by React Native
// 0.87's experimental SwiftPM autolinking (`npx react-native spm`).
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS IS HAND-WRITTEN (not produced by `react-native spm scaffold`)
// ─────────────────────────────────────────────────────────────────────────────
// The scaffolder SKIPS this library ("skipped-mixed-language"): ios/ mixes Swift
// and Objective-C++, and a single SwiftPM target cannot contain both languages
// (SE-0403 would lift this but is not shipped). The ObjC++ file is unavoidable —
// RN 0.87 has no Swift path for the TurboModule `getTurboModule:` step, which
// must return the codegen'd C++ JSI spec. The supported workaround is the
// two-target split below: a pure-Swift target plus a thin ObjC++ glue target
// that depends on it.
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  NOT YET VALIDATED BY A REAL BUILD
// ─────────────────────────────────────────────────────────────────────────────
// RN's SwiftPM support is experimental ("do not use in production yet"). This
// manifest evaluates cleanly (`swift package dump-package`) but has NOT been
// exercised by an Xcode SwiftPM build in a consuming app. Confirm on a machine
// with Xcode + the e2e-app (via `npx react-native spm --deintegrate` then a
// detox build):
//   1. The Swift target resolves RCTPromise* via `import React` (RCT_SPM flag).
//   2. The Fingerprint v4 SwiftPM product/module identity below is correct.
//   3. The ObjC++ glue picks up RNFingerprintSwift-Swift.h.
//
// The package/product name is pinned to `RNFingerprint` (matching the pod /
// native module) via `spm.name` in react-native.config.js. The autolinker uses
// that name for its libs/<name> symlink and the product it references, so the
// product below must match it.
//
// The React / React-GeneratedCode packages use RELATIVE paths that assume this
// manifest is reached through the autolinker's libs/RNFingerprint symlink —
// the same fixed depth `react-native spm scaffold` targets. They are resolved
// from the CONSUMING APP, not this repo; do not repoint them here.

import PackageDescription

let package = Package(
    name: "RNFingerprint",
    // 15.0, NOT the podspec's 15.1: RN 0.87's SPM autolinker hardcodes its
    // AutolinkedAggregate target at `.iOS(.v15)` (= 15.0) and gives no knob, so
    // any library product requiring >15.0 fails resolution with "requires
    // minimum platform version 15.1 ... but this target supports 15.0". The
    // effective floor still comes from the app's IPHONEOS_DEPLOYMENT_TARGET.
    platforms: [.iOS(.v15), .tvOS(.v15)],
    products: [
        .library(
            name: "RNFingerprint",
            targets: ["RNFingerprint"]
        ),
    ],
    dependencies: [
        // These two are parts of the CONSUMING APP, not registry packages, so
        // they're referenced by local path. `ReactNative` is RN's prebuilt
        // xcframeworks + header products; `React-GeneratedCode` is the app's
        // per-app codegen output (the `ReactAppHeaders` product). The relative
        // paths resolve from the autolinker's libs/RNFingerprint symlink
        // (a fixed depth in <app>/ios/build/generated/autolinking/), NOT from
        // this repo, so `../../../../xcframeworks` lands on <app>/ios/build/
        // xcframeworks and `../../../ios` on the generated codegen package.
        // They look wrong relative to sdk/ but are correct in every app; do not
        // repoint them. (This mirrors what `react-native spm scaffold` emits.)
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
        .package(
            url: "https://github.com/fingerprintjs/fingerprint-ios",
            .upToNextMinor(from: "4.1.0")
        ),
    ],
    targets: [
        // Pure-Swift implementation: all business logic + the Fingerprint SDK
        // calls. Kept single-language so SwiftPM accepts the target.
        .target(
            name: "RNFingerprintSwift",
            dependencies: [
                .product(name: "ReactHeaders", package: "ReactNative"),
                .product(name: "ReactNativeHeaders", package: "ReactNative"),
                .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
                .product(name: "Fingerprint", package: "fingerprint-ios"),
            ],
            path: "ios",
            exclude: [
                "turbomodule",
                "RNFingerprint-Bridging-Header.h",
                "RNFingerprint.xcodeproj",
                "build",
            ],
            sources: [
                "FPError+React.swift",
                "JSONTypeConvertor.swift",
                "RNFingerprint.swift",
            ],
            // swift-tools-version 6.0 defaults targets to Swift 6 language mode,
            // whose strict concurrency rejects capturing the non-Sendable ObjC
            // block typedefs RCTPromiseResolveBlock/RCTPromiseRejectBlock inside
            // the Fingerprint SDK's @Sendable completion closure. CocoaPods builds
            // this pod in Swift 5 mode; match that so behavior is identical.
            swiftSettings: [.define("RCT_SPM"), .swiftLanguageMode(.v5)]
        ),
        // Objective-C++ TurboModule glue: registers the native module and returns
        // the codegen'd C++ JSI spec (`NativeRNFingerprintSpecJSI`). This
        // cannot be Swift. Depends on the Swift target for its generated header.
        .target(
            name: "RNFingerprint",
            dependencies: [
                "RNFingerprintSwift",
                .product(name: "ReactHeaders", package: "ReactNative"),
                .product(name: "ReactNativeHeaders", package: "ReactNative"),
                .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
                .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
            ],
            path: "ios/turbomodule",
            publicHeadersPath: ".",
            cSettings: [
                .headerSearchPath("."),
                .unsafeFlags(["-include", "react-native-spm-prefix.h"]),
            ],
            cxxSettings: [
                .headerSearchPath("."),
                .unsafeFlags(["-include", "react-native-spm-prefix.h"]),
                // Match the prebuilt React.framework's config-gated C++ ABI
                // (NDEBUG in Release), mirroring what `spm scaffold` emits.
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
            ],
            linkerSettings: [
                .linkedFramework("UIKit"),
                .linkedFramework("Foundation"),
                .linkedFramework("CoreGraphics"),
            ]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
