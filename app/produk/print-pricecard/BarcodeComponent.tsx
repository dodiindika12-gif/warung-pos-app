'use client';

import { useEffect } from 'react';
import Barcode from 'react-barcode';

export default function BarcodeComponent({ value, autoPrint = true }: { value: string, autoPrint?: boolean }) {
  useEffect(() => {
    // Auto-print after component is mounted and rendered
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="flex items-center justify-center w-full overflow-hidden">
      <Barcode 
        value={value} 
        width={1.2} 
        height={35} 
        displayValue={true} 
        fontSize={10}
        margin={0}
        background="transparent"
        lineColor="blue"
        fontOptions="italic"
        textAlign="center"
      />
    </div>
  );
}
