import LoadingAnimation from './components/LoadingAnimation';

export default function Loading() {
  return (
    <div className="flex w-full h-full items-center justify-center bg-[#FAFAFA]">
      <LoadingAnimation text="Memuat halaman..." />
    </div>
  );
}
