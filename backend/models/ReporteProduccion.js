export default (sequelize, DataTypes) => {
    const ReporteProduccion = sequelize.define(
      "ReporteProduccion",
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        productoId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        cantidad: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        usuarioId: {
          type: DataTypes.INTEGER, // no unsigned para que coincida con Usuarios.id
          allowNull: false,
        },
      },
      {
        tableName: "ReporteProducciones",
        timestamps: true,
        paranoid: true,
      }
    );
  
    ReporteProduccion.associate = (models) => {
      ReporteProduccion.belongsTo(models.Producto, {
        foreignKey: "productoId",
        as: "producto",
      });
  
      ReporteProduccion.belongsTo(models.Usuario, {
        foreignKey: "usuarioId",
        as: "usuario",
      });
    };
  
    return ReporteProduccion;
  };
  