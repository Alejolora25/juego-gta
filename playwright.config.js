import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';

export default defineConfig({
 testDir:'./tests',
 testMatch:'**/*.spec.js',
 webServer:{
  cwd:fileURLToPath(new URL('.',import.meta.url)),
  command:'python3 -m http.server 4173 --bind 127.0.0.1',
  url:'http://127.0.0.1:4173/',
  reuseExistingServer:!process.env.CI,
  stdout:'ignore',
  stderr:'ignore',
  timeout:15000
 }
});
