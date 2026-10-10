import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, ZapOff, Camera, AlertCircle } from 'lucide-react-native';
import { Theme } from '../theme';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

const { width, height } = Dimensions.get('window');
const SCAN_BOX_SIZE = Math.min(width * 0.72, 280);

export default function BarcodeScannerModal({
  visible,
  onClose,
  onScan,
  title = 'Scan Barcode Produk',
}: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setTorch(false);
    }
  }, [visible]);

  const handleBarcodeScanned = (result: { type: string; data: string }) => {
    if (scanned || !result.data) return;
    setScanned(true);
    onScan(result.data.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Permission Request State */}
        {!permission?.granted ? (
          <View style={styles.permissionBox}>
            <View style={styles.permissionIconWrapper}>
              <Camera size={48} color="#2563EB" />
            </View>
            <Text style={styles.permissionTitle}>Akses Kamera Diperlukan</Text>
            <Text style={styles.permissionDesc}>
              Aplikasi memerlukan izin kamera ponsel untuk memindai barcode produk secara otomatis.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={requestPermission}
            >
              <Text style={styles.permissionBtnText}>Izinkan Akses Kamera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFill}
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'qr',
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code128',
                  'code39',
                  'code93',
                  'itf14',
                  'codabar',
                ],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.circleBtn} onPress={onClose}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{title}</Text>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => setTorch((prev) => !prev)}
              >
                {torch ? (
                  <Zap size={22} color="#FBBF24" />
                ) : (
                  <ZapOff size={22} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Viewfinder Target Mask */}
            <View style={styles.maskContainer}>
              <View style={styles.maskTop} />
              <View style={styles.maskCenterRow}>
                <View style={styles.maskSide} />
                <View style={styles.scanTargetBox}>
                  {/* Target Corners */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  <View style={styles.scanLaser} />
                </View>
                <View style={styles.maskSide} />
              </View>
              <View style={styles.maskBottom}>
                <Text style={styles.instructionText}>
                  Arahkan kamera ke barcode produk
                </Text>
                <Text style={styles.instructionSub}>
                  Pastikan barcode berada di dalam kotak bidik
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary, // Off-black charcoal, no pure #000000
  },
  cameraWrapper: {
    flex: 1,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: Theme.colors.neutral,
  },
  permissionIconWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Theme.colors.tintAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.borderAccent,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: Theme.colors.tertiary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Theme.radius.md,
    width: '100%',
    alignItems: 'center',
    ...Theme.shadows.accentLift,
  },
  permissionBtnText: {
    color: Theme.colors.neutral,
    fontWeight: '600',
    fontSize: 15,
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: Theme.colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Theme.colors.neutral,
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(26, 26, 26, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  maskContainer: {
    flex: 1,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.72)',
  },
  maskCenterRow: {
    flexDirection: 'row',
    height: SCAN_BOX_SIZE,
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.72)',
  },
  scanTargetBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Theme.colors.tertiary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderLeftWidth: 3.5,
    borderTopWidth: 3.5,
    borderTopLeftRadius: Theme.radius.sm,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderRightWidth: 3.5,
    borderTopWidth: 3.5,
    borderTopRightRadius: Theme.radius.sm,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 3.5,
    borderBottomWidth: 3.5,
    borderBottomLeftRadius: Theme.radius.sm,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderRightWidth: 3.5,
    borderBottomWidth: 3.5,
    borderBottomRightRadius: Theme.radius.sm,
  },
  scanLaser: {
    width: '90%',
    height: 2,
    backgroundColor: Theme.colors.tertiary,
    shadowColor: Theme.colors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  maskBottom: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.72)',
    alignItems: 'center',
    paddingTop: 30,
  },
  instructionText: {
    color: Theme.colors.neutral,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionSub: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});
