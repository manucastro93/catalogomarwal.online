export function animarHaciaCarrito(imagenEl: HTMLImageElement) {
    const carritoIcono = document.getElementById("carrito-icono");
    if (!carritoIcono || !imagenEl) return;
  
    const imgRect = imagenEl.getBoundingClientRect();
    const carritoRect = carritoIcono.getBoundingClientRect();
  
    const clone = imagenEl.cloneNode(true) as HTMLImageElement;
    clone.style.position = "fixed";
    clone.style.zIndex = "1000";
    clone.style.left = `${imgRect.left}px`;
    clone.style.top = `${imgRect.top}px`;
    clone.style.width = `${imgRect.width}px`;
    clone.style.height = `${imgRect.height}px`;
    clone.style.transition = "all 0.6s ease-in-out";
  
    document.body.appendChild(clone);
  
    requestAnimationFrame(() => {
      clone.style.left = `${carritoRect.left + carritoRect.width / 2 - imgRect.width / 4}px`;
      clone.style.top = `${carritoRect.top + carritoRect.height / 2 - imgRect.height / 4}px`;
      clone.style.opacity = "0";
      clone.style.transform = "scale(0.3)";
    });
  
    setTimeout(() => {
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
  
      // 🎯 Efecto visual al carrito
      carritoIcono.classList.add("animate-bounce");
  
      // 🎉 Badge +1 flotante
     // 🎉 Badge +1 flotante
const badge = document.createElement("div");
badge.innerText = "+1";
badge.style.position = "fixed";
badge.style.left = `${carritoRect.left + carritoRect.width / 2 - 8}px`;
badge.style.top = `${carritoRect.top - 20}px`;
badge.style.background = "red";
badge.style.color = "white";
badge.style.fontWeight = "bold";
badge.style.fontSize = "14px";
badge.style.padding = "2px 6px";
badge.style.borderRadius = "9999px";
badge.style.zIndex = "1002";
badge.style.pointerEvents = "none";
badge.style.transition = "all 0.5s ease-out";
badge.style.opacity = "1";

document.body.appendChild(badge);

requestAnimationFrame(() => {
  badge.style.transform = "translateY(-20px)";
  badge.style.opacity = "0";
});

setTimeout(() => {
  if (badge.parentNode) {
    badge.parentNode.removeChild(badge);
  }
}, 700);

    }, 600);
  }
  