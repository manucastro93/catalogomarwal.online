export default (sequelize, DataTypes) => {
    const LogAuditoria = sequelize.define('LogAuditoria', {
      tabla: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accion: {
        type: DataTypes.ENUM('creado', 'modificado', 'eliminado'),
        allowNull: false,
      },
      registroId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    });
  
    LogAuditoria.associate = models => {
      LogAuditoria.belongsTo(models.Usuario, { foreignKey: 'usuarioId' });
    };
  
    return LogAuditoria;
  };
  