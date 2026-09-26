import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import wasm from "vite-plugin-wasm"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
	base: '/EcoBonus/', // GitHub Pages base path
	plugins: [
		react(),
		nodePolyfills({
			include: ["buffer"],
			globals: {
				Buffer: true,
			},
		}),
		wasm(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.svg", "images/*.jpg"],
			manifest: false,
			workbox: {
				runtimeCaching: [{
					urlPattern: /^https:\/\/basemaps\.cartocdn\.com\/.*/i,
					handler: "CacheFirst",
					options: { cacheName: "ecobonus-map-tiles", expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 } },
				}],
			},
		}),
	],
	build: {
		target: "esnext",
	},
	optimizeDeps: {
		exclude: ["@stellar/stellar-xdr-json", "maplibre-gl"],
	},
	define: {
		global: "window",
	},
	envPrefix: ["PUBLIC_", "VITE_"],
	server: {
		allowedHosts: [".trycloudflare.com"],
		proxy: {
			"/friendbot": {
				target: "http://localhost:8000/friendbot",
				changeOrigin: true,
			},
		},
	},
})
