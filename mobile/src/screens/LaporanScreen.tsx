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
  Receipt,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  X,
  CreditCard,
  Banknote,
  Plus,
  Calendar,
  Package,
  Award,
} from 'lucide-react-native';
import { callAction } from '../api';
import { Transaction, TransactionItem, DashboardStats } from '../types';

export default function LaporanScreen() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'analytics'>('transactions');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const [trxItems, setTrxItems] = useState<TransactionItem[]>([]);
  const [loadingTrxItems, setLoadingTrxItems] = useState<boolean>(false);
  const [refunding, setRefunding] = useState<boolean>(false);

  // Analytics State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [periodDays, setPeriodDays] = useState<number>(0); // 0 = Hari Ini, 7 = 7 Hari, 30 = 30 Hari

  // Add Expense Modal
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState<boolean>(false);
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseLoading, setExpenseLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const today = new Date();
      let startStr = today.toISOString().split('T')[0];
      const endStr = startStr;

      if (periodDays > 0) {
        const start = new Date();
        start.setDate(today.getDate() - periodDays);
        startStr = start.toISOString().split('T')[0];
      }

      const [trxData, statsData] = await Promise.all([
        callAction('getTransactionHistory', filterDate),
        callAction('getDashboardStats', [startStr, endStr]),
      ]);

      setTransactions(trxData || []);
      setStats(statsData || null);
    } catch (e: any) {
      console.warn('Gagal memuat riwayat & laporan:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterDate, periodDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Open Transaction Details
  const handleOpenTransaction = async (trx: Transaction) => {
    setSelectedTrx(trx);
    setLoadingTrxItems(true);
    try {
      const items = await callAction('getTransactionDetails', trx.id);
      setTrxItems(items || []);
    } catch (e: any) {
      console.warn('Gagal detail transaksi:', e.message);
    } finally {
      setLoadingTrxItems(false);
    }
  };

  // Refund / Cancel Transaction
  const handleRefund = async () => {
    if (!selectedTrx) return;
    Alert.alert(
      'Batalkan & Retur Transaksi',
      `Yakin ingin membatalkan Transaksi #${selectedTrx.id}? Semua stok barang akan otomatis dikembalikan ke etalase.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Batalkan & Retur',
          style: 'destructive',
          onPress: async () => {
            setRefunding(true);
            try {
              await callAction('refundTransaction', selectedTrx.id);
              Alert.alert('Sukses', 'Transaksi berhasil dibatalkan dan stok telah dikembalikan.');
              setSelectedTrx(null);
              await loadData();
            } catch (e: any) {
              Alert.alert('Gagal Retur', e.message);
            } finally {
              setRefunding(false);
            }
          },
        },
      ]
    );
  };

  // Add Operational Expense
  const handleSaveExpense = async () => {
    if (!expenseDesc.trim()) {
      Alert.alert('Keterangan Kosong', 'Masukkan keterangan pengeluaran.');
      return;
    }
    const amt = parseFloat(expenseAmount) || 0;
    if (amt <= 0) {
      Alert.alert('Nominal Tidak Valid', 'Nominal pengeluaran harus lebih dari 0.');
      return;
    }

    setExpenseLoading(true);
    try {
      await callAction('addExpense', [expenseDesc.trim(), amt]);
      Alert.alert('Sukses', 'Pengeluaran operasional berhasil dicatat.');
      setExpenseDesc('');
      setExpenseAmount('');
      setIsExpenseModalVisible(false);
      await loadData();
    } catch (e: any) {
      Alert.alert('Gagal Menyimpan', e.message);
    } finally {
      setExpenseLoading(false);
    }
  };

  // Calculate gross & net profit
  const grossProfit = stats ? stats.revenue - stats.cogs : 0;
  const netProfit = stats ? grossProfit - stats.expense : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>RIWAYAT & LAPORAN</Text>
            <Text style={styles.headerSubtitle}>Pantau Penjualan & Keuntungan</Text>
          </View>
        </View>

        {/* Tab Switch */}
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              activeTab === 'transactions' && styles.tabSwitchBtnActive,
            ]}
            onPress={() => setActiveTab('transactions')}
          >
            <Receipt
              size={16}
              color={activeTab === 'transactions' ? '#2563EB' : '#94A3B8'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabSwitchText,
                activeTab === 'transactions' && styles.tabSwitchTextActive,
              ]}
            >
              Riwayat Transaksi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              activeTab === 'analytics' && styles.tabSwitchBtnActive,
            ]}
            onPress={() => setActiveTab('analytics')}
          >
            <TrendingUp
              size={16}
              color={activeTab === 'analytics' ? '#2563EB' : '#94A3B8'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabSwitchText,
                activeTab === 'analytics' && styles.tabSwitchTextActive,
              ]}
            >
              Laporan Keuangan
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat data laporan...</Text>
        </View>
      ) : activeTab === 'transactions' ? (
        /* Transactions Tab */
        <View style={{ flex: 1 }}>
          {/* Date Filter Bar */}
          <View style={styles.filterBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calendar size={16} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.filterLabel}>Tanggal:</Text>
            </View>
            <TextInput
              style={styles.dateInput}
              value={filterDate}
              onChangeText={setFilterDate}
              placeholder="YYYY-MM-DD"
            />
            <TouchableOpacity
              style={styles.todayBtn}
              onPress={() =>
                setFilterDate(new Date().toISOString().split('T')[0])
              }
            >
              <Text style={styles.todayBtnText}>Hari Ini</Text>
            </TouchableOpacity>
          </View>

          {/* Transactions List */}
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 14 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.trxCard}
                onPress={() => handleOpenTransaction(item)}
              >
                <View style={styles.trxCardLeft}>
                  <Text style={styles.trxId}>Transaksi #{item.id}</Text>
                  <Text style={styles.trxTime}>
                    {new Date(item.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • {item.payment_method}
                  </Text>
                  {typeof item.profit === 'number' && (
                    <Text style={styles.trxProfit}>
                      Estimasi Untung: Rp {item.profit.toLocaleString('id-ID')}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Text style={styles.trxAmount}>
                    Rp {item.total_amount.toLocaleString('id-ID')}
                  </Text>
                  <Text style={styles.trxDetailLink}>Lihat Rincian &gt;</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Receipt size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
                <Text style={styles.emptyDesc}>
                  Tidak ada transaksi kasir pada tanggal {filterDate}.
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        /* Analytics Tab */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Quick Filter Periods */}
          <View style={styles.periodRow}>
            {[
              { label: 'Hari Ini', days: 0 },
              { label: '7 Hari', days: 7 },
              { label: '30 Hari', days: 30 },
            ].map((p) => (
              <TouchableOpacity
                key={p.days}
                style={[
                  styles.periodBtn,
                  periodDays === p.days && styles.periodBtnActive,
                ]}
                onPress={() => setPeriodDays(p.days)}
              >
                <Text
                  style={[
                    styles.periodText,
                    periodDays === p.days && styles.periodTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* KPI Summary Cards */}
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Text style={[styles.kpiLabel, { color: '#1E40AF' }]}>TOTAL OMZET</Text>
              <Text style={[styles.kpiValue, { color: '#1E3A8A' }]}>
                Rp {(stats?.revenue || 0).toLocaleString('id-ID')}
              </Text>
              <Text style={styles.kpiSub}>{stats?.totalTrx || 0} Transaksi</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Text style={[styles.kpiLabel, { color: '#065F46' }]}>LABA BERSIH</Text>
              <Text style={[styles.kpiValue, { color: '#047857' }]}>
                Rp {netProfit.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.kpiSub}>
                Laba Kotor: Rp {grossProfit.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>

          {/* Payment breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Rincian Metode Pembayaran</Text>
            <View style={styles.payBreakRow}>
              <View style={styles.payBreakBox}>
                <Banknote size={20} color="#10B981" />
                <Text style={styles.payBreakLabel}>Tunai (Cash)</Text>
                <Text style={styles.payBreakVal}>
                  Rp {(stats?.tunai || 0).toLocaleString('id-ID')}
                </Text>
              </View>

              <View style={styles.payBreakBox}>
                <CreditCard size={20} color="#2563EB" />
                <Text style={styles.payBreakLabel}>QRIS / Transfer</Text>
                <Text style={styles.payBreakVal}>
                  Rp {(stats?.qris || 0).toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          </View>

          {/* Operational Expenses */}
          <View style={styles.card}>
            <View style={styles.cardHeaderWithBtn}>
              <Text style={styles.cardSectionTitle}>Pengeluaran Operasional</Text>
              <TouchableOpacity
                style={styles.addExpenseBtn}
                onPress={() => setIsExpenseModalVisible(true)}
              >
                <Plus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.addExpenseBtnText}>+ Catat Biaya</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.expenseTotalText}>
              Total Biaya: Rp {(stats?.expense || 0).toLocaleString('id-ID')}
            </Text>
          </View>

          {/* Top 10 Best Sellers */}
          {stats?.bestSellers && stats.bestSellers.length > 0 && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Award size={18} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.cardSectionTitle}>Top Produk Terlaris</Text>
              </View>
              {stats.bestSellers.map((item, idx) => (
                <View key={idx} style={styles.sellerRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.sellerRank}>#{idx + 1}</Text>
                    <Text style={styles.sellerName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <Text style={styles.sellerSold}>{item.total_sold} terjual</Text>
                </View>
              ))}
            </View>
          )}

          {/* Low Stock Alert */}
          {stats?.lowStock && stats.lowStock.length > 0 && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <AlertTriangle size={18} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={[styles.cardSectionTitle, { color: '#EF4444' }]}>
                  Peringatan Stok Menipis (&le; 5)
                </Text>
              </View>
              {stats.lowStock.map((item, idx) => (
                <View key={idx} style={styles.sellerRow}>
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.lowStockBadge}>
                    {item.stock <= 0 ? 'Habis (0)' : `Sisa ${item.stock}`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL 1: Transaction Details & Refund Modal */}
      <Modal
        visible={selectedTrx !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTrx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Detail Transaksi #{selectedTrx?.id}
                </Text>
                <Text style={styles.modalSubTitle}>
                  {selectedTrx?.created_at
                    ? new Date(selectedTrx.created_at).toLocaleString('id-ID')
                    : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTrx(null)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {loadingTrxItems ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : (
              <ScrollView style={{ padding: 16 }}>
                <View style={styles.trxDetailInfo}>
                  <Text style={styles.trxDetailMethod}>
                    Metode: {selectedTrx?.payment_method}
                  </Text>
                  <Text style={styles.trxDetailTotal}>
                    Total Belanja: Rp {selectedTrx?.total_amount.toLocaleString('id-ID')}
                  </Text>
                </View>

                <Text style={[styles.cardSectionTitle, { marginTop: 12 }]}>
                  Barang yang Dibeli:
                </Text>
                {trxItems.map((item, idx) => (
                  <View key={idx} style={styles.trxItemRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.trxItemName}>{item.name}</Text>
                      <Text style={styles.trxItemSub}>
                        {item.quantity} x Rp {item.price?.toLocaleString('id-ID')}
                      </Text>
                    </View>
                    <Text style={styles.trxItemTotal}>
                      Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.refundBtn, refunding && { opacity: 0.7 }]}
                onPress={handleRefund}
                disabled={refunding}
              >
                {refunding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <RotateCcw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.refundBtnText}>
                      Batalkan Transaksi & Retur Stok
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Add Operational Expense Modal */}
      <Modal
        visible={isExpenseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catat Pengeluaran Operasional</Text>
              <TouchableOpacity onPress={() => setIsExpenseModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={styles.inputLabel}>Keterangan Pengeluaran *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Beli kantong kresek, bayar listrik..."
                value={expenseDesc}
                onChangeText={setExpenseDesc}
              />

              <Text style={styles.inputLabel}>Jumlah Uang (Rp) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="0"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, expenseLoading && { opacity: 0.7 }]}
                onPress={handleSaveExpense}
                disabled={expenseLoading}
              >
                {expenseLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Simpan Pengeluaran</Text>
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
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  filterLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  todayBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  todayBtnText: {
    color: '#2563EB',
    fontSize: 12,
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
  trxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  trxCardLeft: {
    flex: 1,
    marginRight: 10,
  },
  trxId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  trxTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  trxProfit: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  trxAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  trxDetailLink: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
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
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  periodTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
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
  cardHeaderWithBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addExpenseBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addExpenseBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  expenseTotalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  payBreakRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  payBreakBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  payBreakLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  payBreakVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  sellerRank: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
    width: 24,
  },
  sellerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  sellerSold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  lowStockBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
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
  trxDetailInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trxDetailMethod: {
    fontSize: 13,
    color: '#64748B',
  },
  trxDetailTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  trxItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  trxItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  trxItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  trxItemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  refundBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
    marginBottom: 14,
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
