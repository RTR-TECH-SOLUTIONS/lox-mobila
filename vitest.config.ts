import { defineConfig } from 'vitest/config';

// Testele site-ului; adminul are propriile teste, in admin/.
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
