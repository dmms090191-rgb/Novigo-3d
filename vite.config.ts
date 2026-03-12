import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readdirSync, statSync } from 'fs';

function getPublicFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      if (item.includes('copy')) continue;
      try {
        const fullPath = resolve(dir, item);
        const stat = statSync(fullPath);
        if (stat.isFile()) {
          files.push(item);
        }
      } catch {
        continue;
      }
    }
  } catch {
    return files;
  }
  return files;
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-public-selective',
      writeBundle() {
        const publicDir = resolve(__dirname, 'public');
        const outDir = resolve(__dirname, 'dist');
        const files = getPublicFiles(publicDir);
        for (const file of files) {
          try {
            const src = resolve(publicDir, file);
            const dest = resolve(outDir, file);
            require('fs').copyFileSync(src, dest);
          } catch {
            // skip problematic files
          }
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: false,
});
