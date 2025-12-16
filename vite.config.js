import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx'
            ],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
    server: {
        host: '0.0.0.0', // Allow access from any device on the network
        port: 5173,
        hmr: {
            host: 'localhost',
        },
    },
    build: {
        // Performance optimizations
        minify: 'esbuild', // Faster than terser
        cssMinify: true,
        sourcemap: false, // Disable in production for faster builds
        rollupOptions: {
            output: {
                // Code splitting for better performance
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'inertia-vendor': ['@inertiajs/react'],
                },
            },
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
    },
    // Optimize dependencies
    optimizeDeps: {
        include: ['react', 'react-dom', '@inertiajs/react'],
    },
});
