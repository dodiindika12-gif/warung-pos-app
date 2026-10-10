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
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Receipt,
  RotateCcw,
  Package,
  AlertTriangle,
  Camera,
} from 'lucide-react-native';
import { callAction } from '../api';
import { Product, Category, CartItem } from '../types';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function KasirScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Barcode Scanner State
  const [isScannerVisible, setIsScannerVisible] = useState<boolean>(false);

  // Search & Filter
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartModalVisible, setIsCartModalVisible] = useState<boolean>(false);

  // Checkout State
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS'>('Tunai');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);

  // Success Receipt Modal
  const [successReceipt, setSuccessReceipt] = useState<{
    items: CartItem[];
    total: number;
    paymentMethod: string;
    received: number;
    change: number;
    date: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let prodsData: any[] = [];
      try {
        prodsData = await callAction('getProducts');
      } catch (innerErr) {
        prodsData = await callAction('getProductsWithRecommendation');
      }
      const catsData = await callAction('getCategories');
      setProducts(prodsData || []);
      setCategories(catsData || []);
    } catch (e: any) {
      console.warn('Gagal memuat produk kasir:', e.message);
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

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()));
      const matchCat =
        selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  // Cart Operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('Stok Habis', `Stok barang "${product.name}" sudah habis.`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          Alert.alert('Batas Stok', `Maksimal stok tersedia adalah ${product.stock}`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.stock) {
              Alert.alert('Batas Stok', `Maksimal stok hanya ${item.stock}`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    Alert.alert('Kosongkan Keranjang', 'Yakin ingin menghapus semua item dalam keranjang?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Kosongkan', style: 'destructive', onPress: () => setCart([]) },
    ]);
  };

  // Cart calculations
  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const totalCartAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.selling_price * item.quantity, 0);
  }, [cart]);

  // Quick Barcode Submit
  const handleBarcodeSubmit = () => {
    if (!search.trim()) return;
    const matched = products.find(
      (p) => p.barcode && p.barcode.toLowerCase() === search.trim().toLowerCase()
    );
    if (matched) {
      addToCart(matched);
      setSearch('');
    }
  };

  const handleBarcodeScanned = (scannedCode: string) => {
    setIsScannerVisible(false);
    const matched = products.find(
      (p) => p.barcode && p.barcode.toLowerCase() === scannedCode.toLowerCase()
    );
    if (matched) {
      if (matched.stock <= 0) {
        Alert.alert('Stok Habis', `Produk "${matched.name}" ditemukan, tetapi stok habis.`);
      } else {
        addToCart(matched);
        Alert.alert('Produk Ditemukan', `"${matched.name}" berhasil dimasukkan ke keranjang belanja.`);
      }
    } else {
      setSearch(scannedCode);
      Alert.alert('Barcode Terbaca', `Barcode "${scannedCode}" belum terdaftar.`);
    }
  };

  // Checkout Execution
  const handleProcessCheckout = async () => {
    if (cart.length === 0) return;
    const numericCash = paymentMethod === 'Tunai' ? parseFloat(cashReceived) || 0 : totalCartAmount;

    if (paymentMethod === 'Tunai' && numericCash < totalCartAmount) {
      Alert.alert('Uang Kurang', 'Jumlah uang tunai yang diterima kurang dari total belanja.');
      return;
    }

    setCheckoutLoading(true);
    try {
      await callAction('processCheckout', [cart, paymentMethod, totalCartAmount]);

      const change = paymentMethod === 'Tunai' ? numericCash - totalCartAmount : 0;
      setSuccessReceipt({
        items: [...cart],
        total: totalCartAmount,
        paymentMethod,
        received: numericCash,
        change,
        date: new Date().toLocaleString('id-ID'),
      });

      // Clear & close
      setCart([]);
      setIsCheckoutModalVisible(false);
      setIsCartModalVisible(false);
      setCashReceived('');
      setPaymentMethod('Tunai');
      await loadData(); // Refresh product stock
    } catch (e: any) {
      Alert.alert('Gagal Checkout', e.message || 'Terjadi kesalahan sistem saat memproses transaksi.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Quick cash preset values
  const quickCashPresets = useMemo(() => {
    const list = [totalCartAmount];
    const roundedUp10k = Math.ceil(totalCartAmount / 10000) * 10000;
    const roundedUp50k = Math.ceil(totalCartAmount / 50000) * 50000;
    const roundedUp100k = Math.ceil(totalCartAmount / 100000) * 100000;

    [roundedUp10k, roundedUp50k, roundedUp100k, 50000, 100000].forEach((val) => {
      if (val > totalCartAmount && !list.includes(val)) {
        list.push(val);
      }
    });
    return list.slice(0, 4);
  }, [totalCartAmount]);

  // Render Product Card
  const renderProductItem = ({ item }: { item: Product }) => {
    const cartItem = cart.find((c) => c.id === item.id);
    const isOutOfStock = item.stock <= 0;
    const isLowStock = item.stock > 0 && item.stock <= 5;

    return (
      <TouchableOpacity
        style={[styles.productCard, isOutOfStock && styles.productCardDisabled]}
        onPress={() => addToCart(item)}
        activeOpacity={0.7}
        disabled={isOutOfStock}
      >
        <View style={styles.productHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {item.category || 'Umum'}
            </Text>
          </View>
          {cartItem && (
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>{cartItem.quantity}x</Text>
            </View>
          )}
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.productFooter}>
          <View>
            <Text style={styles.priceLabel}>Harga</Text>
            <Text style={styles.productPrice}>
              Rp {item.selling_price.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.stockContainer}>
            <Text
              style={[
                styles.stockText,
                isOutOfStock
                  ? styles.stockOut
                  : isLowStock
                  ? styles.stockLow
                  : styles.stockSafe,
              ]}
            >
              {isOutOfStock ? 'Habis' : `Stok: ${item.stock}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>KASIR POS</Text>
            <Text style={styles.headerSubtitle}>Warung & Toko Pintar</Text>
          </View>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setIsCartModalVisible(true)}
          >
            <ShoppingCart size={22} color="#FFFFFF" />
            {totalCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search & Barcode input */}
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama barang atau scan barcode..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleBarcodeSubmit}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 8 }}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => setIsScannerVisible(true)}
          >
            <Camera size={18} color="#38BDF8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Filter Pills */}
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
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catPill,
                selectedCategory === cat.name && styles.catPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Text
                style={[
                  styles.catPillText,
                  selectedCategory === cat.name && styles.catPillTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat katalog barang...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            cart.length > 0 && { paddingBottom: 90 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            errorMessage ? (
              <View style={styles.emptyContainer}>
                <AlertTriangle size={48} color="#EF4444" />
                <Text style={[styles.emptyTitle, { color: '#EF4444' }]}>Gagal Terhubung ke Server</Text>
                <Text style={styles.emptyDesc}>{errorMessage}</Text>
                <TouchableOpacity
                  style={[styles.floatingPayButton, { marginTop: 14, paddingHorizontal: 20 }]}
                  onPress={loadData}
                >
                  <Text style={styles.floatingPayButtonText}>Muat Ulang Katalog</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Package size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Produk Tidak Ditemukan</Text>
                <Text style={styles.emptyDesc}>
                  {search ? 'Tidak ada produk yang cocok dengan pencarian.' : 'Katalog kosong atau periksa filter kategori.'}
                </Text>
              </View>
            )
          }
        />
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <View style={styles.floatingBar}>
          <View style={styles.floatingLeft}>
            <Text style={styles.floatingItemCount}>{totalCartCount} Barang</Text>
            <Text style={styles.floatingTotal}>
              Rp {totalCartAmount.toLocaleString('id-ID')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.floatingPayButton}
            onPress={() => setIsCartModalVisible(true)}
          >
            <ShoppingCart size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.floatingPayButtonText}>Lihat Keranjang</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL 1: Cart Modal */}
      <Modal
        visible={isCartModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCartModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShoppingCart size={22} color="#1E293B" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Keranjang Belanja</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {cart.length > 0 && (
                  <TouchableOpacity onPress={clearCart}>
                    <RotateCcw size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsCartModalVisible(false)}>
                  <X size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <ShoppingCart size={54} color="#CBD5E1" />
                <Text style={styles.emptyCartText}>Keranjang masih kosong</Text>
                <Text style={styles.emptyCartSub}>
                  Pilih produk dari katalog untuk memulai transaksi
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.cartList}>
                {cart.map((item) => (
                  <View key={item.id} style={styles.cartItem}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        Rp {item.selling_price.toLocaleString('id-ID')} / pcs
                      </Text>
                      <Text style={styles.cartItemSubtotal}>
                        Total: Rp{' '}
                        {(item.selling_price * item.quantity).toLocaleString(
                          'id-ID'
                        )}
                      </Text>
                    </View>

                    <View style={styles.cartItemActions}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, -1)}
                      >
                        <Minus size={16} color="#1E293B" />
                      </TouchableOpacity>
                      <Text style={styles.cartQtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, 1)}
                      >
                        <Plus size={16} color="#1E293B" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {cart.length > 0 && (
              <View style={styles.modalFooter}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Tagihan:</Text>
                  <Text style={styles.totalValue}>
                    Rp {totalCartAmount.toLocaleString('id-ID')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={() => {
                    setCashReceived(totalCartAmount.toString());
                    setIsCheckoutModalVisible(true);
                  }}
                >
                  <Text style={styles.checkoutBtnText}>Lanjut Pembayaran</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Checkout & Payment Modal */}
      <Modal
        visible={isCheckoutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCheckoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pembayaran</Text>
              <TouchableOpacity onPress={() => setIsCheckoutModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {/* Grand Total Card */}
              <View style={styles.paymentSummaryCard}>
                <Text style={styles.paySummaryLabel}>TOTAL YANG HARUS DIBAYAR</Text>
                <Text style={styles.paySummaryAmount}>
                  Rp {totalCartAmount.toLocaleString('id-ID')}
                </Text>
              </View>

              {/* Payment Method Switch */}
              <Text style={styles.sectionTitle}>Pilih Metode Pembayaran</Text>
              <View style={styles.methodRow}>
                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    paymentMethod === 'Tunai' && styles.methodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod('Tunai')}
                >
                  <Banknote
                    size={22}
                    color={paymentMethod === 'Tunai' ? '#2563EB' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.methodText,
                      paymentMethod === 'Tunai' && styles.methodTextActive,
                    ]}
                  >
                    Tunai (Cash)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    paymentMethod === 'QRIS' && styles.methodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod('QRIS')}
                >
                  <CreditCard
                    size={22}
                    color={paymentMethod === 'QRIS' ? '#2563EB' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.methodText,
                      paymentMethod === 'QRIS' && styles.methodTextActive,
                    ]}
                  >
                    QRIS / Transfer
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Cash Input if Tunai */}
              {paymentMethod === 'Tunai' && (
                <View style={styles.cashSection}>
                  <Text style={styles.sectionTitle}>Uang Tunai Diterima</Text>
                  <TextInput
                    style={styles.cashInput}
                    keyboardType="numeric"
                    placeholder="Masukkan nominal uang..."
                    value={cashReceived}
                    onChangeText={setCashReceived}
                  />

                  {/* Quick Preset Buttons */}
                  <View style={styles.presetRow}>
                    {quickCashPresets.map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={styles.presetBtn}
                        onPress={() => setCashReceived(val.toString())}
                      >
                        <Text style={styles.presetBtnText}>
                          {val === totalCartAmount
                            ? 'Uang Pas'
                            : `Rp ${(val / 1000).toLocaleString('id-ID')}k`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Change calculation */}
                  {Boolean(cashReceived) && (
                    <View
                      style={[
                        styles.changeBox,
                        parseFloat(cashReceived) >= totalCartAmount
                          ? styles.changeBoxPositive
                          : styles.changeBoxNegative,
                      ]}
                    >
                      <Text style={styles.changeLabel}>
                        {parseFloat(cashReceived) >= totalCartAmount
                          ? 'Kembalian:'
                          : 'Uang Kurang:'}
                      </Text>
                      <Text
                        style={[
                          styles.changeValue,
                          parseFloat(cashReceived) >= totalCartAmount
                            ? styles.changeValuePositive
                            : styles.changeValueNegative,
                        ]}
                      >
                        Rp{' '}
                        {Math.abs(
                          (parseFloat(cashReceived) || 0) - totalCartAmount
                        ).toLocaleString('id-ID')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.checkoutBtn, checkoutLoading && { opacity: 0.7 }]}
                onPress={handleProcessCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.checkoutBtnText}>
                    Selesaikan Transaksi (Rp {totalCartAmount.toLocaleString('id-ID')})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Success Digital Receipt */}
      <Modal
        visible={successReceipt !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSuccessReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
              <View style={styles.receiptSuccessIcon}>
                <CheckCircle2 size={54} color="#10B981" />
              </View>
              <Text style={styles.receiptTitle}>Transaksi Berhasil!</Text>
              <Text style={styles.receiptDate}>{successReceipt?.date}</Text>

              {/* Receipt Body */}
              <View style={styles.receiptBox}>
                <View style={styles.receiptDivider} />
                {successReceipt?.items.map((item, idx) => (
                  <View key={idx} style={styles.receiptItemRow}>
                    <Text style={styles.receiptItemName} numberOfLines={1}>
                      {item.name} x{item.quantity}
                    </Text>
                    <Text style={styles.receiptItemPrice}>
                      Rp {(item.selling_price * item.quantity).toLocaleString('id-ID')}
                    </Text>
                  </View>
                ))}
                <View style={styles.receiptDivider} />

                <View style={styles.receiptSummaryRow}>
                  <Text style={styles.receiptSumLabel}>Metode Bayar</Text>
                  <Text style={styles.receiptSumVal}>{successReceipt?.paymentMethod}</Text>
                </View>
                <View style={styles.receiptSummaryRow}>
                  <Text style={styles.receiptSumLabel}>Total Belanja</Text>
                  <Text style={styles.receiptSumValBold}>
                    Rp {successReceipt?.total.toLocaleString('id-ID')}
                  </Text>
                </View>
                {successReceipt?.paymentMethod === 'Tunai' && (
                  <>
                    <View style={styles.receiptSummaryRow}>
                      <Text style={styles.receiptSumLabel}>Uang Diterima</Text>
                      <Text style={styles.receiptSumVal}>
                        Rp {successReceipt?.received.toLocaleString('id-ID')}
                      </Text>
                    </View>
                    <View style={styles.receiptSummaryRow}>
                      <Text style={styles.receiptSumLabel}>Kembalian</Text>
                      <Text style={styles.receiptChangeVal}>
                        Rp {successReceipt?.change.toLocaleString('id-ID')}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={styles.newTrxBtn}
                onPress={() => setSuccessReceipt(null)}
              >
                <Receipt size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.newTrxBtnText}>Mulai Transaksi Baru</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScan={handleBarcodeScanned}
        title="Scan Barcode Kasir"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scanBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginLeft: 4,
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
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productCardDisabled: {
    opacity: 0.55,
    backgroundColor: '#F8FAFC',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '70%',
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  qtyBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    height: 38,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  priceLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  stockContainer: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stockSafe: {
    color: '#10B981',
  },
  stockLow: {
    color: '#F59E0B',
  },
  stockOut: {
    color: '#EF4444',
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
    paddingHorizontal: 32,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingLeft: {
    flex: 1,
  },
  floatingItemCount: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  floatingTotal: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  floatingPayButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingPayButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
    minHeight: '40%',
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
  emptyCartBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptyCartSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  cartList: {
    paddingHorizontal: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cartItemSubtotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartQtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginHorizontal: 10,
  },
  deleteBtn: {
    marginLeft: 12,
    padding: 4,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  checkoutBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  paymentSummaryCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  paySummaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  paySummaryAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E40AF',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  methodBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  methodTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  cashSection: {
    marginTop: 4,
  },
  cashInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  presetBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  changeBox: {
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeBoxPositive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changeBoxNegative: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  changeValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  changeValuePositive: {
    color: '#059669',
  },
  changeValueNegative: {
    color: '#DC2626',
  },
  receiptSuccessIcon: {
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  receiptDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptItemName: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  receiptItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  receiptSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  receiptSumLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  receiptSumVal: {
    fontSize: 12,
    color: '#334155',
  },
  receiptSumValBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  receiptChangeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  newTrxBtn: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTrxBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
