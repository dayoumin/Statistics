import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	retries: 0,
	workers: 1,
	use: {
		baseURL: 'http://localhost:3000',
		headless: true,
	},
	webServer: {
		command: 'npm run dev',
		port: 3000,
		reuseExistingServer: true,
		timeout: 120000,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
})


