export default function EnviandoOverlay() {
    return (
      <div class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
          {/* Spinner CSS */}
          <div class="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          <p class="text-lg font-semibold text-black">Enviando pedido...</p>
        </div>
      </div>
    );
  }
  