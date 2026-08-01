/**
 * Center ID — permanent identifier for a clinic/center.
 * Format: NJR-CLINIC-XXXXXXXX (8 hex chars)
 */
(function (global) {
  'use strict';

  const PREFIX = 'NJR-CLINIC-';
  const META_KEY = '__tdw_meta__';
  const CENTER_ID_RE = /^NJR-CLINIC-[0-9A-F]{8}$/;

  function randomHex8() {
    const bytes = new Uint8Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
  }

  function generateCenterId() {
    return PREFIX + randomHex8();
  }

  function isValidCenterId(id) {
    return typeof id === 'string' && CENTER_ID_RE.test(id.trim());
  }

  function normalizeCenterId(id) {
    const s = String(id || '').trim().toUpperCase();
    return isValidCenterId(s) ? s : '';
  }

  function getStoredCenterId() {
    try {
      const meta = global.DB?.get?.(META_KEY, null) || JSON.parse(localStorage.getItem(META_KEY) || 'null');
      return meta?.centerId && isValidCenterId(meta.centerId) ? meta.centerId : '';
    } catch {
      return '';
    }
  }

  function ensureCenterId(existing) {
    const cur = normalizeCenterId(existing) || getStoredCenterId();
    if (cur) return cur;
    return generateCenterId();
  }

  global.CenterId = {
    PREFIX,
    META_KEY,
    generateCenterId,
    isValidCenterId,
    normalizeCenterId,
    getStoredCenterId,
    ensureCenterId
  };
})(typeof window !== 'undefined' ? window : globalThis);
