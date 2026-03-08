import { defineConfig } from "cypress";
import { addMatchImageSnapshotPlugin } from '@simonsmith/cypress-image-snapshot/plugin';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 30000,
    env: {
      apiUrl: 'http://localhost:4000',
      users: [
        { email: "ayesha15@gmail.com", password: "aisha2003", role: "user" },
        { email: "admin@banditup.com", password: "Admin@123", role: "admin" }
      ]
    },

    viewportWidth: 1020,
    viewportHeight: 698,

    setupNodeEvents(on, config) {
      addMatchImageSnapshotPlugin(on);
      return config;
    }
  },
  projectId: '94n2r8',
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});
