export default function Loading() {
  return (
    <div className="flex w-full h-full items-center justify-center bg-[#FAFAFA]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner modern dengan warna dominan aplikasi (orange) */}
        <div className="w-12 h-12 border-4 border-green-100 border-t-green-500 rounded-full animate-spin shadow-sm"></div>
        <p className="text-gray-400 font-medium text-sm animate-pulse tracking-wide">
          Memuat halaman...
        </p>
      </div>
    </div>
  );
}
