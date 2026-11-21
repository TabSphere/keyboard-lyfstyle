# Lyfstyle decisions

## Product contract

Lyfstyle is a Unicode fancy-text composer and native keyboard, not a system-font installer. It never claims to restyle arbitrary apps. Destination rendering depends on the receiving app, operating system and available fonts.

The launch catalogue contains exactly 24 styled entries: 12 free and 12 Pro. Normal Text is a separate mode, not a 25th style. All mappings are manually audited and generated from one source into TypeScript, Kotlin and Swift assets.

The composer may apply six explicit decorations. Neither keyboard applies wrappers automatically. Keyboard input remains predictable and suitable for messaging and form entry.

## Platforms

- Expo SDK 55, React 19.2 and React Native 0.83.10.
- TypeScript application using Expo Router with `src/app` and typed routes.
- iOS deployment target 16.4; Swift `UIInputViewController` extension through `@bacons/apple-targets`.
- Android minimum API 26, target/compile API 36; Kotlin `InputMethodService`.
- Main ID: `com.tabsphere.keyboardlyfstyle`.
- iOS keyboard ID: `com.tabsphere.keyboardlyfstyle.keyboard`.
- Pro product ID: `com.tabsphere.keyboardlyfstyle.pro`.
- App Group: `group.com.tabsphere.keyboardlyfstyle`.

Generated `ios/` and `android/` directories are not versioned. Native behaviour belongs in `targets/`, `modules/`, configuration plugins and Expo config.

## Interaction and visual system

Composer-first onboarding shows the user’s own words transformed before setup or payment. The interface uses warm ivory, paper, near-black and coral with Instrument Serif and DM Sans. Primary actions use the darker coral token with white text for contrast.

Keyboard themes are Porcelain, Ink, Mono and Blush. The custom theme editor, Font Art, subscriptions, accounts, backend, analytics, ads, predictions, autocorrect and AI rewriting are outside v1.

## Unicode behaviour

Transformations operate on Unicode code points. Mathematical alphanumeric mappings and explicit exceptions are defined in the generated catalogue. Combining overlays are deterministic. Unsupported characters pass through unchanged and are identified in composer compatibility details.

Normal mode preserves input exactly. Password/secure fields, email, URL, phone, numeric and OTP inputs must use Normal mode automatically.

Backspace must delete complete visible grapheme clusters, including supplementary letters, combining sequences and complex emoji. Android uses `android.icu.text.BreakIterator`; iOS uses Swift grapheme-boundary semantics. Shared golden fixtures cover engine parity, but they do not replace cross-app physical-device deletion tests.

## Privacy

Nothing typed is uploaded. Drafts, favourites, recents and keyboard preferences are local. Copy and share are explicit user actions. There are no analytics or ads.

Core iOS keyboard functionality must work without Full Access. Direct StoreKit entitlement reading is attempted first. Optional Full Access/App Group Pro synchronisation is only a fallback and its ON/OFF behaviour must be verified on devices before any privacy claim is finalised for release.

Android keyboard preferences use credential-protected storage. Direct-boot support is not advertised.

## Purchases

Pro is a lifetime non-consumable purchase. The UI reads store-localised `displayPrice`; it does not hardcode the earlier $7.99 hypothesis. Restore is available in the main app. Neither keyboard contains purchase, upgrade or rating prompts.

The app may cache Pro locally while store state is unchecked, but purchase completion requires the expected product ID and purchased state. Transactions are finished only after ownership is persisted. Refund, revocation, reinstall, restore and offline-cache behaviour remain release-blocking device tests.

## Build and dependency decisions

The React Native Gradle plugin’s Foojay resolver is patched from 0.5.0 to 1.0.0 with `patch-package`; version 0.5.0 fails under Gradle 9 with `NoSuchFieldError: IBM_SEMERU`. The patch must remain until the dependency itself is upgraded and verified.

No blind `npm audit fix --force` is permitted. After removing unused `expo-sharing` and adding Expo’s standard lint tooling, a 2026-11-21 audit reported 20 findings (14 moderate, six high). Suggested remediations mostly require major Expo/Router upgrades or have no compatible fix. Treat this as a documented compatibility review item, not as permission to jump SDKs during the current phase.

## Review and release governance

One branch and one PR per phase; never push directly to `main`. Every PR states what was built, how to test it and known gaps. Claude reviews/tests PRs and Frederick merges them. Implementation authorisation does not authorise merging.

Never commit `.p8` files, signing keys, keystores, passwords or tokens. Use GitHub Secrets for CI credentials. Do not create App IDs, store listings or signing keys autonomously; stop at Frederick’s manual prerequisite.

No fabricated screenshots, device tests, purchase results, signing results or store readiness claims. Unsigned CI and golden tests establish code health only, not device/store approval.
