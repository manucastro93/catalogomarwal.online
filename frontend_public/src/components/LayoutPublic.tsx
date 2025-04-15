import Footer from './Footer';
import CarritoSlideOver from './CarritoSlideOver';

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
