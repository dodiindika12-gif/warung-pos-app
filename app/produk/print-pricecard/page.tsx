import { turso } from '@/app/db';
import BarcodeComponent from './BarcodeComponent';

export default async function PrintPricecard({ searchParams }: { searchParams: Promise<{ id: string }> }) {
  const { id } = await searchParams;
  
  if (!id) return <div className="p-4 text-red-500 font-bold">ID Produk tidak ditemukan</div>;

  const result = await turso.execute({
    sql: "SELECT * FROM products WHERE id = ?",
    args: [id]
  });

  const product = result.rows[0];

  if (!product) return <div className="p-4 text-red-500 font-bold">Produk tidak ditemukan di database</div>;

  const barcodeValue = (product.barcode as string) || (product.id as string).toString();
  const productName = product.name as string;
  const price = product.selling_price as number;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 print:bg-white print:min-h-0 print:block">
      {/* 
        Container Label 
        Tinggi: 2.5cm
        Lebar: 3cm
      */}
      <div 
        className="bg-white flex flex-col items-center justify-between overflow-hidden print:m-0 print:border-none" 
        style={{
          width: '3cm',
          height: '2.5cm',
          padding: '2px 4px',
          boxSizing: 'border-box',
          border: '1px solid #ccc', // border for screen viewing
          pageBreakInside: 'avoid'
        }}
      >
        {/* Nama Barang (Hitam) */}
        <div style={{
          color: 'black',
          fontSize: '9px',
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: '1.1',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {productName}
        </div>
        
        {/* Barcode (Biru, Miring diatur di komponen) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
           <BarcodeComponent value={barcodeValue} />
        </div>
        
        {/* Harga (Merah) */}
        <div style={{
          color: 'red',
          fontSize: '11px',
          fontWeight: '900',
          textAlign: 'center',
          lineHeight: '1',
          marginBottom: '2px'
        }}>
          Rp {price.toLocaleString('id-ID')}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: 3cm 2.5cm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
