import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDesktop = process.env.VITE_TARGET === "desktop";
  const isProduction = mode === "production" || process.env.NODE_ENV === "production";

  // Debug: Log build configuration
  console.log("[VITE CONFIG] isDesktop:", isDesktop, "VITE_TARGET:", process.env.VITE_TARGET);
  console.log("[VITE CONFIG] isProduction:", isProduction, "mode:", mode);

  return {
    plugins: [react()],
    base: isDesktop ? "./" : "/",
    build: {
      // Always output to dist-web, post-build script will merge with Electron files in dist/
      outDir: "dist-web",
      // Production optimizations
      minify: isProduction ? "terser" : false,
      sourcemap: !isProduction,
      // Target modern browsers for smaller bundle
      target: "es2020",
      // Chunk size warning at 1MB
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        external: isDesktop
          ? []
          : ["electron", "node-hid", "serialport", "electron-pos-printer"],
        output: isDesktop
          ? {
              // For desktop: single bundle, no code splitting issues
              inlineDynamicImports: true,
            }
          : {
              // For web: chunk splitting for better caching
              manualChunks: (id) => {
                if (id.includes("node_modules")) {
                  // React and core libraries
                  if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
                    return "react-vendor";
                  }
                  // Chart libraries
                  if (id.includes("chart.js") || id.includes("recharts") || id.includes("react-chartjs")) {
                    return "chart-vendor";
                  }
                  // PDF libraries
                  if (id.includes("jspdf") || id.includes("react-pdf") || id.includes("pdfjs")) {
                    return "pdf-vendor";
                  }
                  // Form libraries
                  if (id.includes("react-hook-form") || id.includes("zod") || id.includes("hookform")) {
                    return "form-vendor";
                  }
                  // UI libraries
                  if (id.includes("framer-motion") || id.includes("headlessui") || id.includes("lucide")) {
                    return "ui-vendor";
                  }
                  // Data fetching
                  if (id.includes("tanstack") || id.includes("axios")) {
                    return "data-vendor";
                  }
                  // All other node_modules
                  return "vendor";
                }
              },
            },
      },
      // Terser options for production
      terserOptions: isProduction ? {
        compress: {
          drop_console: false,  // KEEP console.log for debugging USB issues
          drop_debugger: true,
          // Only remove console.debug, keep log/warn/error for troubleshooting
          pure_funcs: ["console.debug"],
        },
        format: {
          comments: false,  // Remove comments
        },
      } : undefined,
      // CSS optimization
      cssCodeSplit: true,
      cssMinify: isProduction,
      // Asset inlining threshold (4kb)
      assetsInlineLimit: 4096,
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@desktop": resolve(__dirname, "./src/desktop"),
        "@shared": resolve(__dirname, "./src/shared"),
      },
    },
    define: {
      "import.meta.env.VITE_TARGET": JSON.stringify(
        process.env.VITE_TARGET || "web"
      ),
      // Add build info
      "import.meta.env.BUILD_TIME": JSON.stringify(new Date().toISOString()),
      "import.meta.env.APP_VERSION": JSON.stringify(process.env.npm_package_version || "1.0.0"),
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "axios",
        "zustand",
      ],
      exclude: isDesktop ? [] : ["electron", "electron-pos-printer"],
    },
    // Server configuration for development
    server: {
      port: 5173,
      strictPort: false,
      host: true,
    },
    // Preview server configuration
    preview: {
      port: 4173,
    },
    // Enable esbuild for faster builds in development
    esbuild: {
      legalComments: isProduction ? "none" : "inline",
    },
  };
});
