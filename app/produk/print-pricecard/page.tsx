import { turso } from '@/app/db';
import PriceCardTemplate from '../PriceCardTemplate';
import AutoPrintTrigger from '../AutoPrintTrigger';

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
      <AutoPrintTrigger active={true} />
      
      <div className="print:m-0 print:border-none">
        <PriceCardTemplate 
          productName={productName} 
          price={price} 
          barcodeValue={barcodeValue} 
        />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: 5cm 2.5cm;
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
