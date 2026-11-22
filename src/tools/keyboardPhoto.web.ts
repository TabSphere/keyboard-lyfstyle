// Keyboard photos need the native keyboard, so the web preview only explains that.
export async function pickKeyboardPhoto(): Promise<string | null> {
  throw new Error('Choosing a keyboard photo works in the iPhone and Android apps.');
}

export async function removeKeyboardPhoto(): Promise<void> {
  return undefined;
}
