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
import { Theme } from '../theme';

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
          <ActivityIndicator size="large" color={Theme.colors.tertiary} />
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
                <AlertTriangle size={48} color={Theme.colors.danger} />
                <Text style={[styles.emptyTitle, { color: Theme.colors.danger }]}>Gagal Terhubung ke Server</Text>
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
                <Package size={48} color={Theme.colors.textLight} />
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
            <ShoppingCart size={18} color={Theme.colors.neutral} style={{ marginRight: 6 }} />
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
                <ShoppingCart size={22} color={Theme.colors.textPrimary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Keranjang Belanja</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {cart.length > 0 && (
                  <TouchableOpacity onPress={clearCart}>
                    <RotateCcw size={20} color={Theme.colors.danger} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsCartModalVisible(false)}>
                  <X size={24} color={Theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <ShoppingCart size={54} color={Theme.colors.textLight} />
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
                        <Minus size={16} color={Theme.colors.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.cartQtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, 1)}
                      >
                        <Plus size={16} color={Theme.colors.textPrimary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={18} color={Theme.colors.danger} />
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
                <X size={24} color={Theme.colors.textMuted} />
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
                    color={paymentMethod === 'Tunai' ? Theme.colors.tertiary : Theme.colors.textMuted}
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
                    color={paymentMethod === 'QRIS' ? Theme.colors.tertiary : Theme.colors.textMuted}
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
    backgroundColor: Theme.colors.background,
  },
  scanBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginLeft: 6,
  },
  header: {
    backgroundColor: Theme.colors.primary, // #1A1A1A off-black
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: Theme.radius.lg,
    borderBottomRightRadius: Theme.radius.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    ...Theme.typography.display,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Theme.colors.textLight,
    marginTop: 2,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Theme.colors.danger,
    borderRadius: Theme.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  cartBadgeText: {
    color: Theme.colors.neutral,
    fontSize: 10,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.neutral,
    fontSize: 14,
  },
  categoryScrollWrapper: {
    backgroundColor: Theme.colors.neutral,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  catPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  catPillText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  catPillTextActive: {
    color: Theme.colors.neutral,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: Theme.colors.textMuted,
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
    backgroundColor: Theme.colors.neutral,
    borderRadius: Theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  productCardDisabled: {
    opacity: 0.55,
    backgroundColor: Theme.colors.backgroundAlt,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: Theme.colors.tintAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    borderColor: Theme.colors.borderAccent,
    maxWidth: '70%',
  },
  categoryBadgeText: {
    fontSize: 11,
    color: Theme.colors.tertiary,
    fontWeight: '600',
  },
  qtyBadge: {
    backgroundColor: Theme.colors.success,
    borderRadius: Theme.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyBadgeText: {
    fontSize: 11,
    color: Theme.colors.neutral,
    fontWeight: '700',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    height: 38,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderSubtle,
    paddingTop: 8,
  },
  priceLabel: {
    fontSize: 10,
    color: Theme.colors.textLight,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  stockContainer: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stockSafe: {
    color: Theme.colors.success,
  },
  stockLow: {
    color: Theme.colors.warning,
  },
  stockOut: {
    color: Theme.colors.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: Theme.colors.textLight,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Theme.shadows.floating,
  },
  floatingLeft: {
    flex: 1,
  },
  floatingItemCount: {
    color: Theme.colors.textLight,
    fontSize: 12,
    fontWeight: '500',
  },
  floatingTotal: {
    color: Theme.colors.neutral,
    fontSize: 17,
    fontWeight: '700',
  },
  floatingPayButton: {
    backgroundColor: Theme.colors.tertiary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Theme.shadows.accentLift,
  },
  floatingPayButtonText: {
    color: Theme.colors.neutral,
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Theme.colors.neutral,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
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
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  emptyCartBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginTop: 12,
  },
  emptyCartSub: {
    fontSize: 13,
    color: Theme.colors.textLight,
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
    borderBottomColor: Theme.colors.borderSubtle,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  cartItemPrice: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  cartItemSubtotal: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.tertiary,
    marginTop: 2,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartQtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginHorizontal: 10,
  },
  deleteBtn: {
    marginLeft: 12,
    padding: 4,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: Theme.colors.neutral,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  checkoutBtn: {
    backgroundColor: Theme.colors.tertiary,
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    ...Theme.shadows.accentLift,
  },
  checkoutBtnText: {
    color: Theme.colors.neutral,
    fontSize: 15,
    fontWeight: '600',
  },
  paymentSummaryCard: {
    backgroundColor: Theme.colors.tintAccent,
    borderRadius: Theme.radius.md,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.borderAccent,
  },
  paySummaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.tertiary,
    letterSpacing: 0.5,
  },
  paySummaryAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
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
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.background,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  methodBtnActive: {
    backgroundColor: Theme.colors.tintAccent,
    borderColor: Theme.colors.tertiary,
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  methodTextActive: {
    color: Theme.colors.tertiary,
    fontWeight: '700',
  },
  cashSection: {
    marginTop: 4,
  },
  cashInput: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  presetBtn: {
    backgroundColor: Theme.colors.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  changeBox: {
    marginTop: 16,
    borderRadius: Theme.radius.md,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeBoxPositive: {
    backgroundColor: Theme.colors.tintSuccess,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changeBoxNegative: {
    backgroundColor: Theme.colors.tintDanger,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  changeValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  changeValuePositive: {
    color: Theme.colors.success,
  },
  changeValueNegative: {
    color: Theme.colors.danger,
  },
  receiptSuccessIcon: {
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  receiptDate: {
    fontSize: 12,
    color: Theme.colors.textLight,
    marginTop: 2,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 10,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptItemName: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  receiptItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  receiptSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  receiptSumLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  receiptSumVal: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  receiptSumValBold: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  receiptChangeVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.success,
  },
  newTrxBtn: {
    marginTop: 20,
    width: '100%',
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTrxBtnText: {
    color: Theme.colors.neutral,
    fontWeight: '600',
    fontSize: 15,
  },
});
