// Shim: node:module — not available in browser
export function createRequire() {
  return function require() { throw new Error('node:module not available in browser'); };
}
