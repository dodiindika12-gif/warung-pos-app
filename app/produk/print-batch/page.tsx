import { turso } from '@/app/db';
import PriceCardTemplate from '../PriceCardTemplate';
import AutoPrintTrigger from '../AutoPrintTrigger';

export default async function PrintBatch({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  
  if (!ids) return <div className="p-4 text-red-500 font-bold">ID Produk tidak ditemukan</div>;

  const idArray = ids.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  
  if (idArray.length === 0) return <div className="p-4 text-red-500 font-bold">Format ID Produk tidak valid</div>;

  // Build the query to fetch all selected products
  const placeholders = idArray.map(() => '?').join(',');
  const result = await turso.execute({
    sql: `SELECT * FROM products WHERE id IN (${placeholders})`,
    args: idArray
  });

  const products = result.rows;

  if (products.length === 0) return <div className="p-4 text-red-500 font-bold">Tidak ada produk yang ditemukan di database</div>;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white print:min-h-0">
      <AutoPrintTrigger active={true} />
      
      {/* Container A4 Page */}
      <div className="bg-white mx-auto p-4 md:p-8 md:my-8 shadow-xl print:shadow-none print:m-0 print:p-0"
           style={{ maxWidth: '210mm' }}>
        
        {/* Header untuk di layar (hilang saat diprint) */}
        <div className="mb-6 flex justify-between items-center print:hidden border-b pb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Cetak Massal Label</h1>
            <p className="text-sm text-gray-500">{products.length} label siap dicetak (Kertas A4)</p>
          </div>
          <button 
            className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary/20"
            style={{pointerEvents: 'none', opacity: 0.5}}
          >
            Mencetak...
          </button>
        </div>

        {/* Flex Layout Label */}
        <div className="flex flex-wrap gap-[2mm] justify-start content-start">
          {products.map((product, index) => {
            const barcodeValue = (product.barcode as string) || (product.id as string).toString();
            const productName = product.name as string;
            const price = product.selling_price as number;

            return (
              <PriceCardTemplate 
                key={`${product.id}-${index}`}
                productName={productName} 
                price={price} 
                barcodeValue={barcodeValue} 
              />
            );
          })}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm; /* Margin standar untuk printer A4 */
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
