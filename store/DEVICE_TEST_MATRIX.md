# Physical-device release matrix

Record build/version, OS, device, date, tester and evidence for every row. A simulator, web preview or golden test does not complete a device row. Do not mark a row passed without observed evidence.

## Keyboard installation and lifecycle

| Check | iPhone | Android | Evidence / notes |
|---|---|---|---|
| Install/enable and select Lyfstyle | Pending | Pending | |
| Switch away/back using globe or IME picker | Pending | Pending | |
| Cold start after device reboot | Pending | Pending | |
| Rotate app and use keyboard in portrait/landscape where supported | Pending | Pending | |
| Background/foreground and host-app switching | Pending | Pending | |
| Upgrade from previous build preserves safe preferences | Pending | Pending | |

## Typing and deletion

Test in Apple Messages/Notes, WhatsApp, Instagram, Google Messages and a plain test app where available. Destination Unicode rendering may differ; record differences rather than claiming universal support.

| Input | Expected deletion | iPhone | Android | Evidence / notes |
|---|---|---|---|---|
| `abc` | One ASCII letter per tap | Pending | Pending | |
| `𝐀` / `𝒜` | Whole supplementary styled letter | Pending | Pending | |
| `e\u0301` | Whole base + combining mark | Pending | Pending | |
| `🇬🇭` | Whole flag | Pending | Pending | |
| `👨‍👩‍👧‍👦` | Whole ZWJ family emoji | Pending | Pending | |
| `👋🏽` | Whole emoji + skin tone | Pending | Pending | |
| Mixed `A𝒜é👨‍👩‍👧‍👦` | Reverse visible-grapheme order | Pending | Pending | |
| Hold delete | Controlled repeat; no runaway after release | Pending | Pending | |

## Safe Normal fields

| Field | iPhone | Android | Evidence / notes |
|---|---|---|---|
| Password and visible-password | Pending | Pending | |
| Email and web email | Pending | Pending | |
| URL | Pending | Pending | |
| Phone | Pending | Pending | |
| Number, decimal and signed number | Pending | Pending | |
| Numeric and text OTP | Pending | Pending | |
| Normal multiline message restores selected style | Pending | Pending | |

## Catalogue and UI

| Check | iPhone | Android | Evidence / notes |
|---|---|---|---|
| Exactly 24 styles; 12 free and 12 Pro; Normal separate | Pending | Pending | |
| Locked Pro styles never commit after selection/revocation | Pending | Pending | |
| Favourites/recents persist and recover safely | Pending | Pending | |
| Four themes render legibly with sufficient contrast | Pending | Pending | |
| No automatic decorative wrappers in keyboard input | Pending | Pending | |
| VoiceOver / TalkBack labels and actions | Pending | Pending | |
| Dynamic Type/font scaling and smallest supported screen | Pending | Pending | |
| Keyboard height and safe areas across host apps | Pending | Pending | |

## Pro and entitlement matrix

Use sandbox/internal-test products only. Never place real payment credentials in notes or screenshots.

| Scenario | iPhone | Android | Evidence / notes |
|---|---|---|---|
| Accurate store-localised product title/price | Pending | Pending | |
| New lifetime purchase | Pending | Pending | |
| Transaction interruption/cancellation | Pending | Pending | |
| Restore on same device | Pending | Pending | |
| Restore after reinstall | Pending | Pending | |
| Second device using same store account | Pending | Pending | |
| Refund/revocation removes Pro | Pending | Pending | |
| Offline launch uses only documented cache behaviour | Pending | Pending | |
| Store state refresh reconciles cached ownership | Pending | Pending | |

### Additional iOS entitlement matrix

| Full Access | App Group Pro value | Direct StoreKit entitlement | Expected / observed |
|---|---|---|---|
| Off | Off/absent | Present | Must establish whether direct extension reading works |
| Off | Off/absent | Absent | Free only |
| On | On | Present | Pro |
| On | On | Absent/unavailable | Fallback Pro, if verified |
| On | Off | Absent | Free only |
| Toggle Off after cached Pro | Varies | Varies | No stale or unintended entitlement |

Record the actual supported path and update privacy/review copy before release. Do not require Full Access merely to make an untested implementation work.

## Privacy and release hygiene

| Check | Result | Evidence / notes |
|---|---|---|
| Network review shows no typed-content transmission | Pending | |
| Public privacy and support URLs resolve | Pending | |
| Console metadata matches tested build and actual IAP | Pending | |
| Real screenshots contain no private data or fabricated UI | Pending | |
| Signed build uses Frederick-approved identities/profiles only | Pending | |
