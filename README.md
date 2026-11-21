# Lyfstyle

A local-first fancy-text keyboard for iOS and Android, contained in an Expo + TypeScript app. Lyfstyle creates Unicode-styled text for messages, captions, bios and usernames; it does not install system fonts or restyle other apps.

## Product in v1

- Composer-first experience with 24 manually audited styles: 12 free and 12 Pro, plus Normal Text.
- Six explicit composer decorations. Neither keyboard adds decorative wrappers automatically.
- Porcelain, Ink, Mono and Blush keyboard themes.
- Native iOS `UIInputViewController` and Android `InputMethodService` implementations.
- No accounts, backend, analytics, ads, predictions, autocorrect or AI rewriting.
- Lifetime Pro through StoreKit 2 / Play Billing, with store-localised pricing.
- No purchase, upgrade or rating prompts inside either keyboard.
- Unsupported characters remain unchanged. Safe fields automatically use Normal mode.

## Repository map

- `src/app/` — Expo Router app screens.
- `src/styleEngine.ts` — TypeScript transformation engine.
- `scripts/build-styles.mjs` — single catalogue generator for TypeScript, Kotlin and Swift consumers.
- `shared/styles.json` — generated production catalogue.
- `shared/golden-tests.json` — cross-language Unicode fixtures.
- `modules/lyfstyle-keyboard/` — local Expo native module and Android IME.
- `targets/keyboard/` — iOS keyboard extension source.
- `.github/workflows/ci.yml` — unsigned web, Android and iOS verification.

## Local development

Requirements: Node 22, npm, JDK 17 and the platform tools for the native target being built.

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm start
```

The browser is useful for composer and navigation review only. Native keyboard installation, entitlement handling and purchases require development/store builds on real devices.

### Web verification

```sh
npm run export:web
```

### Android unsigned verification

Generate native files, then build the app and run the local Kotlin catalogue tests:

```sh
npx expo prebuild --platform android --clean
./android/gradlew -p android :app:assembleDebug :lyfstyle-keyboard:testDebugUnitTest
```

Android SDK 36 and Build Tools 36.0.0 are required; minimum Android API is 26. The debug APK is unsigned for release and must never be represented as a store-ready artifact.

### iOS unsigned verification

On macOS with Xcode and CocoaPods:

```sh
APPLE_TEAM_ID=YOUR_TEAM_ID npx expo prebuild --platform ios --clean
npm run generate
xcrun swiftc targets/keyboard/StyleCatalogue.swift scripts/native-tests/swift/main.swift -o /tmp/lyfstyle-golden-tests
/tmp/lyfstyle-golden-tests shared/styles.json shared/golden-tests.json
pod install --project-directory=ios
xcodebuild -workspace ios/keyboardlyfstyle.xcworkspace -scheme keyboardlyfstyle -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Do not invent an Apple Team ID for a signed build. Frederick must create/approve the App IDs, App Group, IAP and signing assets before TestFlight.

## Style generation

Edit only the audited source definitions in `scripts/build-styles.mjs`, then run:

```sh
npm run generate
npm test
```

The generator writes the app catalogue, both native keyboard copies and Android test resources. Do not hand-edit generated JSON files.

## Privacy and release boundary

Typed text, drafts, favourites and native keyboard preferences stay on device. Copy/share happens only after an explicit user action. Store entitlement traffic is limited to Apple/Google purchase infrastructure.

Read `docs/HANDOFF.md` for exact verified/unverified status and `docs/DECISIONS.md` for the product contract. Real-device IME, deletion, accessibility and purchase matrices remain mandatory before submission.
