import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      // Whether to polyfill `global`
      global: true,
      // Whether to polyfill `Buffer`
      buffer: true,
      // Whether to polyfill `process`
      process: true,
      // يمكنك أيضًا تحديد بروتوكولات معينة
      protocolImports: true, // Important for some Solana libs that might use e.g. 'http:' imports
    }),
  ],
  
})
