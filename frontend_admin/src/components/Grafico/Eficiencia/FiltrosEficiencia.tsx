import type { Component } from "solid-js";

interface Props {
  desde: string;
  hasta: string;
  categoriaId: string;
  producto: string;
  cliente: string;
  modo:"categoria" | "producto" | "cliente";
  setDesde: (val: string) => void;
  setHasta: (val: string) => void;
  setCategoriaId: (val: string) => void;
  setProducto: (val: string) => void;
  setCliente: (val: string) => void;
  setModo: (val: "categoria" | "producto" | "cliente") => void;
  limpiarFiltros: () => void;
  onExportar: () => void;
  categorias: { id: string; nombre: string }[];
}

const FiltrosEficiencia: Component<Props> = (props) => {
  return (
    <div class="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
      {/* Fecha desde */}
      <div>
        <label class="text-sm">Desde</label>
        <input
          type="date"
          value={props.desde}
          onInput={(e) => props.setDesde(e.currentTarget.value)}
          class="input"
        />
      </div>

      {/* Fecha hasta */}
      <div>
        <label class="text-sm">Hasta</label>
        <input
          type="date"
          value={props.hasta}
          onInput={(e) => props.setHasta(e.currentTarget.value)}
          class="input"
        />
      </div>

      {/* Modo */}
      <div>
        <label class="text-sm">Modo</label>
        <select
          value={props.modo}
          onInput={(e) =>
            props.setModo(e.currentTarget.value as "categoria" | "producto" | "cliente")
          }
          class="input"
        >
          <option value="categoria">Por categoría</option>
          <option value="producto">Por producto</option>
          <option value="cliente">Por cliente</option>
        </select>
      </div>

      {/* Filtro por categoría */}
      {props.modo === "categoria" && (
        <div>
          <label class="text-sm">Categoría</label>
          <select
            value={props.categoriaId}
            onInput={(e) => props.setCategoriaId(e.currentTarget.value)}
            class="input"
          >
            <option value="">Todas</option>
            {props.categorias.map((cat) => (
              <option value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {/* Filtro por producto */}
      {props.modo === "producto" && (
        <div>
          <label class="text-sm">Producto</label>
          <input
            type="text"
            placeholder="Buscar por SKU o nombre"
            value={props.producto}
            onInput={(e) => props.setProducto(e.currentTarget.value)}
            class="input"
          />
        </div>
      )}

      {/* Filtro por cliente */}
      {props.modo === "cliente" && (
        <div>
          <label class="text-sm">Cliente</label>
          <input
            type="text"
            placeholder="Buscar por nombre o razón social"
            value={props.cliente}
            onInput={(e) => props.setCliente(e.currentTarget.value)}
            class="input"
          />
        </div>
      )}

      {/* Botones */}
      <div class="flex gap-2 col-span-1 md:col-span-1">
        <button onClick={props.onExportar} class="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Exportar
        </button>
        <button onClick={props.limpiarFiltros} class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
          Limpiar
        </button>
      </div>
    </div>
  );
};

export default FiltrosEficiencia;
