import { turso } from '@/app/db';
import BarcodeComponent from '../print-pricecard/BarcodeComponent';

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
            onClick={() => {/* will be handled by auto-print in BarcodeComponent, or they can press Ctrl+P. But actually BarcodeComponent auto-prints on mount. Wait, multiple BarcodeComponents will trigger multiple window.print(). We should only trigger one. */}}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary/20"
            style={{pointerEvents: 'none', opacity: 0.5}}
          >
            Mencetak...
          </button>
        </div>

        {/* Grid Label */}
        <div 
          className="grid gap-[2mm] justify-center print:block" 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 3cm)',
            gridAutoRows: '2.5cm',
            // On print, we rely on the grid to wrap naturally inside the 210mm width
          }}
        >
          {products.map((product, index) => {
            const barcodeValue = (product.barcode as string) || (product.id as string).toString();
            const productName = product.name as string;
            const price = product.selling_price as number;

            return (
              <div 
                key={`${product.id}-${index}`}
                className="bg-white flex flex-col items-center justify-between overflow-hidden" 
                style={{
                  width: '3cm',
                  height: '2.5cm',
                  padding: '2px 4px',
                  boxSizing: 'border-box',
                  border: '1px dashed #e2e8f0', // dashed border helps with cutting
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
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center', width: '100%', overflow: 'hidden' }}>
                   <BarcodeComponent value={barcodeValue} autoPrint={index === products.length - 1} />
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
          /* Override grid for print to ensure exact dimensions */
          .grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, 3cm) !important;
            grid-auto-rows: 2.5cm !important;
            gap: 2mm !important;
            justify-content: start !important;
            align-content: start !important;
          }
        }
      `}} />
    </div>
  );
}
