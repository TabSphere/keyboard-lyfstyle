import { InfoPage, InfoSection } from '../components/InfoPage';

export default function PrivacyScreen() {
  return (
    <InfoPage title="Private by" italic="default." intro="Lyfstyle is a local text-styling tool. This is the practical data note for version 1.0.0, not a wall of legal language.">
      <InfoSection number="YOUR WORDS" title="Nothing typed is uploaded.">
        Your composer draft is saved in app storage on your device. Keyboard preferences stay in native local storage. Lyfstyle contains no account system, advertising, analytics, prediction engine, AI rewriting or code that transmits keystrokes to TabSphere.
      </InfoSection>
      <InfoSection number="COPY & SHARE" title="You choose when text leaves Lyfstyle.">
        Copy writes your explicitly selected output to the system clipboard. Share opens the operating system share sheet. The destination app or clipboard is then governed by your device and that app’s own privacy terms.
      </InfoSection>
      <InfoSection number="PURCHASES" title="Apple and Google handle payment.">
        Lifetime Pro uses StoreKit and Google Play Billing. Lyfstyle receives product and entitlement status so it can unlock your purchase; it does not receive your card details. A small Pro cache is kept locally so the app can behave sensibly between store checks.
      </InfoSection>
      <InfoSection number="IPHONE FULL ACCESS" title="Optional and narrowly used.">
        Core keyboard typing works without Full Access. Lyfstyle first attempts to read StoreKit entitlements directly. If that is unavailable, optional Full Access allows the extension to read Pro status from its private App Group. Enabling iOS Full Access is a system-level permission decision; Lyfstyle does not use it to upload typing.
      </InfoSection>
      <InfoSection number="SUPPORT" title="Do not post private text.">
        The support button opens the project issue tracker only when you tap it. Anything you choose to post there may be public. Do not include passwords, private messages, purchase tokens or other sensitive information.
      </InfoSection>
      <InfoSection number="YOUR CONTROL" title="Clear, switch or uninstall.">
        Clear Draft in Settings removes the composer text. Your usual keyboard remains available through the system keyboard switcher. Device storage, backups and uninstall behavior are managed by iOS or Android.
      </InfoSection>
    </InfoPage>
  );
}
