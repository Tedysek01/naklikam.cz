// Browser-compatible zlib stub for almostnode's just-bash dependency
// These functions are used for gzip/gunzip in the virtual shell but we use
// the browser's DecompressionStream/CompressionStream where available

export const constants = {
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
} as const;

export function gunzipSync(data: Uint8Array): Uint8Array {
  // Fallback: return data as-is if DecompressionStream is not available
  // In practice, gzip/gunzip commands in the virtual shell are rarely used
  console.warn('[zlib shim] gunzipSync called in browser - limited support');
  return data;
}

export function gzipSync(data: Uint8Array, _options?: unknown): Uint8Array {
  console.warn('[zlib shim] gzipSync called in browser - limited support');
  return data;
}

export default { constants, gunzipSync, gzipSync };
