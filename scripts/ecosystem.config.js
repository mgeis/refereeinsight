module.exports = {
  apps: [
    {
      name: "referee-insight",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/home/ec2-user/app",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Restart if memory exceeds 512 MB
      max_memory_restart: "512M",
      // Keep 5 days of logs
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/home/ec2-user/logs/err.log",
      out_file: "/home/ec2-user/logs/out.log",
    },
  ],
};
