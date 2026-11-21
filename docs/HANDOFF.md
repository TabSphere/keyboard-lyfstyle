# Lyfstyle implementation handoff

Last updated: 2026-11-21. This file distinguishes executed checks from planned checks. Update it after every verification run.

## Implemented

- Complete Expo Router app: Write, Looks, Keyboard and Settings tabs; Pro, privacy and compatibility/about screens.
- Functional composer: raw input, live styled output, 280-character limit, compatibility notes, style selection, explicit decorations, favourites/recents, copy and native share.
- Exactly 24 styled entries (12 free, 12 Pro), Normal Text, six decorations and four keyboard themes generated from one catalogue.
- Original Lyfstyle app/splash/adaptive-icon artwork.
- Android IME and setup/status/Pro native bridge; iOS keyboard extension and local native module integration.
- StoreKit 2 / Play Billing Pro flow with local caching and native entitlement synchronisation hooks.
- Cross-language golden fixtures and standalone Swift/Kotlin test harnesses.
- Unsigned GitHub Actions for shared/web checks, Android debug compilation/unit tests and iOS simulator compilation/Swift fixtures.

## Verified in this environment

- TypeScript: 10/10 tests pass, including all 11 shared golden fixtures; the final source state was rerun directly after the last code change.
- TypeScript strict typecheck passes.
- Expo lint passes with zero errors and zero warnings.
- Production web export passes after the final catalogue/icon changes. Mobile-browser review confirmed exactly 24 Looks, preserved `é` and family emoji in styled previews, no horizontal overflow, and zero browser console errors or warnings on the final cold load.
- Kotlin: the full Gradle `:lyfstyle-keyboard:testDebugUnitTest` task passes 3/3 tests, including all 11 shared golden fixtures, unknown-style Normal fallback and the 12 free/12 Pro contract. Lyfstyle production Kotlin compilation also passes.
- Expo Doctor: 20/20 checks pass.
- Original app icon artwork was visually inspected.
- The official Gradle 9.0.0 binary checksum was used to validate the locally downloaded build tool. The large React Native Android AAR and CMake packages were also checked against official checksums. These validate tooling only, not application output.

See the section below for native checks still running or blocked; do not infer success from the presence of source or CI files.

## Not yet verified / release-blocking

- Android `:app:assembleDebug`: no APK has been produced. Full local compilation progressed through Lyfstyle Kotlin, native tests and multiple ABI builds, then stalled during app x86 native output. A restricted ARM64 retry also stalled because native-output cleanup blocked the persistent filesystem. Treat this as an unverified build, not a source failure or a passing APK check.
- Standalone Swift golden tests and iOS app/extension compilation.
- Real Android/iPhone keyboard installation, globe/IME switching and rendering across target apps.
- Grapheme deletion across supplementary letters, combining marks and complex emoji on physical devices.
- Automatic Normal mode for all secure/specialised field types on both platforms.
- StoreKit entitlement access inside the extension and the Full Access/App Group ON/OFF matrix.
- Purchases, restore, reinstall, refunds/revocation and offline cache on both stores.
- Physical-device VoiceOver/TalkBack, Dynamic Type, layout and theme review.
- Signed CI, App Store Connect/Play Console configuration and TestFlight/internal testing.

No real-device tests, signed builds, TestFlight uploads, purchases or store submissions have occurred.

## Reproduce checks

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run export:web
npx expo-doctor
```

Android, with JDK 17 and Android SDK 36:

```sh
npx expo prebuild --platform android --clean
./android/gradlew -p android :app:assembleDebug :lyfstyle-keyboard:testDebugUnitTest --stacktrace
```

iOS, on macOS after supplying the real team ID:

```sh
APPLE_TEAM_ID=REAL_TEAM_ID npx expo prebuild --platform ios --clean
npm run generate
xcrun swiftc targets/keyboard/StyleCatalogue.swift scripts/native-tests/swift/main.swift -o /tmp/lyfstyle-golden-tests
/tmp/lyfstyle-golden-tests shared/styles.json shared/golden-tests.json
pod install --project-directory=ios
xcodebuild -workspace ios/Lyfstyle.xcworkspace -scheme Lyfstyle -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

## Frederick’s manual prerequisites

### Repository bootstrap

The GitHub repository has no `main` branch. Create the initial `main` branch through GitHub’s repository setup UI (a minimal README commit is sufficient). This is intentionally left to Frederick because the project rule prohibits the assistant from pushing directly to `main`. Review branches and PRs can then target that branch; do not merge them without Frederick’s confirmation.

### Apple Developer / App Store Connect

1. Supply the Apple Developer Team ID through `APPLE_TEAM_ID`; do not place secrets in source.
2. Create/approve the main and keyboard App IDs with identical bundle IDs listed in `docs/DECISIONS.md`.
3. Create/approve `group.com.tabsphere.keyboardlyfstyle` and enable it for both App IDs/profiles.
4. Create the non-consumable IAP `com.tabsphere.keyboardlyfstyle.pro`, set localised pricing and prepare its review metadata.
5. Create/approve signing certificates and provisioning through the team’s normal process. Never send private keys in chat or commit them.
6. Create the App Store Connect app record only when Frederick is ready; prepare a public privacy URL and support URL.
7. Add TestFlight testers and complete export/compliance questions after a signed build passes real-device checks.

### Google Play

1. Create/approve the Play app record with package `com.tabsphere.keyboardlyfstyle`.
2. Create the non-consumable product `com.tabsphere.keyboardlyfstyle.pro` and set localised pricing.
3. Configure Play App Signing/upload credentials through the team’s normal process; keep upload keys out of git.
4. Prepare Data Safety, privacy policy, content rating, target-audience and app-access declarations.
5. Create an internal-testing track and tester list only after device verification.

### CI signing, after the unsigned workflow is green

Use the existing Wobble Ink GitHub Actions signing approach as the starting point. Add Apple certificates/profiles or ASC API credentials and Android upload secrets only through GitHub Secrets. macOS runner minutes may incur cost; do not describe them as free. Do not trigger a signed release workflow without Frederick’s approval.

## Dependency review

`npm audit` on 2026-11-21 reported 14 moderate and six high findings, with zero critical findings, after removing unused `expo-sharing` and adding the standard Expo lint tooling. Affected direct/transitive packages include Expo build tooling, `@bacons/apple-targets`, `@xmldom/xmldom`, Expo Router’s `query-string`/`decode-uri-component` chain and `zod`. Proposed automatic fixes often require Expo 57/58 or have no fix. No forced upgrade was run. Re-audit after dependency cleanup and schedule a separate SDK upgrade/regression phase rather than destabilising the native spike.

## Next sequence

1. Complete Android `:app:assembleDebug` from a local native-build directory rather than persistent synchronized storage; do not claim an APK until its output metadata and package are inspected.
2. Run Swift fixtures and unsigned iOS compilation on macOS CI.
3. Complete the Android physical-device IME/deletion/safe-field matrix.
4. Complete the iOS TestFlight spike, entitlement and Full Access matrix, then stop for Frederick’s store/signing actions.
5. Prepare real store screenshots only from verified devices and finalise public privacy/support pages and review notes.
