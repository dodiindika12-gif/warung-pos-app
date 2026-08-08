'use client';

import { DotLottiePlayer } from '@dotlottie/react-player';
import '@dotlottie/react-player/dist/index.css';

interface Props {
  text?: string;
}

export default function LoadingAnimation({ text = "Memuat..." }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[200px]">
      <div className="w-32 h-32 md:w-48 md:h-48 mb-2">
        <DotLottiePlayer
          src="https://lottie.host/abf961af-b31b-47e7-bf16-f76c4ade329f/54eqz4PDJZ.lottie"
          autoplay
          loop
        />
      </div>
      <p className="text-gray-500 font-bold tracking-wide animate-pulse">{text}</p>
    </div>
  );
}
