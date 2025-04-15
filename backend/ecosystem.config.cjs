module.exports = {
  apps: [
    {
      name: 'server',
      script: './server.js',
      cwd: __dirname,
      watch: false, // Cambiar a true si querés que reinicie en desarrollo al guardar
      ignore_watch: ['node_modules', 'public', 'logs'],
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: './logs/server-out.log',
      error_file: './logs/server-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
