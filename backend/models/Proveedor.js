export default (sequelize, DataTypes) => {
  const Proveedor = sequelize.define(
    'Proveedor',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      tipoDoc: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      nroDoc: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      provincia: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      localidad: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      domicilio: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      barrio: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      codPostal: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      telefono: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      fax: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      companiaCelular: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      celular: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      personaContacto: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      paginaWeb: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Proveedor',
      tableName: 'Proveedores',
      timestamps: true,
      paranoid: true,
    }
  );

  Proveedor.associate = (models) => {
    Proveedor.hasMany(models.Producto, {
      foreignKey: 'proveedorId',
      as: 'Productos',
    });
  };

  return Proveedor;
};
