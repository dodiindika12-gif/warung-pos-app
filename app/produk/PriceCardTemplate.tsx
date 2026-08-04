import React from 'react';

interface PriceCardTemplateProps {
  productName: string;
  price: number;
  barcodeValue: string;
}

export default function PriceCardTemplate({ productName, price, barcodeValue }: PriceCardTemplateProps) {
  return (
    <div 
      className="bg-white flex flex-col overflow-hidden relative" 
      style={{
        width: '5cm',
        height: '2.5cm',
        boxSizing: 'border-box',
        border: '1px dashed #e2e8f0', // dashed border helps with cutting
        pageBreakInside: 'avoid',
        fontFamily: 'sans-serif'
      }}
    >
      {/* Background layer */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '30%', backgroundColor: '#FFEA00' }}></div>
        <div style={{ flex: '1', backgroundColor: 'white', position: 'relative', overflow: 'hidden' }}>
          {/* Leaf Watermark SVG */}
          <svg style={{ position: 'absolute', left: '-5%', bottom: '-10%', height: '120%', opacity: 0.15 }} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0 100 Q 20 60 40 60 Q 60 60 80 20 Q 60 30 40 40 Q 20 50 0 100 Z" fill="#4CAF50" />
            <path d="M 25 85 Q 40 70 50 50 Q 30 65 25 85 Z" fill="#2E7D32" />
          </svg>
        </div>
        <div style={{ height: '15%', backgroundColor: '#FFEA00' }}></div>
      </div>
      
      {/* Content layer */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        {/* Nama Barang (Hitam) */}
        <div style={{ 
          height: '30%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '0 4px' 
        }}>
          <span style={{ 
            color: 'black', 
            fontSize: '9px', 
            fontWeight: '600', 
            textAlign: 'center', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            width: '100%'
          }}>
            {productName}
          </span>
        </div>
        
        {/* Harga (Merah) */}
        <div style={{ 
          flex: '1', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <span style={{ 
            color: 'red', 
            fontSize: '18px', 
            fontWeight: '900', 
            letterSpacing: '-0.5px' 
          }}>
            Rp {price.toLocaleString('id-ID')}
          </span>
        </div>
        
        {/* Barcode / SKU Text (Biru, Miring) */}
        <div style={{ 
          height: '15%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingBottom: '1px'
        }}>
          <span style={{ 
            color: '#0000CC', 
            fontSize: '7px', 
            fontStyle: 'italic', 
            fontWeight: '600' 
          }}>
            {barcodeValue}
          </span>
        </div>
      </div>
    </div>
  );
}
