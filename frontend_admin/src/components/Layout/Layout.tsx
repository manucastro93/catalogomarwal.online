import { createSignal } from 'solid-js';
import Header from './Header';
import Sidebar from './Sidebar/index';

export default function Layout(props: { children: any }) {
  const [expandido, setExpandido] = createSignal(true);

  return (
    <div class="flex">
      <Sidebar expandido={expandido()} setExpandido={setExpandido} />
      
      <div class={`transition-all duration-300 ${expandido() ? 'ml-64' : 'ml-16'} flex-1`}>
        <Header expandido={expandido()} />
        <main class="pt-16 p-4">
          {props.children}
        </main>
      </div>
    </div>
  );
}
