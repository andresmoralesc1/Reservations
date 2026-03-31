/**
 * PM2 Ecosystem Configuration
 *
 * Uso:
 * - pm2 start ecosystem.config.js
 * - pm2 restart all
 * - pm2 logs
 * - pm2 save
 *
 * Nota: El cron de analytics se maneja via crontab Linux, no PM2
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
  ],
}
