module.exports = {
  apps: [
    {
      name: 'server',
      script: './server.js',
      cwd: __dirname,
      watch: false,
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
    {
      name: 'sync_dux_12hs',
      script: './sincronizarPedidosFacturasDux.js',
      cwd: __dirname,
      cron_restart: '0 8-16 * * *',
      out_file: './logs/sync_dux_12hs-out.log',
      error_file: './logs/sync_dux_12hs-error.log',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'sync_dux_18hs',
      script: './sincronizarProductosDux.js',
      cwd: __dirname,
      cron_restart: '0 18 * * *',
      out_file: './logs/sync_dux_18hs-out.log',
      error_file: './logs/sync_dux_18hs-error.log',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'importar_clientes_dux',
      script: './scripts/importar_clientes_dux.py',
      interpreter: './venv/bin/python',
      cwd: __dirname,
      cron_restart: '0 11,17 * * *', // todos los días a las 11 y 17 hs
      out_file: './logs/importar_clientes_dux-out.log',
      error_file: './logs/importar_clientes_dux-error.log',
      merge_logs: true,
      time: true,
    }
  ],
};
