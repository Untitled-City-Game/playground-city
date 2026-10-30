import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  define: {
    'process.env': process.env
  },
  server: {
    port: 1234,
    host: true,
    allowedHosts: true
  },
  publicDir: '../static',
  optimizeDeps: {
    // Pre-bundle with everything else at startup. Found mid-session instead,
    // Vite re-bundles and open tabs can end up with two copies of React.
    include: ["boardgame.io/internal"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../"),
      "@data": path.resolve(__dirname, "../data"),
      "@src": path.resolve(__dirname, "../src"),
      "@scripts": path.resolve(__dirname, "../scripts"),
      "@styles": path.resolve(__dirname, "../src/styles"),
      "@match": path.resolve(__dirname, "../src/match"),
      "@server": path.resolve(__dirname, "../server"),
    },
  },
  plugins: [
    react(),
        {
      name: "markdown-loader",
      transform(code, id) {
        if (id.slice(-3) === ".md") {
          // For .md files, get the raw content
          return `export default ${JSON.stringify(code)};`;
        }
      }
    }
  ],
});