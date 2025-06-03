import { Controller, Get, Post, Put, Delete, Req, Res, Param, Body, Query } from '@nestjs/common';
import { CategoriaService } from './categoria.service';

@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Get()
  listarCategorias(@Req() req, @Res() res) {
    return this.categoriaService.listarCategorias(req, res);
  }

  @Post()
  crearCategoria(@Req() req, @Res() res) {
    return this.categoriaService.crearCategoria(req, res);
  }

  @Put(':id')
  editarCategoria(@Req() req, @Res() res, @Param('id') id: string) {
    req.params = { id } as any;
    return this.categoriaService.editarCategoria(req, res);
  }

  @Delete(':id')
  eliminarCategoria(@Req() req, @Res() res, @Param('id') id: string) {
    req.params = { id } as any;
    return this.categoriaService.eliminarCategoria(req, res);
  }
}
