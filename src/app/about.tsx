import { InfoPage, InfoSection } from '../components/InfoPage';

export default function AboutScreen() {
  return (
    <InfoPage title="Not a font file." italic="A Unicode tool." intro="Lyfstyle maps supported characters to styled Unicode characters. That makes the result pasteable as text, with a few important limits.">
      <InfoSection number="WHAT IT DOES" title="Characters in, characters out.">
        A style such as Serif Bold replaces supported Latin letters and digits with their Unicode mathematical alphanumeric counterparts. It does not install a font, change an app’s design or restyle text that is already on screen.
      </InfoSection>
      <InfoSection number="COMPATIBILITY" title="Display depends on the destination.">
        Many messaging, caption and bio fields accept Unicode, but individual apps, platforms and fonts can render it differently. Some destinations strip certain characters, search may treat styled text differently, and accessibility tools may announce mathematical letters in unexpected ways. Keep Normal text for clarity-critical content.
      </InfoSection>
      <InfoSection number="MISSING GLYPHS" title="Unsupported characters stay unchanged.">
        Lyfstyle never silently swaps an unsupported character for an unrelated symbol. The composer identifies letters and numbers that have no audited mapping in the selected style. Capital-only, superscript, subscript and accent-heavy text can therefore contain a deliberate mix of styled and normal characters.
      </InfoSection>
      <InfoSection number="SAFE FIELDS" title="Normal when Normal matters.">
        The keyboards automatically use Normal mode for password and secure fields, email addresses, URLs, phone numbers, numeric fields and one-time codes. You can also choose Normal manually. Styled text is intended for expression, not credentials or precise identifiers.
      </InfoSection>
      <InfoSection number="DECORATIONS" title="Explicit, never automatic.">
        Frames and dividers are composer actions. The keyboard does not wrap everything you type in decorative characters, so ordinary messages remain predictable.
      </InfoSection>
      <InfoSection number="DELETION" title="Backspace respects visible characters.">
        Android uses Unicode grapheme boundaries and iOS uses the system text proxy’s backward deletion. Real-device verification still covers supplementary letters, combining marks, family emoji, flags, skin tones and keycaps across target apps.
      </InfoSection>
    </InfoPage>
  );
}
