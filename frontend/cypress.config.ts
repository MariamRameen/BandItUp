import { defineConfig } from "cypress";
import { addMatchImageSnapshotPlugin } from '@simonsmith/cypress-image-snapshot/plugin';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    env: {
      apiUrl: 'http://localhost:4000',
      users: [
        { email: "ayesha15@gmail.com", password: "aisha2003", role: "user" },
        { email: "admin@banditup.com", password: "Admin@123", role: "admin" }
      ]
    },

    setupNodeEvents(on, config) {
     

      addMatchImageSnapshotPlugin(on);

      return config;
    }
  },
  projectId: '94n2r8' 
});
