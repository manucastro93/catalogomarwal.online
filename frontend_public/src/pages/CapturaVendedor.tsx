// 🔵 SolidJS imports
import { onMount } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
// 🌐 Services
import { obtenerVendedorPorLink, guardarVendedorEnLocalStorage } from "@/services/vendedor.service";


export default function CapturaVendedor() {
  const params = useParams();
  const navigate = useNavigate();

  onMount(() => {
    const link = params.vendedorLink;

    if (link && link.length <= 10) {
      obtenerVendedorPorLink(link)
        .then((vendedor) => {
          guardarVendedorEnLocalStorage(vendedor);
          navigate('/');
        })
        .catch(() => {
          navigate('/sin-acceso');
        });
    } else {
      navigate('/sin-acceso');
    }
  });

  return (
    <div class="p-4 text-center text-sm text-gray-500">Cargando vendedor...</div>
  );
}
