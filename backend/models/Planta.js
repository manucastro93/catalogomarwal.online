export default (sequelize, DataTypes) => {
    const Planta = sequelize.define('Planta', {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      direccion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }, {
      tableName: 'Plantas',
      timestamps: true,
      paranoid: true,
    });
  
    Planta.associate = (models) => {
      Planta.hasMany(models.ReporteProduccion, {
        foreignKey: "plantaId",
        as: "reportes",
      });
    };
    
  
    return Planta;
  };
  