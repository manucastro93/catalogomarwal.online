import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

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
const files = fs.readdirSync(__dirname).filter(file => file !== basename && file.endsWith('.js'));

await Promise.all(
  files.map(async (file) => {
    const modulePath = pathToFileURL(path.join(__dirname, file)).href;
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
} = db;

export { sequelize, Sequelize };
