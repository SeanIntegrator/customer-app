/** Shared JSON envelope handling for `fetch` responses (`ok` preferred; optional legacy `success`). */

export function parseJsonSafe(res) {
  return res.json().catch(() => ({}));
}

export function pickErrorMessage(data, fallback) {
  return data?.error || data?.reason || fallback;
}

/**
 * @param {Response} res
 * @param {{ fallbackError?: string, allowLegacySuccess?: boolean }} [opts]
 */
export async function expectApiSuccess(res, { fallbackError, allowLegacySuccess = false } = {}) {
  const data = await parseJsonSafe(res);
  const envelopeSuccess =
    typeof data?.ok === 'boolean'
      ? data.ok
      : allowLegacySuccess && typeof data?.success === 'boolean'
        ? data.success
        : res.ok;

  if (!res.ok || !envelopeSuccess) {
    throw new Error(pickErrorMessage(data, fallbackError));
  }
  return data;
}
