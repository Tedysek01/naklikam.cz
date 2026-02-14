import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [path.join(__dirname, 'sandbox-entry.js')],
  bundle: true,
  format: 'esm',
  outfile: path.join(__dirname, 'almostnode.bundle.js'),
  platform: 'browser',
  target: 'es2022',
  alias: {
    'node:zlib': path.join(__dirname, '_shims/node-zlib.js'),
    'node:module': path.join(__dirname, '_shims/node-module.js'),
    'node:async_hooks': path.join(__dirname, '_shims/node-module.js'),
  },
});

console.log('Bundle created successfully');
