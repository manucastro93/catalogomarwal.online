import { Controller, Post, Get, Put, Delete, Req, Res, Param } from '@nestjs/common';
import { UsuarioService } from './usuario.service';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  crearUsuario(@Req() req, @Res() res) {
    return this.usuarioService.crearUsuario(req, res, null);
  }

  @Get('operarios')
  obtenerUsuariosOperarios(@Req() req, @Res() res) {
    return this.usuarioService.obtenerUsuariosOperarios(req, res, null);
  }

  @Get('rol/:rolUsuarioId')
  obtenerUsuariosPorRol(@Req() req, @Res() res) {
    return this.usuarioService.obtenerUsuariosPorRol(req, res, null);
  }

  @Get('rol-id/:rolUsuarioId')
  obtenerUsuariosPorRolId(@Req() req, @Res() res) {
    return this.usuarioService.obtenerUsuariosPorRolId(req, res, null);
  }

  @Put(':id')
  actualizarUsuario(@Req() req, @Res() res, @Param('id') id: string) {
    req.params = { id } as any;
    return this.usuarioService.actualizarUsuario(req, res, null);
  }

  @Put('contrasena/:id')
  cambiarContrasena(@Req() req, @Res() res, @Param('id') id: string) {
    req.params = { id } as any;
    return this.usuarioService.cambiarContrasena(req, res, null);
  }

  @Delete(':id')
  eliminarUsuario(@Req() req, @Res() res, @Param('id') id: string) {
    req.params = { id } as any;
    return this.usuarioService.eliminarUsuario(req, res, null);
  }
}
