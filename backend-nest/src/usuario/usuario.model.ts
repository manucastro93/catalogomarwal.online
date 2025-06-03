import { BeforeCreate, BelongsTo, Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { nanoid } from 'nanoid';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import { Pedido } from '@/pedido/pedido.model';
import { Cliente } from '@/cliente/cliente.model';
import { LogAuditoria } from '@/logauditoria/logauditoria.model';
import { RolUsuario } from '@/rolusuario/rolusuario.model';

@Table({ tableName: 'Usuarios', timestamps: true, paranoid: true })
export class Usuario extends Model<Usuario> {
  @Column({ type: DataType.STRING, allowNull: false })
  nombre!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email!: string;

  @Column(DataType.STRING)
  contraseña?: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  rolUsuarioId!: number;

  @Column({ type: DataType.STRING(4), unique: true })
  link?: string;

  @Column(DataType.STRING)
  telefono?: string;

  @HasMany(() => Pedido)
  pedidos?: Pedido[];

  @HasMany(() => Cliente, { foreignKey: 'vendedorId' })
  clientes?: Cliente[];

  @HasMany(() => LogAuditoria)
  logAuditorias?: LogAuditoria[];

  @BelongsTo(() => RolUsuario)
  rolUsuario?: RolUsuario;

  @BeforeCreate
  static asignarLink(usuario: Usuario) {
    if (usuario.rolUsuarioId === ROLES_USUARIOS.VENDEDOR) {
      usuario.link = nanoid(4).toUpperCase();
    }
  }
}

export default (sequelize: any, DataTypes: any) =>
  sequelize.define(
    'Usuario',
    {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      contraseña: DataTypes.STRING,
      rolUsuarioId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      link: {
        type: DataTypes.STRING(4),
        allowNull: true,
        unique: true,
      },
      telefono: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      tableName: 'Usuarios',
      timestamps: true,
      paranoid: true,
    }
  );
