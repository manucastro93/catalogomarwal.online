export default (sequelize, DataTypes) => {
  const Cliente = sequelize.define('Cliente', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: true
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    razonSocial: DataTypes.STRING,
    cuit_cuil: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provinciaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Provincias',
        key: 'id'
      }
    },
    localidadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Localidades',
        key: 'id'
      }
    },
    vendedorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Cliente',
    tableName: 'Clientes',
    timestamps: true,
    paranoid: true,
  });

  Cliente.associate = (models) => {
    Cliente.belongsTo(models.Provincia, {
      foreignKey: 'provinciaId',
      as: 'provincia'
    });
    Cliente.belongsTo(models.Localidad, {
      foreignKey: 'localidadId',
      as: 'localidad'
    });
    Cliente.belongsTo(models.Usuario, {
      foreignKey: 'vendedorId',
      as: 'vendedor'
    });
  };

  return Cliente;
};
