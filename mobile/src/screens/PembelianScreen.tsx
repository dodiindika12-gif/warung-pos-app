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
  Truck,
  Plus,
  Trash2,
  FileText,
  Search,
  X,
  Package,
  Calendar,
  Layers,
  CheckCircle2,
  ChevronRight,
  Camera,
} from 'lucide-react-native';
import { callAction } from '../api';
import { Product, PurchaseRecord, PurchaseItem } from '../types';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function PembelianScreen() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isScannerVisible, setIsScannerVisible] = useState<boolean>(false);

  // Form Invoice State
  const [invoiceTitle, setInvoiceTitle] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [discount, setDiscount] = useState<string>('');
  const [invoiceCart, setInvoiceCart] = useState<PurchaseItem[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Product Picker Modal for Invoice
  const [isPickerVisible, setIsPickerVisible] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inputQty, setInputQty] = useState<string>('1');
  const [inputCost, setInputCost] = useState<string>('');
  const [inputSell, setInputSell] = useState<string>('');

  // History Detail Modal
  const [selectedHistoryGroup, setSelectedHistoryGroup] = useState<{
    invoice_title: string;
    supplier: string;
    created_at: string;
    total_cost: number;
    items: PurchaseRecord[];
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [prodsData, purchsData] = await Promise.all([
        callAction('getProducts'),
        callAction('getRecentPurchases'),
      ]);
      setProducts(prodsData || []);
      setPurchases(purchsData || []);
    } catch (e: any) {
      console.warn('Gagal memuat data pembelian:', e.message);
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

  // Barcode Scan Handler
  const handleBarcodeScanned = (scannedCode: string) => {
    setIsScannerVisible(false);
    const found = products.find(
      (p) => p.barcode && p.barcode.toLowerCase() === scannedCode.toLowerCase()
    );
    if (found) {
      handleSelectProduct(found);
      Alert.alert('Produk Terpilih', `"${found.name}" siap diisi jumlah dan modal kulakannya.`);
    } else {
      setPickerSearch(scannedCode);
      Alert.alert('Barcode Terbaca', `Produk dengan barcode "${scannedCode}" belum ada di database.`);
    }
  };

  // Select Product in Picker
  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setInputQty('10');
    setInputCost(prod.cost_price.toString());
    setInputSell(prod.selling_price.toString());
  };

  // Add Item to Invoice Cart
  const handleAddItemToInvoice = () => {
    if (!selectedProduct) {
      Alert.alert('Pilih Produk', 'Silakan pilih produk terlebih dahulu.');
      return;
    }
    const q = parseInt(inputQty, 10) || 0;
    const c = parseFloat(inputCost) || 0;
    const s = parseFloat(inputSell) || 0;

    if (q <= 0) {
      Alert.alert('Jumlah Tidak Valid', 'Jumlah pembelian harus lebih dari 0.');
      return;
    }
    if (s <= 0) {
      Alert.alert('Harga Jual Tidak Valid', 'Harga jual harus lebih dari 0.');
      return;
    }

    setInvoiceCart((prev) => {
      const existing = prev.find((i) => i.productId === selectedProduct.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === selectedProduct.id
            ? { ...i, quantity: i.quantity + q, costPrice: c, sellingPrice: s }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          barcode: selectedProduct.barcode,
          quantity: q,
          costPrice: c,
          sellingPrice: s,
          oldStock: selectedProduct.stock,
        },
      ];
    });

    // Reset picker
    setSelectedProduct(null);
    setIsPickerVisible(false);
    setPickerSearch('');
  };

  const removeItemFromInvoice = (productId: number) => {
    setInvoiceCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Calculations
  const grossInvoiceTotal = useMemo(() => {
    return invoiceCart.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
  }, [invoiceCart]);

  const numericDiscount = parseFloat(discount) || 0;
  const netInvoiceTotal = Math.max(0, grossInvoiceTotal - numericDiscount);

  // Submit Invoice
  const handleSubmitInvoice = async () => {
    if (invoiceCart.length === 0) {
      Alert.alert('Faktur Kosong', 'Tambahkan minimal satu barang ke dalam faktur kulakan.');
      return;
    }

    const title = invoiceTitle.trim() || `Kulakan - ${new Date().toLocaleDateString('id-ID')}`;
    const sup = supplier.trim() || 'Grosir / Supplier';

    setSubmitting(true);
    try {
      const itemsPayload = invoiceCart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        costPrice: i.costPrice,
        sellingPrice: i.sellingPrice,
      }));

      await callAction('processBulkPurchase', [
        title,
        sup,
        itemsPayload,
        numericDiscount,
      ]);

      Alert.alert('Sukses', 'Faktur kulakan berhasil disimpan dan stok produk telah diperbarui!');
      setInvoiceCart([]);
      setInvoiceTitle('');
      setSupplier('');
      setDiscount('');
      setActiveTab('history');
      await loadData();
    } catch (e: any) {
      Alert.alert('Gagal Menyimpan Faktur', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Grouped History Purchases
  const groupedPurchases = useMemo(() => {
    const map = new Map<string, {
      invoice_title: string;
      supplier: string;
      created_at: string;
      total_cost: number;
      items: PurchaseRecord[];
    }>();

    purchases.forEach((p) => {
      const dateKey = p.created_at ? p.created_at.slice(0, 16) : 'N/A';
      const key = `${p.invoice_title || 'Kulakan'}-${p.supplier || 'Grosir'}-${dateKey}`;

      if (!map.has(key)) {
        map.set(key, {
          invoice_title: p.invoice_title || 'Kulakan',
          supplier: p.supplier || 'Supplier',
          created_at: p.created_at,
          total_cost: 0,
          items: [],
        });
      }

      const group = map.get(key)!;
      group.items.push(p);
      group.total_cost += p.total_cost || p.cost_price * p.quantity;
    });

    return Array.from(map.values());
  }, [purchases]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>KULAKAN & RESTOCK</Text>
            <Text style={styles.headerSubtitle}>Manajemen Pembelian Grosir</Text>
          </View>
        </View>

        {/* Tab Switch */}
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              activeTab === 'create' && styles.tabSwitchBtnActive,
            ]}
            onPress={() => setActiveTab('create')}
          >
            <Plus size={16} color={activeTab === 'create' ? '#2563EB' : '#94A3B8'} style={{ marginRight: 6 }} />
            <Text
              style={[
                styles.tabSwitchText,
                activeTab === 'create' && styles.tabSwitchTextActive,
              ]}
            >
              Buat Faktur Kulakan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              activeTab === 'history' && styles.tabSwitchBtnActive,
            ]}
            onPress={() => setActiveTab('history')}
          >
            <FileText size={16} color={activeTab === 'history' ? '#2563EB' : '#94A3B8'} style={{ marginRight: 6 }} />
            <Text
              style={[
                styles.tabSwitchText,
                activeTab === 'history' && styles.tabSwitchTextActive,
              ]}
            >
              Riwayat Faktur
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat modul kulakan...</Text>
        </View>
      ) : activeTab === 'create' ? (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Invoice Header Form */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Informasi Faktur & Supplier</Text>
            <Text style={styles.inputLabel}>No / Nama Faktur</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Faktur Toko Berkah #102"
              value={invoiceTitle}
              onChangeText={setInvoiceTitle}
            />

            <Text style={styles.inputLabel}>Nama Agen / Grosir / Supplier</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: CV. Maju Bersama / Grosir Pasar"
              value={supplier}
              onChangeText={setSupplier}
            />
          </View>

          {/* Items in Invoice */}
          <View style={styles.card}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.cardSectionTitle}>
                Daftar Barang Belanja ({invoiceCart.length})
              </Text>
              <TouchableOpacity
                style={styles.addGoodsBtn}
                onPress={() => setIsPickerVisible(true)}
              >
                <Plus size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.addGoodsBtnText}>+ Tambah Barang</Text>
              </TouchableOpacity>
            </View>

            {invoiceCart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Truck size={42} color="#CBD5E1" />
                <Text style={styles.emptyCartText}>Belum ada barang kulakan</Text>
                <Text style={styles.emptyCartSub}>
                  Klik tombol "+ Tambah Barang" di atas untuk memasukkan produk.
                </Text>
              </View>
            ) : (
              invoiceCart.map((item) => (
                <View key={item.productId} style={styles.cartItemRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.cartItemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.cartItemSub}>
                      {item.quantity} pcs @ Rp {item.costPrice.toLocaleString('id-ID')}
                    </Text>
                    <Text style={styles.cartItemSell}>
                      Jual Baru: Rp {item.sellingPrice.toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={styles.cartItemTotal}>
                      Rp {(item.quantity * item.costPrice).toLocaleString('id-ID')}
                    </Text>
                    <TouchableOpacity
                      style={{ marginTop: 6 }}
                      onPress={() => removeItemFromInvoice(item.productId)}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Invoice Summary Card */}
          {invoiceCart.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>Ringkasan Biaya</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Belanja Kotor</Text>
                <Text style={styles.summaryValue}>
                  Rp {grossInvoiceTotal.toLocaleString('id-ID')}
                </Text>
              </View>

              <Text style={styles.inputLabel}>Potongan Harga / Diskon Grosir (Rp)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="0"
                value={discount}
                onChangeText={setDiscount}
              />

              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Total Bersih Pembelian</Text>
                <Text style={styles.summaryTotalValue}>
                  Rp {netInvoiceTotal.toLocaleString('id-ID')}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitInvoiceBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmitInvoice}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitInvoiceBtnText}>
                    Simpan Faktur & Perbarui Stok
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        /* History Tab */
        <FlatList
          data={groupedPurchases}
          keyExtractor={(_, idx) => idx.toString()}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.historyCard}
              onPress={() => setSelectedHistoryGroup(item)}
            >
              <View style={styles.historyCardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {item.invoice_title}
                  </Text>
                  <Text style={styles.historySupplier}>{item.supplier}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.created_at).toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.historyTotalCost}>
                    Rp {item.total_cost.toLocaleString('id-ID')}
                  </Text>
                  <Text style={styles.historyItemCount}>
                    {item.items.length} Macam Barang
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Belum Ada Riwayat Kulakan</Text>
              <Text style={styles.emptyDesc}>
                Faktur belanja grosir yang tersimpan akan muncul di sini.
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL 1: Product Picker for Invoice */}
      <Modal
        visible={isPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Barang Kulakan</Text>
              <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {/* Product search box */}
              <View style={styles.searchBox}>
                <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari produk atau scan barcode..."
                  placeholderTextColor="#94A3B8"
                  value={pickerSearch}
                  onChangeText={setPickerSearch}
                />
                <TouchableOpacity
                  style={{ padding: 4 }}
                  onPress={() => setIsScannerVisible(true)}
                >
                  <Camera size={20} color="#2563EB" />
                </TouchableOpacity>
              </View>

              {/* Product Dropdown/Selection List */}
              <ScrollView style={{ maxHeight: 180, marginBottom: 16 }}>
                {products
                  .filter((p) =>
                    p.name.toLowerCase().includes(pickerSearch.toLowerCase())
                  )
                  .map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.pickerItem,
                        selectedProduct?.id === p.id && styles.pickerItemActive,
                      ]}
                      onPress={() => handleSelectProduct(p)}
                    >
                      <View>
                        <Text style={styles.pickerItemName}>{p.name}</Text>
                        <Text style={styles.pickerItemSub}>
                          Stok Sekarang: {p.stock} | Modal Lama: Rp{' '}
                          {p.cost_price.toLocaleString('id-ID')}
                        </Text>
                      </View>
                      {selectedProduct?.id === p.id && (
                        <CheckCircle2 size={18} color="#2563EB" />
                      )}
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              {/* Input details for chosen item */}
              {selectedProduct && (
                <View style={styles.chosenBox}>
                  <Text style={styles.chosenTitle}>
                    Detail Kulakan: {selectedProduct.name}
                  </Text>

                  <Text style={styles.inputLabel}>Jumlah Pembelian (Qty) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="10"
                    value={inputQty}
                    onChangeText={setInputQty}
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Harga Beli / Modal Baru *</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={inputCost}
                        onChangeText={setInputCost}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Harga Jual Baru *</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={inputSell}
                        onChangeText={setInputSell}
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.submitInvoiceBtn,
                  !selectedProduct && { opacity: 0.5 },
                ]}
                onPress={handleAddItemToInvoice}
                disabled={!selectedProduct}
              >
                <Text style={styles.submitInvoiceBtnText}>Masukkan ke Faktur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: History Detail Modal */}
      <Modal
        visible={selectedHistoryGroup !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedHistoryGroup(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedHistoryGroup?.invoice_title}
                </Text>
                <Text style={styles.modalSubTitle}>
                  Supplier: {selectedHistoryGroup?.supplier}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedHistoryGroup(null)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <View style={styles.historyDetailHeader}>
                <Text style={styles.historyDetailDate}>
                  Tanggal:{' '}
                  {selectedHistoryGroup?.created_at
                    ? new Date(selectedHistoryGroup.created_at).toLocaleString('id-ID')
                    : ''}
                </Text>
                <Text style={styles.historyDetailTotal}>
                  Total: Rp {selectedHistoryGroup?.total_cost.toLocaleString('id-ID')}
                </Text>
              </View>

              <Text style={[styles.cardSectionTitle, { marginTop: 12 }]}>
                Rincian Barang yang Dibeli:
              </Text>
              {selectedHistoryGroup?.items.map((item, idx) => (
                <View key={idx} style={styles.historyDetailItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDetailName}>{item.product_name}</Text>
                    <Text style={styles.historyDetailSub}>
                      {item.quantity} pcs @ Rp {item.cost_price?.toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <Text style={styles.historyDetailSubtotal}>
                    Rp {(item.total_cost || item.cost_price * item.quantity).toLocaleString('id-ID')}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScan={handleBarcodeScanned}
        title="Scan Barcode Kulakan"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 4,
  },
  tabSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabSwitchBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabSwitchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabSwitchTextActive: {
    color: '#2563EB',
    fontWeight: '700',
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
  contentScroll: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
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
    marginBottom: 12,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addGoodsBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addGoodsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptyCartSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 16,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  cartItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cartItemSell: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 1,
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  submitInvoiceBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitInvoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  historySupplier: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  historyTotalCost: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyItemCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
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
    maxHeight: '85%',
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderRadius: 8,
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
  },
  pickerItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  pickerItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  chosenBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chosenTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 10,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  historyDetailHeader: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyDetailDate: {
    fontSize: 12,
    color: '#1E40AF',
  },
  historyDetailTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 4,
  },
  historyDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyDetailName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  historyDetailSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  historyDetailSubtotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
});
