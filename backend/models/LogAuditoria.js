  export default (sequelize, DataTypes) => {
    const LogAuditoria = sequelize.define('LogAuditoria', {
      tabla: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      registroId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      datosAntes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      datosDespues: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      ip: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    }, {
      tableName: 'LogAuditoria',
      timestamps: true,
    });

    LogAuditoria.associate = (models) => {
      LogAuditoria.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario',
      });
    };
    
    return LogAuditoria;
  };
  