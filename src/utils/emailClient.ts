import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export interface OpenEmailResult {
  success: boolean;
  method: 'native' | 'webmail' | 'browser' | 'failed';
  message?: string;
}

/**
 * Opens a real email client on the user's device (native mail client or webmail)
 * Supports Gmail, Outlook, Yahoo, Apple Mail, and standard mailto.
 */
export async function openEmailClient(targetEmail?: string): Promise<OpenEmailResult> {
  const cleanEmail = targetEmail?.trim().toLowerCase() || '';

  // 1. Try native mailto intent first (works on iOS, Android, and configured desktops)
  const mailtoUrl = cleanEmail ? `mailto:${cleanEmail}` : 'mailto:';
  try {
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (canOpen) {
      await Linking.openURL(mailtoUrl);
      return { success: true, method: 'native' };
    }
  } catch {
    // Continue to webmail fallback
  }

  // 2. Fallback to appropriate webmail based on email provider
  let webUrl = 'https://mail.google.com';
  if (
    cleanEmail.includes('@outlook.') ||
    cleanEmail.includes('@hotmail.') ||
    cleanEmail.includes('@live.') ||
    cleanEmail.includes('@msn.')
  ) {
    webUrl = 'https://outlook.live.com/mail/0/';
  } else if (cleanEmail.includes('@yahoo.') || cleanEmail.includes('@ymail.')) {
    webUrl = 'https://mail.yahoo.com';
  } else if (cleanEmail.includes('@icloud.') || cleanEmail.includes('@me.com')) {
    webUrl = 'https://www.icloud.com/mail';
  } else if (cleanEmail.includes('@proton.') || cleanEmail.includes('@protonmail.')) {
    webUrl = 'https://mail.proton.me';
  }

  // 3. Open in browser / webview
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(webUrl, '_blank');
        return { success: true, method: 'browser' };
      }
    }
    await WebBrowser.openBrowserAsync(webUrl);
    return { success: true, method: 'webmail' };
  } catch {
    try {
      await Linking.openURL(webUrl);
      return { success: true, method: 'browser' };
    } catch {
      return { success: false, method: 'failed', message: 'Could not automatically open mail client.' };
    }
  }
}
