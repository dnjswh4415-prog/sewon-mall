const { defineConfig } = require("prisma");

module.exports = defineConfig({
  datasource: {
    db: {
      provider: "mysql",
      url: process.env.DATABASE_URL,
    },
  },
});
