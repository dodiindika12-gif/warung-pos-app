'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { addProduct, updateProduct, deleteProduct, getProductsWithRecommendation, getCategories, addCategory, updateCategory, deleteCategory, processOpname, getStockHistory, bulkUpdateCategory } from '../actions';
import BarcodeScanner from '../components/BarcodeScanner';
import OCRScanner from '../components/OCRScanner';
import { Button } from "@/components/ui/button";
import ExcelJS from 'exceljs';
import LoadingAnimation from '../components/LoadingAnimation';

type Product = { id: number; name: string; barcode: string; category: string; cost_price: number; selling_price: number; stock: number; sold_last_7_days: number; created_at?: string; image?: string };

function ProdukContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', barcode: '', category: 'Umum', cost_price: '', selling_price: '', stock: '', image: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editCatId, setEditCatId] = useState<number | null>(null);

  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [opnameItems, setOpnameItems] = useState<{product: Product, realStock: number}[]>([]);
  const [opnameSearchQuery, setOpnameSearchQuery] = useState('');
  const [showOpnameDropdown, setShowOpnameDropdown] = useState(false);
  const [showOpnameScanner, setShowOpnameScanner] = useState(false);
  const [showOCRSearch, setShowOCRSearch] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get('search') || '';
  const initialFilter = searchParams.get('filter') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filterType, setFilterType] = useState(initialFilter);
  const [sortType, setSortType] = useState('name_asc');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await getProductsWithRecommendation();
    const formattedData = data.map((row: any) => ({
      id: row.id, name: row.name, barcode: row.barcode || '', category: row.category || 'Umum', 
      cost_price: row.cost_price, selling_price: row.selling_price, stock: row.stock, sold_last_7_days: row.sold_last_7_days, image: row.image || ''
    }));
    setProducts(formattedData);
    const catData = await getCategories();
    setCategories(catData);
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    if (editCatId) {
      const res = await updateCategory(editCatId, newCatName.trim());
      if (!res.success) alert(res.error);
    } else {
      const res = await addCategory(newCatName.trim());
      if (!res.success) alert(res.error);
    }
    
    setNewCatName('');
    setEditCatId(null);
    await loadProducts();
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Yakin hapus kategori ini? Pastikan tidak ada barang yang menggunakannya.')) {
      await deleteCategory(id);
      await loadProducts();
    }
  };

  const handleSaveOpname = async () => {
    if (opnameItems.length === 0) return;
    setLoading(true);
    const itemsToProcess = opnameItems.map(item => ({
      id: item.product.id,
      realStock: item.realStock
    }));
    const res = await processOpname(itemsToProcess);
    if (!res.success) {
      alert(res.error);
    } else {
      alert('Stock Opname berhasil disimpan!');
      setOpnameItems([]);
      setShowOpnameModal(false);
      await loadProducts();
    }
    setLoading(false);
  };

  const handleAddOpnameItem = (product: Product) => {
    if (!opnameItems.find(item => item.product.id === product.id)) {
      setOpnameItems([...opnameItems, { product, realStock: product.stock }]);
    }
    setOpnameSearchQuery('');
    setShowOpnameDropdown(false);
  };

  const handleOpenHistory = async (product: Product) => {
    setSelectedProductForHistory(product);
    setShowHistoryModal(true);
    setLoading(true);
    const history = await getStockHistory(product.id);
    setHistoryItems(history);
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setFormData({ ...formData, image: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = {
      name: formData.name, 
      barcode: formData.barcode,
      category: formData.category,
      cost_price: Number(formData.cost_price), 
      selling_price: Number(formData.selling_price), 
      stock: Number(formData.stock),
      image: formData.image
    };
    if (editingProductId) {
      await updateProduct(editingProductId, data);
    } else {
      await addProduct(data);
    }
    setFormData({ name: '', barcode: '', category: 'Umum', cost_price: '', selling_price: '', stock: '', image: '' });
    setEditingProductId(null);
    await loadProducts();
    setLoading(false);
    setShowAddForm(false);
  };

  const handleEditClick = (p: Product) => {
    setFormData({
      name: p.name,
      barcode: p.barcode || '',
      category: p.category || 'Umum',
      cost_price: p.cost_price.toString(),
      selling_price: p.selling_price.toString(),
      stock: p.stock.toString(),
      image: p.image || ''
    });
    setEditingProductId(p.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus barang ini?')) {
      await deleteProduct(id);
      await loadProducts();
    }
  };


  const filteredProducts = products.filter(p => {
    let match = true;
    if (searchQuery) {
      match = match && p.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (filterType === 'low_stock') {
      const estimasiKebutuhan = p.sold_last_7_days > 0 ? p.sold_last_7_days : 5;
      match = match && (p.stock <= estimasiKebutuhan);
    } else if (filterType && filterType !== 'all') {
      match = match && p.category === filterType;
    }
    return match;
  }).sort((a, b) => {
    switch (sortType) {
      case 'name_asc': return a.name.localeCompare(b.name);
      case 'name_desc': return b.name.localeCompare(a.name);
      case 'stock_desc': return b.stock - a.stock;
      case 'stock_asc': return a.stock - b.stock;
      case 'price_desc': return b.selling_price - a.selling_price;
      case 'price_asc': return a.selling_price - b.selling_price;
      case 'profit_desc': return (b.selling_price - b.cost_price) - (a.selling_price - a.cost_price);
      case 'profit_asc': return (a.selling_price - a.cost_price) - (b.selling_price - b.cost_price);
      case 'margin_desc': return (b.cost_price > 0 ? (b.selling_price - b.cost_price) / b.cost_price : 0) - (a.cost_price > 0 ? (a.selling_price - a.cost_price) / a.cost_price : 0);
      case 'margin_asc': return (a.cost_price > 0 ? (a.selling_price - a.cost_price) / a.cost_price : 0) - (b.cost_price > 0 ? (b.selling_price - b.cost_price) / b.cost_price : 0);
      case 'dsi_asc': {
        const dsiA = a.sold_last_7_days > 0 ? Math.round(a.stock / (a.sold_last_7_days / 7)) : 999999;
        const dsiB = b.sold_last_7_days > 0 ? Math.round(b.stock / (b.sold_last_7_days / 7)) : 999999;
        return dsiA - dsiB;
      }
      case 'dsi_desc': {
        const dsiA = a.sold_last_7_days > 0 ? Math.round(a.stock / (a.sold_last_7_days / 7)) : 999999;
        const dsiB = b.sold_last_7_days > 0 ? Math.round(b.stock / (b.sold_last_7_days / 7)) : 999999;
        return dsiB - dsiA;
      }
      case 'sales_desc': return (b.sold_last_7_days || 0) - (a.sold_last_7_days || 0);
      case 'sales_asc': return (a.sold_last_7_days || 0) - (b.sold_last_7_days || 0);
      case 'status_asc': {
        const getRank = (p: any) => {
          const dsi = (p.sold_last_7_days || 0) > 0 ? Math.round(p.stock / (p.sold_last_7_days / 7)) : -1;
          const createdDate = p.created_at ? new Date(p.created_at + 'Z') : new Date();
          const daysSinceCreated = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
          const isNewProduct = daysSinceCreated <= 14;

          if (p.stock === 0) return 0;
          if (dsi !== -1 && dsi <= 7) return 1;
          if ((dsi === -1 || dsi > 30) && p.stock > 10) return 2;
          if (dsi === -1 && isNewProduct) return 3;
          return 4;
        };
        return getRank(a) - getRank(b);
      }
      case 'status_desc': {
        const getRank = (p: any) => {
          const dsi = (p.sold_last_7_days || 0) > 0 ? Math.round(p.stock / (p.sold_last_7_days / 7)) : -1;
          const createdDate = p.created_at ? new Date(p.created_at + 'Z') : new Date();
          const daysSinceCreated = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
          const isNewProduct = daysSinceCreated <= 14;

          if (p.stock === 0) return 0;
          if (dsi !== -1 && dsi <= 7) return 1;
          if ((dsi === -1 || dsi > 30) && p.stock > 10) return 2;
          if (dsi === -1 && isNewProduct) return 3;
          return 4;
        };
        return getRank(b) - getRank(a);
      }
      default: return 0;
    }
  });

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Produk');

    worksheet.columns = [
      { header: 'Barcode', key: 'barcode', width: 20 },
      { header: 'Nama', key: 'nama', width: 30 },
      { header: 'Kategori', key: 'kategori', width: 20 },
      { header: 'Harga Beli', key: 'harga_beli', width: 15 },
      { header: 'Harga Jual', key: 'harga_jual', width: 15 },
      { header: 'Laba', key: 'laba', width: 15 },
      { header: 'Margin', key: 'margin', width: 10 },
      { header: 'Stok', key: 'stok', width: 10 },
      { header: 'AVG Terjual / Minggu', key: 'avg_terjual', width: 25 },
      { header: 'DSI', key: 'dsi', width: 15 },
      { header: 'Status', key: 'status', width: 20 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    filteredProducts.forEach(p => {
      const marginRp = p.selling_price - p.cost_price;
      const marginPersen = p.cost_price > 0 ? ((marginRp / p.cost_price) * 100).toFixed(1) + '%' : '0%';
      
      const terjualMingguIni = p.sold_last_7_days || 0;
      const avgDailySales = terjualMingguIni / 7;
      const dsi = avgDailySales > 0 ? Math.round(p.stock / avgDailySales) : -1;
      const createdDate = p.created_at ? new Date(p.created_at + 'Z') : new Date();
      const daysSinceCreated = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      const isNewProduct = daysSinceCreated <= 14;
      
      let dsiDisplay = dsi === -1 ? "-" : `${dsi} hari`;
      
      let status = '';
      if (p.stock === 0) status = 'Habis';
      else if (dsi === -1 && isNewProduct) status = 'Baru';
      else if (dsi !== -1 && dsi <= 7) status = 'Kritis';
      else if ((dsi === -1 || dsi > 30) && p.stock > 10) status = 'Overstock';
      else status = 'Aman';

      const row = worksheet.addRow({
        barcode: p.barcode || '-',
        nama: p.name,
        kategori: p.category,
        harga_beli: p.cost_price,
        harga_jual: p.selling_price,
        laba: marginRp,
        margin: marginPersen,
        stok: p.stock,
        avg_terjual: parseFloat(avgDailySales.toFixed(1)),
        dsi: dsiDisplay,
        status: status
      });

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        if ([4, 5, 6].includes(colNumber)) {
          cell.numFmt = '"Rp"#,##0';
        }
        if ([8, 9].includes(colNumber)) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Produk_${new Date(new Date().getTime() + 8 * 3600 * 1000).toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="flex w-full h-full p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
      <div className="flex flex-col w-full max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-800">📦 Master Produk</h1>
            <p className="text-gray-500 font-medium mt-1">Kelola inventaris dan pantau stok warung Anda</p>
          </div>
          <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-4 w-full md:w-auto">
            <Button 
              variant="outline"
              onClick={() => setShowCategoryModal(true)} 
              className="font-bold w-full md:w-auto px-2 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl shadow-sm transition flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm h-10 md:h-12"
            >
              🏷️ Kategori
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowOpnameModal(true)} 
              className="font-bold w-full md:w-auto px-2 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl shadow-sm transition flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm h-10 md:h-12"
            >
              📋 Opname
            </Button>
            <Button 
              variant="outline"
              onClick={exportToExcel}
              className="font-bold w-full md:w-auto px-2 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl shadow-sm transition flex items-center justify-center gap-1.5 md:gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 text-xs md:text-sm h-10 md:h-12"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Excel
            </Button>
            <Button 
              onClick={() => {
                setEditingProductId(null);
                setFormData({ name: '', barcode: '', category: 'Umum', selling_price: '', cost_price: '', stock: '', image: '' });
                setShowAddForm(true);
              }} 
              className="font-bold w-full md:w-auto px-2 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm h-10 md:h-12"
            >
              + Tambah
            </Button>
          </div>
        </div>

        <div className="flex flex-col">
          
          {/* Modal Form Tambah / Edit Barang */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg bg-white p-8 rounded-[32px] shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button 
                  onClick={() => setShowAddForm(false)} 
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold mb-6 text-gray-800 pr-10">{editingProductId ? '✏️ Edit Barang' : '📦 Tambah Barang'}</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="flex gap-4 mb-2 items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200 shrink-0">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-gray-300">📷</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Foto Produk (Opsional)</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Nama Barang</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" placeholder="Cth: Kopi Kapal Api" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Barcode (Opsional)</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="flex-1 bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-mono text-gray-800 focus:outline-none transition" placeholder="Ketik atau scan barcode..." />
                    <button type="button" onClick={() => setShowScanner(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 rounded-2xl shadow-sm transition flex items-center justify-center whitespace-nowrap">
                      📷 Scan
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Kategori</label>
                  <select required value={formData.category} onChange={e => {
                    const newCat = e.target.value;
                    let recommendedStr = formData.selling_price;
                    if (formData.cost_price) {
                       const costNum = Number(formData.cost_price);
                       const margin = newCat === 'Sembako' ? 0.15 : 0.25;
                       const rawPrice = costNum * (1 + margin);
                       const rounded = Math.ceil(rawPrice / 500) * 500;
                       recommendedStr = rounded.toString();
                    }
                    setFormData({...formData, category: newCat, selling_price: recommendedStr});
                  }} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition appearance-none cursor-pointer">
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Harga Modal</label>
                    <input required type="number" value={formData.cost_price} onChange={e => {
                        const newCost = e.target.value;
                        const costNum = Number(newCost);
                        let recommendedStr = formData.selling_price;
                        if (newCost && !isNaN(costNum)) {
                          const margin = formData.category === 'Sembako' ? 0.15 : 0.25;
                          const rawPrice = costNum * (1 + margin);
                          const rounded = Math.ceil(rawPrice / 500) * 500;
                          recommendedStr = rounded.toString();
                        }
                        setFormData({...formData, cost_price: newCost, selling_price: recommendedStr});
                    }} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" placeholder="0" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Harga Jual</label>
                    <input required type="number" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" placeholder="0" />
                  </div>
                </div>

                {formData.cost_price && formData.selling_price && (
                  <div className="bg-primary/10 p-4 rounded-2xl border border-primary/10 flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">Margin Penjualan:</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-green-600 mr-2">Rp {(Number(formData.selling_price) - Number(formData.cost_price)).toLocaleString('id-ID')}</span>
                      <span className="text-xs font-bold bg-white text-primary px-2 py-1 rounded-lg border border-primary/20">
                        {Number(formData.cost_price) > 0 ? (((Number(formData.selling_price) - Number(formData.cost_price)) / Number(formData.cost_price)) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Stok Awal</label>
                  <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition" placeholder="0" />
                </div>

                <Button disabled={loading} type="submit" className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/30 mt-4">
                  {loading ? 'Menyimpan...' : (editingProductId ? 'Simpan Perubahan' : '+ Simpan Produk')}
                </Button>
              </form>
              
              {showScanner && (
                <BarcodeScanner 
                  onScanSuccess={(code) => {
                    setFormData({...formData, barcode: code});
                    setShowScanner(false);
                  }}
                  onClose={() => setShowScanner(false)}
                />
              )}
              </div>
            </div>
          )}

          {/* Tabel Data Master */}
          <div className="w-full bg-white p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 overflow-x-auto flex flex-col mt-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800">Daftar & Status Restock</h2>
              
              {/* Filter UI */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full lg:w-auto">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="all">Semua Produk</option>
                  <option value="low_stock">⚠️ Stok Menipis</option>
                  <option disabled>--- Kategori ---</option>
                  {categories.map(c => (
                    <option key={`filter-cat-${c.id}`} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="name_asc">A-Z (Nama)</option>
                  <option value="name_desc">Z-A (Nama)</option>
                  <option value="stock_desc">Stok Terbanyak</option>
                  <option value="stock_asc">Stok Tersedikit</option>
                  <option value="price_desc">Harga Termahal</option>
                  <option value="price_asc">Harga Termurah</option>
                  <option disabled>--- Analisis Laba ---</option>
                  <option value="profit_desc">Laba Tertinggi (Rp)</option>
                  <option value="profit_asc">Laba Terendah (Rp)</option>
                  <option value="margin_desc">Margin Tertinggi (%)</option>
                  <option value="margin_asc">Margin Terendah (%)</option>
                  <option disabled>--- Analisis Stok ---</option>
                  <option value="sales_desc">Paling Laku (Penjualan/Mgg)</option>
                  <option value="sales_asc">Kurang Laku (Penjualan/Mgg)</option>
                  <option value="dsi_asc">DSI Tercepat (Cepat Habis)</option>
                  <option value="dsi_desc">DSI Terlama (Slow Moving)</option>
                  <option value="status_asc">Prioritas Status (Habis/Kritis Dulu)</option>
                  <option value="status_desc">Status (Aman Dulu)</option>
                </select>
                <div className="relative w-full md:w-auto flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="Cari produk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm focus:outline-none focus:border-primary transition"
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={() => setShowOCRSearch(true)} title="AI Scan Kemasan" className="shrink-0 bg-white border border-gray-200 hover:bg-blue-50 text-blue-600 font-bold px-3 rounded-xl shadow-sm transition flex items-center justify-center">
                    ✨
                  </button>
                </div>
              </div>
            </div>
            
            {/* TABLE */}
            <div className="w-full overflow-x-auto pb-32 md:pb-0">
              <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
              <thead>
                <tr className="border-b-2 border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-4 font-bold w-10 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                      checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(filteredProducts.map(p => p.id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                    />
                  </th>
                  <th className="pb-4 font-bold">Produk</th>
                  <th className="pb-4 font-bold">Harga Beli</th>
                  <th className="pb-4 font-bold">Harga Jual</th>
                  <th className="pb-4 font-bold">Stok & Status</th>
                  <th className="pb-4 text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">Tidak ada produk ditemukan.</td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const marginRp = p.selling_price - p.cost_price;
                    const marginPersen = ((marginRp / p.cost_price) * 100).toFixed(1);
                    
                    const terjualMingguIni = p.sold_last_7_days;
                    const avgDailySales = terjualMingguIni / 7;
                    const dsi = avgDailySales > 0 ? Math.round(p.stock / avgDailySales) : -1;
                    const createdDate = p.created_at ? new Date(p.created_at + 'Z') : new Date();
                    const daysSinceCreated = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
                    const isNewProduct = daysSinceCreated <= 14;

                    let dsiDisplay: React.ReactNode;
                    if (avgDailySales > 0) {
                      dsiDisplay = `${dsi}d`;
                    } else if (p.stock > 0) {
                      if (isNewProduct) {
                        dsiDisplay = <span className="text-blue-500 font-black text-[10px] leading-none tracking-tighter">NEW</span>;
                      } else {
                        dsiDisplay = <span className="text-red-500 font-black text-sm">∞</span>;
                      }
                    } else {
                      dsiDisplay = "-";
                    }

                    let status = '';
                    let statusColor = '';

                    if (p.stock === 0) {
                      status = 'Habis'; statusColor = 'bg-red-50 text-red-600 border border-red-200';
                    } else if (dsi === -1 && isNewProduct) {
                      status = 'Baru'; statusColor = 'bg-blue-50 text-blue-600 border border-blue-200';
                    } else if (dsi !== -1 && dsi <= 7) {
                      status = 'Kritis'; statusColor = 'bg-red-50 text-red-600 border border-red-200';
                    } else if ((dsi === -1 || dsi > 30) && p.stock > 10) {
                      status = 'Overstock'; statusColor = 'bg-yellow-50 text-yellow-600 border border-yellow-200';
                    } else {
                      status = 'Aman'; statusColor = 'bg-green-50 text-green-600 border border-green-200';
                    }

                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="py-4 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                            checked={selectedProducts.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, p.id]);
                              } else {
                                setSelectedProducts(selectedProducts.filter(id => id !== p.id));
                              }
                            }}
                          />
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200 flex items-center justify-center">
                              {p.image ? (
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-gray-300 text-xs">📷</span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                              <div className="text-xs text-gray-400 font-medium mt-1">
                                {p.category} {p.barcode && <span className="ml-2 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">📍 {p.barcode}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="font-bold text-gray-800 text-sm">Rp {p.cost_price.toLocaleString('id-ID')}</div>
                          <div className="text-xs text-green-600 font-medium mt-1">Laba: Rp {marginRp.toLocaleString('id-ID')}</div>
                        </td>
                        <td className="py-4">
                          <div className="font-bold text-gray-800 text-sm">Rp {p.selling_price.toLocaleString('id-ID')}</div>
                          <div className="text-xs text-green-600 font-medium mt-1">Margin: {marginPersen}%</div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-gray-800 text-lg">{p.stock}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${statusColor}`}>
                                {status}
                              </span>
                            </div>
                            <span className="text-[10px] text-primary font-bold mt-1 bg-primary/10 px-2 py-0.5 rounded-md">
                              Sell {terjualMingguIni}/w | DSI {dsiDisplay}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex justify-center relative">
                            <button onClick={() => setOpenActionId(openActionId === p.id ? null : p.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-200 transition" title="Aksi">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            {openActionId === p.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenActionId(null)}></div>
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-36 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-50 focus:outline-none z-50 overflow-hidden">
                                  <button onClick={() => { setOpenActionId(null); handleOpenHistory(p); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors">
                                    <span>🕒</span> Kartu Stok
                                  </button>
                                  <button onClick={() => { setOpenActionId(null); window.open(`/produk/print-pricecard?id=${p.id}`, '_blank'); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2 transition-colors">
                                    <span>🖨️</span> Cetak Label
                                  </button>
                                  <button onClick={() => { setOpenActionId(null); handleEditClick(p); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Edit
                                  </button>
                                  <button onClick={() => { setOpenActionId(null); handleDelete(p.id); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Hapus
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
          
          {/* Modal Kelola Kategori */}
          {showCategoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={() => {setShowCategoryModal(false); setEditCatId(null); setNewCatName('');}} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold mb-6 text-gray-800">🏷️ Kelola Kategori</h2>
                
                <form onSubmit={handleSaveCategory} className="flex gap-2 mb-6">
                  <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nama kategori baru..." className="flex-1 bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-3 text-sm font-semibold text-gray-800 focus:outline-none transition" />
                  <Button type="submit" className="shrink-0 h-[46px] px-6 rounded-2xl font-bold">
                    {editCatId ? 'Simpan' : 'Tambah'}
                  </Button>
                </form>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary/20 transition">
                      <span className="font-bold text-gray-800 text-sm">{c.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => {setEditCatId(c.id); setNewCatName(c.name);}} className="text-primary hover:text-primary/70 font-medium text-xs px-2 py-1 bg-primary/10 rounded-lg">Edit</button>
                        <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:text-red-700 font-medium text-xs px-2 py-1 bg-red-50 rounded-lg">Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Modal Stock Opname */}
          {showOpnameModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-4xl bg-white p-8 rounded-[32px] shadow-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={() => {setShowOpnameModal(false); setOpnameItems([]);}} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <h2 className="text-2xl font-black mb-2 text-gray-800">📋 Stock Opname</h2>
                <p className="text-gray-500 mb-6 font-medium">Sesuaikan stok fisik dengan data sistem.</p>
                
                <div className="relative z-50 mb-6">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Cari nama barang atau scan barcode..." 
                      value={opnameSearchQuery}
                      onChange={(e) => {
                        setOpnameSearchQuery(e.target.value);
                        setShowOpnameDropdown(true);
                      }}
                      onFocus={() => setShowOpnameDropdown(true)}
                      className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:outline-none transition"
                    />
                    <button type="button" onClick={() => setShowOpnameScanner(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 rounded-2xl shadow-sm transition flex items-center justify-center whitespace-nowrap">
                      📷
                    </button>
                  </div>
                  {showOpnameDropdown && opnameSearchQuery && (
                    <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                      {products.filter(p => p.name.toLowerCase().includes(opnameSearchQuery.toLowerCase()) || p.barcode.includes(opnameSearchQuery)).map(p => (
                        <div key={p.id} onClick={() => handleAddOpnameItem(p)} className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center transition">
                          <div>
                            <p className="font-bold text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{p.barcode || 'Tanpa Barcode'}</p>
                          </div>
                          <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-lg">Stok: {p.stock}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {showOpnameScanner && (
                  <BarcodeScanner 
                    onScanSuccess={(code) => {
                      const product = products.find(p => p.barcode === code);
                      if (product) {
                        handleAddOpnameItem(product);
                      } else {
                        alert('Barang tidak ditemukan di database!');
                      }
                      setShowOpnameScanner(false);
                    }}
                    onClose={() => setShowOpnameScanner(false)}
                  />
                )}

                <div className="flex-1 overflow-y-auto mb-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100/50 sticky top-0 z-10 backdrop-blur-sm">
                      <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Barang</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Stok Sistem</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Stok Fisik</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Selisih</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {opnameItems.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-medium">Belum ada barang untuk opname</td></tr>
                      ) : (
                        opnameItems.map((item, index) => {
                          const diff = item.realStock - item.product.stock;
                          return (
                            <tr key={item.product.id} className="bg-white">
                              <td className="p-4">
                                <p className="font-bold text-gray-800">{item.product.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{item.product.barcode || '-'}</p>
                              </td>
                              <td className="p-4 text-center font-bold text-gray-600">{item.product.stock}</td>
                              <td className="p-4 text-center">
                                <input 
                                  type="number" 
                                  value={item.realStock}
                                  onChange={(e) => {
                                    const newItems = [...opnameItems];
                                    newItems[index].realStock = Number(e.target.value) || 0;
                                    setOpnameItems(newItems);
                                  }}
                                  className="w-20 text-center bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl p-2 text-sm font-bold text-gray-800 focus:outline-none transition mx-auto"
                                />
                              </td>
                              <td className="p-4 text-center font-black">
                                <span className={diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-400'}>
                                  {diff > 0 ? `+${diff}` : diff}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button onClick={() => setOpnameItems(opnameItems.filter(i => i.product.id !== item.product.id))} className="text-red-400 hover:text-red-600 transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <Button disabled={loading || opnameItems.length === 0} onClick={handleSaveOpname} className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/30">
                  {loading ? 'Menyimpan...' : 'Simpan Opname'}
                </Button>
              </div>
            </div>
          )}

          {/* Modal History */}
          {showHistoryModal && selectedProductForHistory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-2xl bg-white p-8 rounded-[32px] shadow-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={() => setShowHistoryModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <h2 className="text-2xl font-black mb-2 text-gray-800">🕒 Kartu Stok</h2>
                <p className="text-gray-500 mb-6 font-medium">Riwayat stok untuk: <span className="font-bold text-primary">{selectedProductForHistory.name}</span></p>

                <div className="flex-1 overflow-y-auto mb-2 bg-gray-50 rounded-2xl border border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100/50 sticky top-0 z-10 backdrop-blur-sm">
                      <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Alasan</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Perubahan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr><td colSpan={3} className="p-8"><LoadingAnimation text="Memuat riwayat..." /></td></tr>
                      ) : historyItems.length === 0 ? (
                        <tr><td colSpan={3} className="p-8 text-center text-gray-400 font-medium">Belum ada riwayat stok.</td></tr>
                      ) : (
                        historyItems.map((item, index) => (
                          <tr key={index} className="bg-white">
                            <td className="p-4 text-sm text-gray-600 font-medium">
                              {new Date(item.created_at + 'Z').toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </td>
                            <td className="p-4 text-sm font-bold text-gray-800">
                              {item.reason}
                            </td>
                            <td className="p-4 text-center font-black">
                              <span className={item.change_amount > 0 ? 'text-green-500' : item.change_amount < 0 ? 'text-red-500' : 'text-gray-400'}>
                                {item.change_amount > 0 ? `+${item.change_amount}` : item.change_amount}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Floating Action Bar untuk Cetak & Ubah Kategori Massal */}
          {selectedProducts.length > 0 && (
            <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 md:px-6 py-3 md:py-4 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center gap-3 md:gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 w-[95%] md:w-auto">
              <div className="font-semibold text-sm whitespace-nowrap">
                <span className="bg-primary/20 text-white px-2 py-1 rounded-md mr-2">{selectedProducts.length}</span>
                Produk Terpilih
              </div>
              <div className="flex flex-wrap justify-center items-center gap-2">
                <select 
                  onChange={async (e) => {
                    const cat = e.target.value;
                    if (cat && confirm(`Ubah kategori untuk ${selectedProducts.length} produk yang dipilih menjadi "${cat}"?`)) {
                      setLoading(true);
                      await bulkUpdateCategory(selectedProducts, cat);
                      await loadProducts();
                      setSelectedProducts([]);
                      setLoading(false);
                    }
                    e.target.value = "";
                  }}
                  className="bg-gray-800 text-white border border-gray-700 rounded-xl px-3 h-9 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer text-center"
                  disabled={loading}
                >
                  <option value="">+ Pindah Kategori</option>
                  {categories.map(c => (
                    <option key={`bulk-cat-${c.id}`} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <Button 
                  onClick={() => window.open(`/produk/print-batch?ids=${selectedProducts.join(',')}`, '_blank')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2 h-9"
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Cetak Label
                </Button>
                <Button 
                  onClick={() => setSelectedProducts([])}
                  variant="ghost" 
                  className="text-gray-300 hover:text-white hover:bg-white/10 rounded-xl text-xs font-semibold h-9"
                  disabled={loading}
                >
                  Batal
                </Button>
              </div>
            </div>
          )}

          {showOCRSearch && (
            <OCRScanner 
              products={products}
              onScanSuccess={(product) => {
                setSearchQuery(product.name);
                setShowOCRSearch(false);
              }}
              onClose={() => setShowOCRSearch(false)}
            />
          )}

        </div>
      </div>
    </div>
  );
}

// Membungkus dengan Suspense karena menggunakan useSearchParams
export default function ProdukPage() {
  return (
    <Suspense fallback={<LoadingAnimation text="Memuat Produk..." />}>
      <ProdukContent />
    </Suspense>
  );
}