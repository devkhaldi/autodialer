/**
 * Zadarma Callback Service
 * Wraps the server-side /api/zadarma/callback endpoint to trigger
 * automated outbound calls via Zadarma's Callback API.
 */

export interface CallbackResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Trigger an outbound call via the Zadarma Callback API.
 * The server route handles authentication and signing.
 * @param from – caller SIP number (e.g. "365816" or PBX ext like "365816-100")
 * @param to – destination phone number (lead's number, digits only)
 */
export async function triggerZadarmaCall(from: string, to: string): Promise<CallbackResult> {
  try {
    const cleanTo = to.replace(/[^0-9+]/g, '');
    const cleanFrom = from.replace(/[^0-9+\-]/g, '');

    if (!cleanFrom || !cleanTo) {
      return { success: false, error: 'Invalid phone numbers provided' };
    }

    const res = await fetch('/api/zadarma/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: cleanFrom, to: cleanTo }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `API error (${res.status})`,
        data,
      };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error – could not reach server',
    };
  }
}

/**
 * Send a test call to verify Zadarma credentials are working.
 * Uses the callback endpoint with the same from/to number.
 */
export async function testZadarmaConnection(sipNumber: string): Promise<CallbackResult> {
  return triggerZadarmaCall(sipNumber, sipNumber);
}
