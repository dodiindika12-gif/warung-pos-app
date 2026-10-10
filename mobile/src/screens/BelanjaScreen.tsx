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
  Platform,
} from 'react-native';
import {
  ListTodo,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  Settings,
  Server,
  Wifi,
  WifiOff,
  RotateCcw,
  Check,
} from 'lucide-react-native';
import {
  callAction,
  getBaseUrl,
  setBaseUrl,
  resetBaseUrl,
  checkConnection,
  getDefaultBaseUrl,
} from '../api';
import { ShoppingItem, Product } from '../types';

export default function BelanjaScreen() {
  const [activeTab, setActiveTab] = useState<'shopping' | 'settings'>('shopping');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Manual Add Modal
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [searchProduct, setSearchProduct] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inputQty, setInputQty] = useState<string>('5');
  const [addingLoading, setAddingLoading] = useState<boolean>(false);

  // Auto Generate Loading
  const [generating, setGenerating] = useState<boolean>(false);

  // Settings State
  const [serverUrlInput, setServerUrlInput] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  }>({ tested: false, success: false, message: '' });
  const [testingConnection, setTestingConnection] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [listData, prodsData, currentUrl] = await Promise.all([
        callAction('getShoppingList'),
        callAction('getProductsWithRecommendation'),
        getBaseUrl(),
      ]);
      setItems(listData || []);
      setAllProducts(prodsData || []);
      setServerUrlInput(currentUrl);
    } catch (e: any) {
      console.warn('Gagal memuat daftar belanja:', e.message);
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

  // Toggle Shopping List Item Check
  const handleToggleCheck = async (item: ShoppingItem) => {
    const nextState = item.is_checked === 1 ? 0 : 1;
    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_checked: nextState } : i))
    );
    try {
      await callAction('toggleShoppingListItem', [item.id, nextState === 1]);
    } catch (e: any) {
      console.warn('Gagal toggle checklist:', e.message);
      // Revert on error
      loadData();
    }
  };

  // Delete Individual Item
  const handleDeleteItem = async (id: number) => {
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      await callAction('deleteShoppingListItem', id);
    } catch (e: any) {
      Alert.alert('Gagal Hapus', e.message);
      loadData();
    }
  };

  // Auto Generate Recommendations
  const handleGenerateList = async () => {
    setGenerating(true);
    try {
      await callAction('generateShoppingList');
      Alert.alert('Sukses', 'Daftar belanja berhasil dibuat otomatis berdasarkan stok kritis & data penjualan.');
      await loadData();
    } catch (e: any) {
      Alert.alert('Gagal Generate', e.message);
    } finally {
      setGenerating(false);
    }
  };

  // Remove Checked Items
  const handleRemoveChecked = async () => {
    Alert.alert(
      'Hapus Barang Tercentang',
      'Yakin ingin menghapus semua barang belanjaan yang sudah dicentang?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await callAction('removeCheckedFromShoppingList');
              await loadData();
            } catch (e: any) {
              Alert.alert('Gagal', e.message);
            }
          },
        },
      ]
    );
  };

  // Clear Entire Shopping List
  const handleClearAll = async () => {
    Alert.alert(
      'Kosongkan Daftar Belanja',
      'Yakin ingin menghapus semua item dalam daftar belanja?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kosongkan',
          style: 'destructive',
          onPress: async () => {
            try {
              await callAction('clearShoppingList');
              await loadData();
            } catch (e: any) {
              Alert.alert('Gagal', e.message);
            }
          },
        },
      ]
    );
  };

  // Add Manual Item
  const handleAddManualItem = async () => {
    if (!selectedProduct) {
      Alert.alert('Pilih Produk', 'Silakan pilih produk yang ingin dibeli.');
      return;
    }
    const q = parseInt(inputQty, 10) || 1;
    setAddingLoading(true);
    try {
      await callAction('addToShoppingList', [selectedProduct.id, q]);
      Alert.alert('Sukses', `"${selectedProduct.name}" berhasil ditambahkan ke daftar belanja.`);
      setIsAddModalVisible(false);
      setSelectedProduct(null);
      setSearchProduct('');
      await loadData();
    } catch (e: any) {
      Alert.alert('Gagal Menambah', e.message);
    } finally {
      setAddingLoading(false);
    }
  };

  // Test Server Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await checkConnection(serverUrlInput.trim());
      setConnectionStatus({
        tested: true,
        success: res.success,
        message: res.message,
      });
    } catch (e: any) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: e.message || 'Koneksi gagal',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Save Server URL
  const handleSaveServerUrl = async () => {
    try {
      const updated = await setBaseUrl(serverUrlInput.trim());
      setServerUrlInput(updated);
      Alert.alert('Tersimpan', `Alamat API berhasil diatur ke:\n${updated}`);
      handleTestConnection();
    } catch (e: any) {
      Alert.alert('Gagal Menyimpan', e.message);
    }
  };

  // Reset Server URL
  const handleResetServerUrl = async () => {
    const def = await resetBaseUrl();
    setServerUrlInput(def);
    Alert.alert('Direset', `Alamat API dikembalikan ke default:\n${def}`);
    handleTestConnection();
  };

  // Cost calculation
  const totalEstimatedCost = useMemo(() => {
    return items.reduce((sum, item) => sum + item.cost_price * item.quantity, 0);
  }, [items]);

  const checkedCount = useMemo(() => {
    return items.filter((i) => i.is_checked === 1).length;
  }, [items]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>DAFTAR BELANJA & PENGATURAN</Text>
            <Text style={styles.headerSubtitle}>
              Rencana Kulakan & Konfigurasi API
            </Text>
          </View>
        </View>

        {/* Tab Switch */}
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              activeTab === 'shopping' && styles.tabSwitchBtnActive,
            ]}
            onPress={() => setActiveTab('shopping')}
          >
            <ListTodo
              size={16}
              color={activeTab === 'shopping' ? '#2563EB' : '#94A3B8'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabSwitchText,
                activeTab === 'shopping' && styles.tabSwitchTextActive,
              ]}
            >
              Daftar Belanja ({items.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              activeTab === 'settings' && styles.tabSwitchBtnActive,
            ]}
            onPress={() => setActiveTab('settings')}
          >
            <Settings
              size={16}
              color={activeTab === 'settings' ? '#2563EB' : '#94A3B8'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabSwitchText,
                activeTab === 'settings' && styles.tabSwitchTextActive,
              ]}
            >
              Pengaturan API
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat modul belanja...</Text>
        </View>
      ) : activeTab === 'shopping' ? (
        /* Shopping List Tab */
        <View style={{ flex: 1 }}>
          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.autoGenBtn, generating && { opacity: 0.7 }]}
              onPress={handleGenerateList}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.autoGenBtnText}>Generate Otomatis</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addManualBtn}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Plus size={16} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={styles.addManualBtnText}>+ Tambah</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats Bar */}
          {items.length > 0 && (
            <View style={styles.statsBar}>
              <Text style={styles.statsText}>
                {checkedCount} dari {items.length} Barang Dibeli
              </Text>
              <Text style={styles.statsCost}>
                Estimasi: Rp {totalEstimatedCost.toLocaleString('id-ID')}
              </Text>
            </View>
          )}

          {/* List */}
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 14, paddingBottom: 60 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => {
              const isChecked = item.is_checked === 1;
              return (
                <View
                  style={[
                    styles.itemCard,
                    isChecked && styles.itemCardChecked,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.checkTouch}
                    onPress={() => handleToggleCheck(item)}
                  >
                    {isChecked ? (
                      <CheckCircle2 size={24} color="#10B981" />
                    ) : (
                      <Circle size={24} color="#CBD5E1" />
                    )}
                  </TouchableOpacity>

                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text
                      style={[
                        styles.itemName,
                        isChecked && styles.itemNameChecked,
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.itemSub}>
                      Rencana Beli: {item.quantity} pcs • Stok Kini: {item.stock}
                    </Text>
                    <Text style={styles.itemCost}>
                      Estimasi Modal: Rp{' '}
                      {(item.cost_price * item.quantity).toLocaleString('id-ID')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.trashTouch}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ListTodo size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Daftar Belanja Kosong</Text>
                <Text style={styles.emptyDesc}>
                  Klik tombol "Generate Otomatis" untuk merekomendasikan barang yang stoknya menipis.
                </Text>
              </View>
            }
            ListFooterComponent={
              items.length > 0 ? (
                <View style={styles.footerActionRow}>
                  {checkedCount > 0 && (
                    <TouchableOpacity
                      style={styles.footerBtn}
                      onPress={handleRemoveChecked}
                    >
                      <Text style={styles.footerBtnText}>
                        Hapus {checkedCount} Barang Tercentang
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.footerBtn, { borderColor: '#FECACA' }]}
                    onPress={handleClearAll}
                  >
                    <Text style={[styles.footerBtnText, { color: '#EF4444' }]}>
                      Kosongkan Semua
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        </View>
      ) : (
        /* Settings Tab */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
        >
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Server size={20} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.cardSectionTitle}>Konfigurasi Server API</Text>
            </View>

            <Text style={styles.settingsDesc}>
              Aplikasi mobile berkomunikasi dengan backend Next.js melalui REST API.
              Anda dapat mengubah alamat IP server sesuai jaringan Wi-Fi lokal Anda.
            </Text>

            <Text style={styles.inputLabel}>URL API Backend:</Text>
            <TextInput
              style={styles.textInput}
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.1.xxx:3000/api/mobile"
            />

            {/* Quick Preset Buttons */}
            <Text style={[styles.inputLabel, { marginTop: 6 }]}>Pilihan Preset Cepat:</Text>
            <View style={styles.presetGrid}>
              <TouchableOpacity
                style={[styles.presetButton, { backgroundColor: '#EFF6FF', borderColor: '#2563EB' }]}
                onPress={() => setServerUrlInput('https://kasir.indika.web.id/api/mobile')}
              >
                <Text style={[styles.presetText, { color: '#2563EB', fontWeight: 'bold' }]}>
                  Vercel Cloud (kasir.indika.web.id)
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.presetGrid, { marginTop: 6 }]}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setServerUrlInput('http://192.168.1.3:3000/api/mobile')}
              >
                <Text style={styles.presetText}>HP Wi-Fi (192.168.1.3)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setServerUrlInput('http://localhost:3000/api/mobile')}
              >
                <Text style={styles.presetText}>Localhost (Web)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setServerUrlInput('http://10.0.2.2:3000/api/mobile')}
              >
                <Text style={styles.presetText}>Emulator (10.0.2.2)</Text>
              </TouchableOpacity>
            </View>

            {/* Test Connection Result Badge */}
            {connectionStatus.tested && (
              <View
                style={[
                  styles.statusBadge,
                  connectionStatus.success
                    ? styles.statusBadgeSuccess
                    : styles.statusBadgeError,
                ]}
              >
                {connectionStatus.success ? (
                  <Wifi size={18} color="#059669" style={{ marginRight: 6 }} />
                ) : (
                  <WifiOff size={18} color="#DC2626" style={{ marginRight: 6 }} />
                )}
                <Text
                  style={[
                    styles.statusBadgeText,
                    connectionStatus.success
                      ? styles.statusBadgeTextSuccess
                      : styles.statusBadgeTextError,
                  ]}
                >
                  {connectionStatus.message}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.settingsActionRow}>
              <TouchableOpacity
                style={[styles.testBtn, testingConnection && { opacity: 0.7 }]}
                onPress={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text style={styles.testBtnText}>Tes Koneksi (Ping)</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveSettingsBtn}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.saveSettingsBtnText}>Simpan Pengaturan</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetServerUrl}
            >
              <RotateCcw size={16} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.resetBtnText}>Kembalikan ke Default</Text>
            </TouchableOpacity>
          </View>

          {/* App Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Informasi Aplikasi</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Aplikasi</Text>
              <Text style={styles.infoVal}>Warung POS Mobile</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Versi Rilis</Text>
              <Text style={styles.infoVal}>1.1.0 Mobile Native</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={styles.infoVal}>{Platform.OS.toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Database Terhubung</Text>
              <Text style={styles.infoVal}>Turso Cloud (SQLite)</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* MODAL: Manual Add Product to Shopping List */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah ke Daftar Belanja</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <Text style={styles.inputLabel}>Cari Produk</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ketik nama produk..."
                value={searchProduct}
                onChangeText={setSearchProduct}
              />

              <ScrollView style={{ maxHeight: 180, marginBottom: 12 }}>
                {allProducts
                  .filter((p) =>
                    p.name.toLowerCase().includes(searchProduct.toLowerCase())
                  )
                  .map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.pickerItem,
                        selectedProduct?.id === p.id && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedProduct(p)}
                    >
                      <View>
                        <Text style={styles.pickerItemName}>{p.name}</Text>
                        <Text style={styles.pickerItemSub}>
                          Stok: {p.stock} • Modal: Rp {p.cost_price.toLocaleString('id-ID')}
                        </Text>
                      </View>
                      {selectedProduct?.id === p.id && (
                        <Check size={18} color="#2563EB" />
                      )}
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              {selectedProduct && (
                <View style={styles.chosenBox}>
                  <Text style={styles.chosenTitle}>
                    Produk Terpilih: {selectedProduct.name}
                  </Text>
                  <Text style={styles.inputLabel}>Jumlah yang Akan Dibeli (Qty)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={inputQty}
                    onChangeText={setInputQty}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!selectedProduct || addingLoading) && { opacity: 0.5 },
                ]}
                onPress={handleAddManualItem}
                disabled={!selectedProduct || addingLoading}
              >
                {addingLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Tambahkan ke Daftar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  autoGenBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoGenBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  addManualBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addManualBtnText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statsCost: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemCardChecked: {
    backgroundColor: '#F8FAFC',
    opacity: 0.7,
  },
  checkTouch: {
    padding: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
  },
  trashTouch: {
    padding: 6,
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
    paddingHorizontal: 24,
  },
  footerActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  footerBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  settingsDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
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
  presetGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusBadgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBadgeError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextSuccess: {
    color: '#047857',
  },
  statusBadgeTextError: {
    color: '#DC2626',
  },
  settingsActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  testBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testBtnText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  saveSettingsBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveSettingsBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  resetBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
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
    marginTop: 8,
  },
  chosenTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 8,
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
});
