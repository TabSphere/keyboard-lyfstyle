## Phase

<!-- One phase per PR. Name the phase and keep scope bounded. -->

## What was built

-

## How to test

```sh
npm ci
npm test
npm run typecheck
npm run export:web
npx expo-doctor
```

List additional native/device commands and observed results here. Distinguish executed checks from CI-planned checks.

## Known gaps

- No real-device result may be inferred from web, unit-test or unsigned-build success.
- No purchase, signing or TestFlight result may be claimed without evidence.

## Privacy, security and release checklist

- [ ] No secrets, signing keys, keystores or private tokens committed.
- [ ] Nothing typed is uploaded; no analytics or ads added.
- [ ] No purchase, upgrade or rating prompts added to either keyboard.
- [ ] No direct push or merge to `main` included.
- [ ] Frederick’s manual store/signing steps are clearly identified.
- [ ] Documentation reflects exact verified and unverified status.

## Review

Claude reviews/tests the PR. Frederick decides whether to merge.
