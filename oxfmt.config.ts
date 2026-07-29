import base from '@typeflowjs/lint-config/oxfmt';
import { defineConfig } from 'oxfmt';

export default defineConfig({
  ...base,
  // Cargo.toml/Cargo.lock are rustfmt/cargo's domain, not this formatter's.
  ignorePatterns: ['**/node_modules/**', 'dist/**', 'Cargo.toml', 'Cargo.lock'],
});
