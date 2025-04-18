import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout(props: { children: any }) {
  return (
    <div class="flex">
      <Sidebar />
      <div class="flex-1">
        <Header />
        <main class="pt-16 lg:pl-64 p-4">
          {props.children}
        </main>
      </div>
    </div>
  );
}
