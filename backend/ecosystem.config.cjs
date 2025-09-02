const path = require('path');
const ROOT = __dirname;
const WRAPPER = path.join(ROOT, 'scripts', 'run_with_lock.sh');
const PYTHON = path.join(ROOT, 'venv', 'bin', 'python');

module.exports = {
  apps: [
    // --- server web (queda igual) ---
    {
      name: 'server',
      script: './server.js',
      cwd: ROOT,
      exec_mode: 'cluster',
      instances: 'max',
      watch: false,
      max_memory_restart: '800M',
      kill_timeout: 120000,
      listen_timeout: 10000,
      env: { NODE_ENV: 'production', PORT: 3000 },
      out_file: './logs/server-out.log',
      error_file: './logs/server-error.log',
      merge_logs: true,
      time: true,
    },

    // --- Pedidos/Facturas Dux ---
    {
      name: 'dux_sync_pedidos_facturas',
      script: WRAPPER,
      interpreter: '/bin/bash',              // <- IMPORTANTE
      args: [
        'dux_sync_pedidos_facturas',        // LOCK
        process.execPath,                   // comando = node actual
        path.join(ROOT, 'sincronizarPedidosFacturasDux.js'),
      ],
      cwd: ROOT,
      exec_mode: 'fork',
      instances: 1,
      autorestart: false,
      watch: false,
      cron_restart: '0 8,12,16 * * *',
      kill_timeout: 600000,
      out_file: './logs/dux_sync_pedfac-out.log',
      error_file: './logs/dux_sync_pedfac-error.log',
      merge_logs: true,
      time: true,
    },

    // --- Productos Dux ---
    {
      name: 'dux_sync_productos',
      script: WRAPPER,
      interpreter: '/bin/bash',              // <- IMPORTANTE
      args: [
        'dux_sync_productos',
        process.execPath,
        path.join(ROOT, 'sincronizarProductosDux.js'),
      ],
      cwd: ROOT,
      exec_mode: 'fork',
      instances: 1,
      autorestart: false,
      watch: false,
      cron_restart: '0 18 * * *',
      kill_timeout: 600000,
      out_file: './logs/dux_sync_productos-out.log',
      error_file: './logs/dux_sync_productos-error.log',
      merge_logs: true,
      time: true,
    },

    // --- Importar clientes Dux (Python) ---
    {
      name: 'importar_clientes_dux_con_vendedor',
      script: WRAPPER,
      interpreter: '/bin/bash',              // <- IMPORTANTE
      args: [
        'importar_clientes_dux_con_vendedor',
        PYTHON,
        path.join(ROOT, 'scripts', 'importar_clientes_dux_con_vendedor.py'),
      ],
      cwd: ROOT,
      exec_mode: 'fork',
      instances: 1,
      autorestart: false,
      watch: false,
      cron_restart: '0 11,17 * * *',
      kill_timeout: 900000,
      out_file: './logs/importar_clientes_dux_con_vendedor-out.log',
      error_file: './logs/importar_clientes_dux_con_vendedor-error.log',
      merge_logs: true,
      time: true,
    },

    // --- Gastos Dux (tu script nuevo) ---
    {
      name: 'dux_gastos_descargar_e_importar',
      script: WRAPPER,
      interpreter: '/bin/bash',              // <- IMPORTANTE
      args: [
        'dux_gastos_descargar_e_importar',
        PYTHON,
        path.join(ROOT, 'scripts', 'dux_descargar_gastos_e_importar.py'),
      ],
      cwd: ROOT,
      exec_mode: 'fork',
      instances: 1,
      autorestart: false,
      watch: false,
      cron_restart: '15 11,17 * * *',
      kill_timeout: 900000,
      out_file: './logs/dux_gastos-out.log',
      error_file: './logs/dux_gastos-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
