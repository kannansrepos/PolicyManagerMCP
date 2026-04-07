import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['packages/chat-widget/src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'next'],
  outDir: 'dist',
  target: 'es2020',
});
