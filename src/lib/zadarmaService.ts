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

// Prevent simultaneous calls which cause Zadarma 500 "exceeded connections" errors
let isCallInProgress = false;

export async function triggerZadarmaCall(from: string, to: string): Promise<CallbackResult> {
  if (isCallInProgress) {
    return { success: false, error: 'A call is already in progress. Please wait.' };
  }

  try {
    const cleanTo = to.replace(/[^0-9+]/g, '');
    const cleanFrom = from.replace(/[^0-9+\-]/g, '');

    if (!cleanFrom || !cleanTo) {
      return { success: false, error: 'Invalid phone numbers provided' };
    }

    isCallInProgress = true;

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
  } finally {
    // Release lock after 10 seconds to allow next call
    setTimeout(() => { isCallInProgress = false; }, 10000);
  }
}


/**
 * Send a test call to verify Zadarma credentials are working.
 * Uses the callback endpoint with the same from/to number.
 */
export async function testZadarmaConnection(sipNumber: string): Promise<CallbackResult> {
  return triggerZadarmaCall(sipNumber, sipNumber);
}
