// 🧩 Layout Components
import Footer from "./Footer";
// 📦 Pedido Components
import { CarritoSlideOver } from "@/components/Pedido";


export default function LayoutPublic(props: { children: any }) {
  return (
    <>
      <main class="pb-10 min-h-[calc(100vh-60px)]">
        {props.children}
      </main>
      <CarritoSlideOver />
      <Footer />
    </>
  );
}
