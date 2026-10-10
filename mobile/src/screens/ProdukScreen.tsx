import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  History,
  ClipboardCheck,
  FolderPlus,
  ArrowUpDown,
  ShoppingCart,
  Check,
  AlertTriangle,
  Camera,
} from 'lucide-react-native';
import { callAction } from '../api';
import { Product, Category, StockHistoryItem } from '../types';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function ProdukScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Barcode Scanner Target
  const [scannerTarget, setScannerTarget] = useState<'search' | 'form' | 'opname' | null>(null);

  // Search & Filter & Sort
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<'name_asc' | 'stock_asc' | 'price_desc' | 'sold_desc'>('name_asc');

  // Form Modal (Add / Edit Product)
  const [isFormModalVisible, setIsFormModalVisible] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formBarcode, setFormBarcode] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Umum');
  const [formCostPrice, setFormCostPrice] = useState<string>('');
  const [formSellingPrice, setFormSellingPrice] = useState<string>('');
  const [formStock, setFormStock] = useState<string>('0');
  const [formLoading, setFormLoading] = useState<boolean>(false);

  // Category Management Modal
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);

  // Stock Opname Modal
  const [isOpnameModalVisible, setIsOpnameModalVisible] = useState<boolean>(false);
  const [opnameItems, setOpnameItems] = useState<{ id: number; name: string; currentStock: number; realStock: number }[]>([]);
  const [opnameSearch, setOpnameSearch] = useState<string>('');
  const [opnameLoading, setOpnameLoading] = useState<boolean>(false);

  // Stock History Modal
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState<boolean>(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [historyList, setHistoryList] = useState<StockHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let prodsData: any[] = [];
      try {
        prodsData = await callAction('getProductsWithRecommendation');
      } catch (innerErr) {
        console.warn('Fallback to getProducts:', innerErr);
        prodsData = await callAction('getProducts');
      }
      const catsData = await callAction('getCategories');
      setProducts(prodsData || []);
      setCategories(catsData || []);
    } catch (e: any) {
      console.warn('Gagal memuat produk:', e.message);
      setErrorMessage(e.message || 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filtered & Sorted Products
  const processedProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()));
      const matchCat =
        selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });

    result.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'price_desc') return b.selling_price - a.selling_price;
      if (sortBy === 'sold_desc') return (b.sold_last_7_days || 0) - (a.sold_last_7_days || 0);
      return 0;
    });

    return result;
  }, [products, search, selectedCategory, sortBy]);

  const handleBarcodeScanned = (scannedCode: string) => {
    if (scannerTarget === 'search') {
      setSearch(scannedCode);
    } else if (scannerTarget === 'form') {
      setFormBarcode(scannedCode);
      Alert.alert('Barcode Terisi', `Barcode: ${scannedCode}`);
    } else if (scannerTarget === 'opname') {
      const found = products.find(
        (p) => p.barcode && p.barcode.toLowerCase() === scannedCode.toLowerCase()
      );
      if (found) {
        addProductToOpname(found);
        Alert.alert('Ditambahkan ke Opname', `"${found.name}" berhasil dimasukkan ke daftar opname.`);
      } else {
        Alert.alert('Tidak Ditemukan', `Produk dengan barcode "${scannedCode}" tidak ditemukan.`);
      }
    }
    setScannerTarget(null);
  };

  // Open Add Product Form
  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBarcode('');
    setFormCategory(categories[0]?.name || 'Umum');
    setFormCostPrice('');
    setFormSellingPrice('');
    setFormStock('0');
    setIsFormModalVisible(true);
  };

  // Open Edit Product Form
  const handleOpenEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormBarcode(prod.barcode || '');
    setFormCategory(prod.category || 'Umum');
    setFormCostPrice(prod.cost_price.toString());
    setFormSellingPrice(prod.selling_price.toString());
    setFormStock(prod.stock.toString());
    setIsFormModalVisible(true);
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async () => {
    if (!formName.trim()) {
      Alert.alert('Nama Kosong', 'Silakan masukkan nama produk.');
      return;
    }
    const cost = parseFloat(formCostPrice) || 0;
    const sell = parseFloat(formSellingPrice) || 0;
    const stk = parseInt(formStock, 10) || 0;

    if (sell <= 0) {
      Alert.alert('Harga Jual', 'Harga jual harus lebih besar dari 0.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingProduct) {
        await callAction('updateProduct', [
          editingProduct.id,
          {
            name: formName.trim(),
            barcode: formBarcode.trim(),
            category: formCategory,
            cost_price: cost,
            selling_price: sell,
            stock: stk,
          },
        ]);
        Alert.alert('Sukses', 'Produk berhasil diperbarui.');
      } else {
        await callAction('addProduct', {
          name: formName.trim(),
          barcode: formBarcode.trim(),
          category: formCategory,
          cost_price: cost,
          selling_price: sell,
          stock: stk,
        });
        Alert.alert('Sukses', 'Produk baru berhasil ditambahkan.');
      }
      setIsFormModalVisible(false);
      await loadData();
    } catch (e: any) {
      Alert.alert('Gagal Menyimpan', e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = (prod: Product) => {
    Alert.alert(
      'Hapus Produk',
      `Yakin ingin menghapus "${prod.name}"? Data penjualan dan riwayat transaksi tidak akan terhapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await callAction('deleteProduct', prod.id);
              Alert.alert('Sukses', 'Produk berhasil dihapus.');
              await loadData();
            } catch (e: any) {
              Alert.alert('Gagal Hapus', e.message);
            }
          },
        },
      ]
    );
  };

  // Add to Shopping List directly
  const handleAddToShoppingList = async (prod: Product) => {
    try {
      await callAction('addToShoppingList', [prod.id, 5]);
      Alert.alert('Ditambahkan', `"${prod.name}" (5 pcs) berhasil ditambahkan ke Daftar Belanja.`);
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    }
  };

  // Open Stock History
  const handleOpenStockHistory = async (prod: Product) => {
    setSelectedProductForHistory(prod);
    setIsHistoryModalVisible(true);
    setHistoryLoading(true);
    try {
      const data = await callAction('getStockHistory', prod.id);
      setHistoryList(data || []);
    } catch (e: any) {
      console.warn('Gagal ambil riwayat:', e.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Category Actions
  const handleSaveCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      if (editingCatId) {
        await callAction('updateCategory', [editingCatId, newCatName.trim()]);
      } else {
        await callAction('addCategory', newCatName.trim());
      }
      setNewCatName('');
      setEditingCatId(null);
      await loadData();
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    Alert.alert('Hapus Kategori', `Yakin hapus kategori "${cat.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await callAction('deleteCategory', cat.id);
            await loadData();
          } catch (e: any) {
            Alert.alert('Gagal Hapus', e.message);
          }
        },
      },
    ]);
  };

  // Stock Opname Actions
  const handleOpenOpname = () => {
    setOpnameItems([]);
    setOpnameSearch('');
    setIsOpnameModalVisible(true);
  };

  const addProductToOpname = (prod: Product) => {
    if (opnameItems.some((i) => i.id === prod.id)) return;
    setOpnameItems((prev) => [
      ...prev,
      { id: prod.id, name: prod.name, currentStock: prod.stock, realStock: prod.stock },
    ]);
  };

  const updateOpnameRealStock = (id: number, val: string) => {
    const num = parseInt(val, 10);
    setOpnameItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, realStock: isNaN(num) ? 0 : num } : i))
    );
  };

  const handleSaveOpname = async () => {
    if (opnameItems.length === 0) return;
    setOpnameLoading(true);
    try {
      const payload = opnameItems.map((item) => ({
        id: item.id,
        realStock: item.realStock,
      }));
      await callAction('processOpname', [payload]);
      Alert.alert('Sukses', 'Stock Opname berhasil disimpan & disesuaikan!');
      setIsOpnameModalVisible(false);
      setOpnameItems([]);
      await loadData();
    } catch (e: any) {
      Alert.alert('Gagal Opname', e.message);
    } finally {
      setOpnameLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>MASTER PRODUK</Text>
            <Text style={styles.headerSubtitle}>
              Total {products.length} Barang Terdaftar
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddForm}>
            <Plus size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* Action Button Row */}
        <View style={styles.headerActionRow}>
          <TouchableOpacity
            style={styles.subActionBtn}
            onPress={() => setIsCategoryModalVisible(true)}
          >
            <FolderPlus size={16} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.subActionBtnText}>Kategori</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.subActionBtn} onPress={handleOpenOpname}>
            <ClipboardCheck size={16} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.subActionBtnText}>Stock Opname</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subActionBtn}
            onPress={() => {
              if (sortBy === 'name_asc') setSortBy('stock_asc');
              else if (sortBy === 'stock_asc') setSortBy('price_desc');
              else if (sortBy === 'price_desc') setSortBy('sold_desc');
              else setSortBy('name_asc');
            }}
          >
            <ArrowUpDown size={16} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.subActionBtnText}>
              {sortBy === 'name_asc'
                ? 'A-Z'
                : sortBy === 'stock_asc'
                ? 'Stok Rendah'
                : sortBy === 'price_desc'
                ? 'Harga Tinggi'
                : 'Terlaris'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari barang atau barcode..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 8 }}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.scanIconBtn}
            onPress={() => setScannerTarget('search')}
          >
            <Camera size={18} color="#38BDF8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.catPill,
              selectedCategory === 'Semua' && styles.catPillActive,
            ]}
            onPress={() => setSelectedCategory('Semua')}
          >
            <Text
              style={[
                styles.catPillText,
                selectedCategory === 'Semua' && styles.catPillTextActive,
              ]}
            >
              Semua
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.catPill,
                selectedCategory === c.name && styles.catPillActive,
              ]}
              onPress={() => setSelectedCategory(c.name)}
            >
              <Text
                style={[
                  styles.catPillText,
                  selectedCategory === c.name && styles.catPillTextActive,
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat data produk...</Text>
        </View>
      ) : (
        <FlatList
          data={processedProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const isOut = item.stock <= 0;
            const isLow = item.stock > 0 && item.stock <= 5;

            return (
              <View style={styles.card}>
                <View style={styles.cardMain}>
                  <View style={styles.cardHeader}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{item.category || 'Umum'}</Text>
                    </View>
                    <View
                      style={[
                        styles.stockBadge,
                        isOut
                          ? styles.stockBadgeOut
                          : isLow
                          ? styles.stockBadgeLow
                          : styles.stockBadgeSafe,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockBadgeText,
                          isOut
                            ? styles.stockBadgeTextOut
                            : isLow
                            ? styles.stockBadgeTextLow
                            : styles.stockBadgeTextSafe,
                        ]}
                      >
                        {isOut ? 'Habis' : `Stok: ${item.stock}`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.productName}>{item.name}</Text>
                  {Boolean(item.barcode) && (
                    <Text style={styles.barcodeText}>Barcode: {item.barcode}</Text>
                  )}

                  <View style={styles.priceRow}>
                    <View>
                      <Text style={styles.label}>Harga Jual</Text>
                      <Text style={styles.sellingPrice}>
                        Rp {item.selling_price.toLocaleString('id-ID')}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.label}>Modal (HPP)</Text>
                      <Text style={styles.costPrice}>
                        Rp {item.cost_price.toLocaleString('id-ID')}
                      </Text>
                    </View>
                    {item.sold_last_7_days ? (
                      <View>
                        <Text style={styles.label}>Terjual 7 Hari</Text>
                        <Text style={styles.soldValue}>{item.sold_last_7_days} pcs</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Card Action Bar */}
                <View style={styles.cardActionBar}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => handleOpenStockHistory(item)}
                  >
                    <History size={16} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.cardActionText}>Riwayat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => handleAddToShoppingList(item)}
                  >
                    <ShoppingCart size={16} color="#2563EB" style={{ marginRight: 4 }} />
                    <Text style={[styles.cardActionText, { color: '#2563EB' }]}>
                      + Belanja
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => handleOpenEditForm(item)}
                  >
                    <Edit size={16} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={[styles.cardActionText, { color: '#059669' }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardActionBtn, { borderRightWidth: 0 }]}
                    onPress={() => handleDeleteProduct(item)}
                  >
                    <Trash2 size={16} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={[styles.cardActionText, { color: '#EF4444' }]}>
                      Hapus
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            errorMessage ? (
              <View style={styles.emptyContainer}>
                <AlertTriangle size={48} color="#EF4444" />
                <Text style={[styles.emptyTitle, { color: '#EF4444' }]}>Gagal Terhubung ke Server</Text>
                <Text style={styles.emptyDesc}>{errorMessage}</Text>
                <TouchableOpacity
                  style={[styles.addBtn, { marginTop: 14, backgroundColor: '#2563EB', paddingHorizontal: 20 }]}
                  onPress={loadData}
                >
                  <Text style={styles.addBtnText}>Muat Ulang Data</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Package size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Tidak Ada Produk</Text>
                <Text style={styles.emptyDesc}>
                  {search ? 'Tidak ada produk yang cocok dengan pencarian.' : 'Katalog kosong atau belum ada produk terdaftar.'}
                </Text>
                <TouchableOpacity
                  style={[styles.addBtn, { marginTop: 14, backgroundColor: '#2563EB', paddingHorizontal: 20 }]}
                  onPress={handleOpenAddForm}
                >
                  <Text style={styles.addBtnText}>+ Tambah Produk Baru</Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      )}

      {/* MODAL 1: Add / Edit Product Form */}
      <Modal
        visible={isFormModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFormModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </Text>
              <TouchableOpacity onPress={() => setIsFormModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <Text style={styles.inputLabel}>Nama Produk *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Indomie Goreng Spesial"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.inputLabel}>Barcode (Opsional)</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Ketik atau scan barcode..."
                  value={formBarcode}
                  onChangeText={setFormBarcode}
                />
                <TouchableOpacity
                  style={styles.scanInputBtn}
                  onPress={() => setScannerTarget('form')}
                >
                  <Camera size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.scanInputBtnText}>Scan</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Kategori</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.catSelectPill,
                      formCategory === c.name && styles.catSelectPillActive,
                    ]}
                    onPress={() => setFormCategory(c.name)}
                  >
                    <Text
                      style={[
                        styles.catSelectText,
                        formCategory === c.name && styles.catSelectTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.inputGrid}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Harga Beli (Modal)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={formCostPrice}
                    onChangeText={setFormCostPrice}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Harga Jual *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={formSellingPrice}
                    onChangeText={setFormSellingPrice}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Stok Tersedia</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="0"
                value={formStock}
                onChangeText={setFormStock}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, formLoading && { opacity: 0.7 }]}
                onPress={handleSaveProduct}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingProduct ? 'Perbarui Produk' : 'Simpan Produk Baru'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Kelola Kategori */}
      <Modal
        visible={isCategoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kelola Kategori</Text>
              <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Nama kategori..."
                  value={newCatName}
                  onChangeText={setNewCatName}
                />
                <TouchableOpacity
                  style={styles.catAddBtn}
                  onPress={handleSaveCategory}
                >
                  <Text style={styles.catAddBtnText}>
                    {editingCatId ? 'Simpan' : 'Tambah'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }}>
                {categories.map((c) => (
                  <View key={c.id} style={styles.catItemRow}>
                    <Text style={styles.catItemName}>{c.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingCatId(c.id);
                          setNewCatName(c.name);
                        }}
                      >
                        <Edit size={18} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteCategory(c)}>
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Stock Opname */}
      <Modal
        visible={isOpnameModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpnameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stock Opname Fisik</Text>
              <TouchableOpacity onPress={() => setIsOpnameModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={styles.subNote}>
                Pilih produk lalu masukkan jumlah fisik aktual di toko Anda.
              </Text>

              {/* Add item to opname */}
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Ketik nama atau scan barcode..."
                  value={opnameSearch}
                  onChangeText={setOpnameSearch}
                />
                <TouchableOpacity
                  style={styles.scanInputBtn}
                  onPress={() => setScannerTarget('opname')}
                >
                  <Camera size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.scanInputBtnText}>Scan</Text>
                </TouchableOpacity>
              </View>

              {Boolean(opnameSearch) && (
                <View style={styles.opnameDropdown}>
                  {products
                    .filter((p) =>
                      p.name.toLowerCase().includes(opnameSearch.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.opnameDropItem}
                        onPress={() => {
                          addProductToOpname(p);
                          setOpnameSearch('');
                        }}
                      >
                        <Text style={styles.opnameDropText}>{p.name}</Text>
                        <Text style={styles.opnameDropStock}>Stok: {p.stock}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}

              <ScrollView style={{ maxHeight: 280, marginTop: 10 }}>
                {opnameItems.map((item) => {
                  const diff = item.realStock - item.currentStock;
                  return (
                    <View key={item.id} style={styles.opnameRow}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.opnameName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.opnameSub}>
                          Sistem: {item.currentStock} | Selisih:{' '}
                          <Text
                            style={{
                              color:
                                diff > 0
                                  ? '#10B981'
                                  : diff < 0
                                  ? '#EF4444'
                                  : '#64748B',
                              fontWeight: 'bold',
                            }}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </Text>
                        </Text>
                      </View>
                      <TextInput
                        style={styles.opnameInput}
                        keyboardType="numeric"
                        value={item.realStock.toString()}
                        onChangeText={(v) => updateOpnameRealStock(item.id, v)}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, opnameLoading && { opacity: 0.7 }]}
                onPress={handleSaveOpname}
                disabled={opnameLoading || opnameItems.length === 0}
              >
                {opnameLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    Simpan Penyesuaian Stok ({opnameItems.length} Item)
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Stock History */}
      <Modal
        visible={isHistoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Riwayat Mutasi Stok</Text>
                <Text style={styles.modalSubTitle}>
                  {selectedProductForHistory?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsHistoryModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {historyLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : (
              <ScrollView style={{ padding: 16 }}>
                {historyList.length === 0 ? (
                  <Text style={styles.emptyText}>Belum ada riwayat mutasi stok.</Text>
                ) : (
                  historyList.map((hist) => {
                    const isPositive = hist.change_amount > 0;
                    return (
                      <View key={hist.id} style={styles.historyRow}>
                        <View>
                          <Text style={styles.historyReason}>{hist.reason}</Text>
                          <Text style={styles.historyDate}>
                            {new Date(hist.created_at).toLocaleString('id-ID')}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.historyAmount,
                            isPositive
                              ? styles.historyPositive
                              : styles.historyNegative,
                          ]}
                        >
                          {isPositive
                            ? `+${hist.change_amount}`
                            : hist.change_amount}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        visible={scannerTarget !== null}
        onClose={() => setScannerTarget(null)}
        onScan={handleBarcodeScanned}
        title={
          scannerTarget === 'form'
            ? 'Scan Barcode Input Produk'
            : scannerTarget === 'opname'
            ? 'Scan Barcode Opname'
            : 'Scan Cari Produk'
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scanIconBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginLeft: 4,
  },
  scanInputBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanInputBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  headerActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 8,
    borderRadius: 10,
  },
  subActionBtnText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  categoryScrollWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  catPillText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  listContent: {
    padding: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cardMain: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockBadgeSafe: {
    backgroundColor: '#ECFDF5',
  },
  stockBadgeLow: {
    backgroundColor: '#FFFBEB',
  },
  stockBadgeOut: {
    backgroundColor: '#FEF2F2',
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockBadgeTextSafe: {
    color: '#059669',
  },
  stockBadgeTextLow: {
    color: '#D97706',
  },
  stockBadgeTextOut: {
    color: '#DC2626',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  barcodeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  label: {
    fontSize: 10,
    color: '#94A3B8',
  },
  sellingPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  costPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  soldValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  cardActionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  catSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catSelectPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  catSelectText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  catSelectTextActive: {
    color: '#FFFFFF',
  },
  inputGrid: {
    flexDirection: 'row',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  catAddBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  catAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  catItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  catItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  subNote: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  opnameDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    elevation: 3,
  },
  opnameDropItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  opnameDropText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  opnameDropStock: {
    fontSize: 12,
    color: '#64748B',
  },
  opnameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  opnameName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  opnameSub: {
    fontSize: 12,
    color: '#64748B',
  },
  opnameInput: {
    width: 70,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyReason: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  historyDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  historyPositive: {
    color: '#10B981',
  },
  historyNegative: {
    color: '#EF4444',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginVertical: 20,
  },
});
