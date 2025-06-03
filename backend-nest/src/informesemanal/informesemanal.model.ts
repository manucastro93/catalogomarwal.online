export default (sequelize, DataTypes) => {
    const InformeSemanal = sequelize.define('InformeSemanal', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        fechaInicio: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        fechaFin: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        resumen: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        tableName: "InformesSemanales",
        timestamps: true,
    });

    return InformeSemanal;

};
