import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Categoria } from '@/categoria/categoria.model';
import { Usuario } from '@/usuario/usuario.model';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: (process.env.DB_DIALECT as any) || 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      models: [Categoria, Usuario],
      autoLoadModels: true,
      logging: false,
    }),
    SequelizeModule.forFeature([Categoria, Usuario]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
