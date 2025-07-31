import { formatearFechaCorta } from "@/utils/formato";
import type { Usuario } from "../../../../types/usuario";

export default function TabDetallesVendedor(props: { usuario: Usuario }) { 
  const { usuario } = props;

  return (
    <div class="space-y-3 text-base">
      <div>
        <span class="font-bold">Nombre: </span>{usuario.nombre}
      </div>
      <div>
        <span class="font-bold">Email: </span>{usuario.email}
      </div>
      <div>
        <span class="font-bold">Teléfono: </span>{usuario.telefono || "-"}
      </div>
      <div>
        <span class="font-bold">Link: </span>{usuario.link || "-"}
      </div>
      <div>
        <span class="font-bold">Fecha de alta: </span>{formatearFechaCorta(usuario.createdAt)}
      </div>
    </div>
  );
}
