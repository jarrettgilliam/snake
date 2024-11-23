import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    base: '',
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Snake',
                short_name: 'Snake',
                description: 'A retro style snake game for the nostalgic gamer',
                theme_color: '#111111',
                background_color: '#333333',
                display: 'standalone',
                start_url: '/snake/',
                icons: [
                    {
                        src: 'favicon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'favicon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: /\.(svg|woff2)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'snake-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                            }
                        }
                    }
                ]
            }
        })
    ]
})
