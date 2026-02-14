// Shim: node:zlib — almostnode uses pako internally, these are fallback paths
export function gunzipSync() { throw new Error('node:zlib not available in browser'); }
export function gzipSync() { throw new Error('node:zlib not available in browser'); }
export const constants = {};
