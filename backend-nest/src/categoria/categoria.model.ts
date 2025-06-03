import {
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Producto } from '@/producto/producto.model';

@Table({ tableName: 'Categorias', timestamps: true, paranoid: true })
export class Categoria extends Model<Categoria> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  nombre!: string;

  @Column({ field: 'nombreWeb', type: DataType.STRING(200), allowNull: false })
  nombreWeb!: string;

  @Column(DataType.INTEGER)
  orden?: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  estado?: boolean;

  @HasMany(() => Producto)
  productos?: Producto[];
}

export default (sequelize: any, DataTypes: any) =>
  sequelize.define(
    'Categoria',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      nombreWeb: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      orden: DataTypes.INTEGER,
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'Categorias',
      timestamps: true,
      paranoid: true,
    }
  );
