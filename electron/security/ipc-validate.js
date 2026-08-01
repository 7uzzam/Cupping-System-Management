'use strict';

/**
 * IPC payload validation helpers (Phase 2).
 */

const MAX_STRING = 2 * 1024 * 1024; // 2 MiB
const MAX_HTML = 5 * 1024 * 1024; // 5 MiB print HTML
const MAX_JSON_CHARS = 8 * 1024 * 1024; // 8 MiB backup payloads
const MAX_BUFFER = 1 * 1024 * 1024; // 1 MiB raw printer buffer
const MAX_OBJECT_KEYS = 500;

function fail(code, message) {
  const err = new Error(message || code);
  err.code = code;
  err.ok = false;
  throw err;
}

function asString(value, { name = 'value', max = MAX_STRING, required = false, allowEmpty = true } = {}) {
  if (value == null || value === undefined) {
    if (required) fail('IPC_REQUIRED', `${name}_required`);
    return '';
  }
  if (typeof value !== 'string') fail('IPC_TYPE', `${name}_must_be_string`);
  if (!allowEmpty && !value) fail('IPC_REQUIRED', `${name}_required`);
  if (value.length > max) fail('IPC_TOO_LARGE', `${name}_too_large`);
  return value;
}

function asOptionalString(value, opts) {
  if (value == null) return null;
  return asString(value, opts);
}

function asBoolean(value, defaultValue = false) {
  if (value == null) return defaultValue;
  if (typeof value !== 'boolean') fail('IPC_TYPE', 'must_be_boolean');
  return value;
}

function asObject(value, { name = 'payload', required = false, maxKeys = MAX_OBJECT_KEYS } = {}) {
  if (value == null) {
    if (required) fail('IPC_REQUIRED', `${name}_required`);
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) fail('IPC_TYPE', `${name}_must_be_object`);
  if (Object.keys(value).length > maxKeys) fail('IPC_TOO_LARGE', `${name}_too_many_keys`);
  return value;
}

function asPayload(value, { name = 'payload', maxChars = MAX_JSON_CHARS } = {}) {
  if (typeof value === 'string') {
    if (value.length > maxChars) fail('IPC_TOO_LARGE', `${name}_too_large`);
    return value;
  }
  if (value == null) fail('IPC_REQUIRED', `${name}_required`);
  let json;
  try {
    json = JSON.stringify(value);
  } catch {
    fail('IPC_TYPE', `${name}_not_serializable`);
  }
  if (json.length > maxChars) fail('IPC_TOO_LARGE', `${name}_too_large`);
  return value;
}

function asHtml(value) {
  return asString(value, { name: 'html', max: MAX_HTML, required: true, allowEmpty: false });
}

function asBufferish(value) {
  if (value == null) fail('IPC_REQUIRED', 'buffer_required');
  if (Buffer.isBuffer(value)) {
    if (value.length > MAX_BUFFER) fail('IPC_TOO_LARGE', 'buffer_too_large');
    return value;
  }
  if (value instanceof Uint8Array) {
    if (value.byteLength > MAX_BUFFER) fail('IPC_TOO_LARGE', 'buffer_too_large');
    return Buffer.from(value);
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_BUFFER) fail('IPC_TOO_LARGE', 'buffer_too_large');
    return Buffer.from(value);
  }
  fail('IPC_TYPE', 'buffer_invalid');
}

function asEnum(value, allowed, { name = 'value', required = false, defaultValue = null } = {}) {
  if (value == null || value === '') {
    if (required) fail('IPC_REQUIRED', `${name}_required`);
    return defaultValue;
  }
  const s = String(value);
  if (!allowed.includes(s)) fail('IPC_ENUM', `${name}_not_allowed`);
  return s;
}

function asEmail(value, { required = false } = {}) {
  if (value == null || value === '') {
    if (required) fail('IPC_REQUIRED', 'email_required');
    return '';
  }
  const s = asString(value, { name: 'email', max: 320 });
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) fail('IPC_FORMAT', 'email_invalid');
  return s;
}

/** Wrap handler: convert validation errors into structured { ok:false } when appropriate. */
function isValidationError(err) {
  if (!err || !err.code) return false;
  const code = String(err.code);
  return code.startsWith('IPC_') || code === 'PATH_TRAVERSAL' || code === 'PATH_INVALID';
}

function guard(handler, { soft = true } = {}) {
  return async (event, ...args) => {
    try {
      return await handler(event, ...args);
    } catch (err) {
      if (soft && isValidationError(err)) {
        return { ok: false, error: err.code || 'IPC_ERROR', message: err.message };
      }
      throw err;
    }
  };
}

module.exports = {
  MAX_STRING,
  MAX_HTML,
  MAX_JSON_CHARS,
  MAX_BUFFER,
  fail,
  asString,
  asOptionalString,
  asBoolean,
  asObject,
  asPayload,
  asHtml,
  asBufferish,
  asEnum,
  asEmail,
  guard,
};
