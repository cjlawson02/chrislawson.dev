import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://chrislawson.dev',
	compressHTML: true,
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/projects') && !page.includes('/photography'),
		}),
	],
	redirects: {
		'/projects': '/experience',
		'/photography': 'https://www.lawsonphotography.me/',
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Source Sans 3',
			cssVariable: '--font-body',
			fallbacks: ['Helvetica', 'sans-serif'],
			weights: [300, 400, 600, 700],
			styles: ['normal', 'italic'],
		},
	],
	adapter: cloudflare({
		imageService: 'compile',
	}),
});
