/* eslint-disable */
const path = require('path');
const ROOT = __dirname;

const PYTHON = path.join(ROOT, 'venv', 'bin', 'python'); // venv del backend
const WRAPPER = path.join(ROOT, 'scripts', 'run_with_lock.sh');

module.exports = {
  apps: [
    // ===================== APP HTTP =====================
    {
      name: 'server',
      script: './server.js',
      cwd: ROOT,
      exec_mode: 'cluster',
      instances: 'max',                // usa todos los núcleos
      watch: false,
      max_memory_restart: '800M',
      kill_timeout: 120000,            // 120s para cerrar conexiones
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: './logs/server-out.log',
      error_file: './logs/server-error.log',
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
    },

    // ===================== JOBS DUX (Node) =====================
    // Pedidos/Facturas Dux – corre a las 08/12/16 hs (si aún corre, NO solapa gracias a flock)
    {
      name: 'dux_sync_pedidos_facturas',
      // usamos el wrapper con lock: nombre de lock y comando real
      script: WRAPPER,
      args: [
        'dux_sync_pedidos_facturas',
        process.execPath,               // 'node' actual
        path.join(ROOT, 'sincronizarPedidosFacturasDux.js'),
      ],
      cwd: ROOT,
      exec_mode: 'fork',
      instances: 1,
      autorestart: false,               // one-shot
      watch: false,
      cron_restart: '0 8,12,16 * * *',  // 08:00, 12:00, 16:00
      kill_timeout: 600000,             // hasta 10 min para cerrar
      max_memory_restart: '1024M',
      env: { NODE_ENV: 'production' },
      out_file: './logs/dux_sync_pedfac-out.log',
      error_file: './logs/dux_sync_pedfac-error.log',
      merge_logs: true,
      time: true,
    },

    // Productos Dux – corre 18:00
    {
      name: 'dux_sync_productos',
      script: WRAPPER,
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
      cron_restart: '0 18 * * *',      // 18:00
      kill_timeout: 600000,
      max_memory_restart: '1024M',
      env: { NODE_ENV: 'production' },
      out_file: './logs/dux_sync_productos-out.log',
      error_file: './logs/dux_sync_productos-error.log',
      merge_logs: true,
      time: true,
    },

    // ===================== PYTHON: Clientes Dux =====================
    // Mantengo tus horarios 11:00 y 17:00
    {
      name: 'importar_clientes_dux_con_vendedor',
      script: WRAPPER,
      args: [
        'importar_clientes_dux_con_vendedor',
        PYTHON,
        path.join(ROOT, 'scripts', 'importar_clientes_dux_con_vendedor.py'),
      ],
      interpreter: '/bin/bash',         // ejecuta el wrapper (bash)
      cwd: ROOT,
      exec_mode: 'fork',
      instances: 1,
      autorestart: false,
      watch: false,
      cron_restart: '0 11,17 * * *',    // 11:00 y 17:00
      kill_timeout: 900000,             // hasta 15 min
      out_file: './logs/importar_clientes_dux_con_vendedor-out.log',
      error_file: './logs/importar_clientes_dux_con_vendedor-error.log',
      merge_logs: true,
      time: true,
    },

    // ===================== PYTHON: Gastos Dux (NUEVO) =====================
    // 11:15 y 17:15 para NO chocar con Clientes (11:00/17:00)
    {
      name: 'dux_gastos_descargar_e_importar',
      script: WRAPPER,
      args: [
        'dux_gastos_descargar_e_importar',
        PYTHON,
        path.join(ROOT, 'scripts', 'dux_descargar_gastos_e_importar.py'),
      ],
      interpreter: '/bin/bash',
      cwd: ROOT,
      exec_mode: 'fork',
      instances: 1,
      autorestart: false,
      watch: false,
      cron_restart: '15 11,17 * * *',   // 11:15 y 17:15
      kill_timeout: 900000,
      out_file: './logs/dux_gastos-out.log',
      error_file: './logs/dux_gastos-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
