import { MateriaPrima, Subcategoria } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';

export const obtenerMateriasPrimas = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            orden = 'sku',
            direccion = 'ASC',
            buscar = '',
            subcategoriaId
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};
        const include = [
            {
                model: Subcategoria,
                as: 'Subcategoria',
                required: false,
            }
        ];

        if (buscar) {
            where[Op.or] = [
                { nombre: { [Op.like]: `%${buscar}%` } },
                { sku: { [Op.like]: `%${buscar}%` } },
            ];
        }

        if (subcategoriaId) {
            where.subcategoriaId = subcategoriaId;
        }

        if (req.query.proveedorId) {
            where.proveedorId = req.query.proveedorId;
        }

        const orderClause =
            orden === 'valorizado'
                ? [[Sequelize.literal('costoDux * stock'), direccion]]
                : [[orden, direccion]];

        const { count, rows } = await MateriaPrima.findAndCountAll({
            where,
            include,
            offset,
            limit: Number(limit),
            order: orderClause,
        });

        const totalPaginas = Math.ceil(count / limit);

        res.json({
            data: rows,
            pagina: Number(page),
            totalPaginas,
            totalItems: count,
            hasNextPage: Number(page) < totalPaginas,
            hasPrevPage: Number(page) > 1,
        });
    } catch (error) {
        console.error('❌ Error al obtener materias primas:', error);
        next(error);
    }
};

export const obtenerMateriaPrimaPorId = async (req, res, next) => {
    try {
        const materiaPrima = await MateriaPrima.findByPk(req.params.id, {
            include: [
                {
                    model: Subcategoria,
                    as: 'Subcategoria',
                    attributes: ['id', 'nombre'],
                }
            ]
        });

        if (!materiaPrima) {
            return res.status(404).json({ mensaje: 'Materia prima no encontrada' });
        }

        return res.json(materiaPrima);
    } catch (error) {
        next(error);
    }
};

export const actualizarMateriaPrima = async (req, res, next) => {
    try {
        const { id } = req.params;
        const materiaPrima = await MateriaPrima.findByPk(id);
        if (!materiaPrima) return res.status(404).json({ message: 'Materia prima no encontrada' });

        await materiaPrima.update(req.body);
        cache.flushAll();
        res.json(materiaPrima);
    } catch (error) {
        next(error);
    }
};
