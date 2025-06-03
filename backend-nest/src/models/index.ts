import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      paranoid: true,
    },
  }
);

const db = {};

// Cargar modelos dinámicamente con import() (ES Modules)
// Recursively gather all compiled model files (ending with .model.js)
function getModelFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getModelFiles(resolved);
    }
    return entry.isFile() && resolved.endsWith('.model.js') ? [resolved] : [];
  });
}

const modelsDir = path.join(__dirname, '..');
const files = getModelFiles(modelsDir);

await Promise.all(
  files.map(async (file) => {
    const modulePath = pathToFileURL(file).href;
    const { default: modelDef } = await import(modulePath);
    const model = modelDef(sequelize, DataTypes);
    db[model.name] = model;
  })
);

// Asociaciones
Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Exportación por default (db) y nombrada (modelos individuales)
export default db;

export const {
  Categoria,
  Producto,
  ImagenProducto,
  Cliente,
  Pedido,
  DetallePedido,
  Usuario,
  Pagina,
  Banner,
  Provincia,
  Localidad,
  IpCliente,
  LogCliente,
  LogAuditoria,
  Notificacion,
  HistorialCliente,
  IpClienteCliente,
  ReporteProduccion,
  Planta,
  RolUsuario,
  EstadoPedido,
  PermisosUsuario,
  Modulo,
  InformeSemanal,
  Marca,
  ListaPrecio,
  ListaPrecioProducto,
  ConversacionBot,
  MensajeAutomatico,
  PedidoDux,
  Factura,
  EstadoFactura,
  DetallePedidoDux,
  DetalleFactura,
  HistorialSincronizacion
} = db;

export { sequelize, Sequelize };
