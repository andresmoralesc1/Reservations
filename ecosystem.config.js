/**
 * PM2 Ecosystem Configuration
 *
 * Uso:
 * - pm2 start ecosystem.config.js
 * - pm2 restart all
 * - pm2 logs
 * - pm2 save
 */

module.exports = {
  apps: [
    {
      name: "reservations-api",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3005",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3005,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "analytics-aggregator",
      script: "./node_modules/tsx/dist/cli.mjs",
      args: "./scripts/analytics-cron.ts",
      // Ejecutar todos los días a las 2:00 AM
      cron_restart: "0 2 * * *",
      // Alternativa: ejecutar cada hora (para testing)
      // cron_restart: "0 * * * *",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/analytics-err.log",
      out_file: "./logs/analytics-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
}
