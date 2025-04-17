export function animarHaciaCarrito(imagenEl: HTMLImageElement) {
  const carritoIcono = document.getElementById("carrito-icono");
  if (!carritoIcono || !imagenEl) return;

  // Posición inicial de la imagen
  const imgRect = imagenEl.getBoundingClientRect();
  const carritoRect = carritoIcono.getBoundingClientRect();

  // Clon de la imagen
  const clone = imagenEl.cloneNode(true) as HTMLImageElement;
  clone.style.position = "fixed";
  clone.style.zIndex = "1000";
  clone.style.left = `${imgRect.left}px`;
  clone.style.top = `${imgRect.top}px`;
  clone.style.width = `${imgRect.width}px`;
  clone.style.height = `${imgRect.height}px`;
  clone.style.transition = "all 0.6s ease-in-out";

  document.body.appendChild(clone);

  // Inicia la animación hacia el carrito
  requestAnimationFrame(() => {
    clone.style.left = `${carritoRect.left + carritoRect.width / 2 - imgRect.width / 4}px`;
    clone.style.top = `${carritoRect.top + carritoRect.height / 2 - imgRect.height / 4}px`;
    clone.style.opacity = "0";
    clone.style.transform = "scale(0.3)";
  });

  // Después de la animación
  setTimeout(() => {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }

    // Asegurar posición relativa del ícono
carritoIcono.style.position = "relative";

// Crear el badge +1
const badge = document.createElement("div");
badge.innerText = "+1";
badge.style.position = "absolute";
badge.style.right = "-10px";
badge.style.top = "-10px";
badge.style.background = "red";
badge.style.color = "white";
badge.style.fontWeight = "bold";
badge.style.fontSize = "12px";
badge.style.padding = "2px 6px";
badge.style.borderRadius = "9999px";
badge.style.boxShadow = "0 0 6px rgba(0,0,0,0.4)";
badge.style.opacity = "1";
badge.style.transition = "all 0.4s ease-out";
badge.style.zIndex = "9999";
badge.style.pointerEvents = "none";

// Agregamos el badge al ícono real visible
carritoIcono.appendChild(badge);

// Pequeña animación visual
setTimeout(() => {
  badge.style.transform = "translateY(-8px)";
  badge.style.opacity = "0";
}, 50);

setTimeout(() => {
  if (badge.parentNode) {
    badge.parentNode.removeChild(badge);
  }
}, 500);

  }, 600);
}
