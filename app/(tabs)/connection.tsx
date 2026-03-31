import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import { connectMQTT, disconnectMQTT, PiSnapshot } from '../mqttService';

const BROKER_IP   = '192.168.4.1';
const DEVICE_SSID = 'ECleaning-Device';
const DEVICE_PASS = 'ecl3an2024';

type ConnState = 'disconnected' | 'connecting' | 'connected';

export default function ConnectionScreen() {
  const [connState,   setConnState]   = useState<ConnState>('disconnected');
  const [snapshot,    setSnapshot]    = useState<PiSnapshot | null>(null);
  const [isScanning,  setIsScanning]  = useState(false);
  const [scannedSSID, setScannedSSID] = useState<string | null>(null);
  const [manualSsid,  setManualSsid]  = useState('');
  const [manualPass,  setManualPass]  = useState('');
  const [permission,  requestPermission] = useCameraPermissions();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const mqttTried  = useRef(false);

  // ── Pulse animation for connecting state ────────────────────────────────
  useEffect(() => {
    if (connState !== 'connecting') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [connState]);

  // ── Try MQTT connection ─────────────────────────────────────────────────

  const tryMQTT = useCallback(() => {
    setConnState('connecting');
    setErrorMsg(null);

    connectMQTT(
      (data) => {
        setSnapshot(data);
        setConnState('connected');
      },
      () => {
        setConnState('connected');
      },
      (err) => {
        setConnState('disconnected');
        setErrorMsg(`Broker unreachable: ${err}`);
      }
    );

    setTimeout(() => {
      setConnState((prev) => {
        if (prev === 'connecting') {
          setErrorMsg('Connection timed out. Is the Pi hotspot active?');
          return 'disconnected';
        }
        return prev;
      });
    }, 8000);
  }, []);

  // ── Auto-try on mount (in case already on hotspot) ──────────────────────
  useEffect(() => {
    tryMQTT();
  }, []);

  // ── Camera permission ───────────────────────────────────────────────────
  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // ── QR parser ───────────────────────────────────────────────────────────
  const parseWifiQR = (data: string) => {
    try {
      console.log("[QR] Raw data:", data);
      // Strip WIFI: prefix, split on semicolons
      const clean  = data.replace(/^WIFI:/, '');
      const parts  = clean.split(';');
      const map: Record<string, string> = {};
      parts.forEach((p) => {
        const idx = p.indexOf(':');
        if (idx > 0) {
          map[p.slice(0, idx)] = p.slice(idx + 1);
        }
      });
      console.log("[QR] Parsed map:", map);
      if (map['S'] && map['P']) {
        return { ssid: map['S'], password: map['P'] };
      }
      return null;
    } catch (e) {
      console.error("[QR] Parse error:", e);
      return null;
    }
  };

  // ── QR scan handler ─────────────────────────────────────────────────────
  const handleQRScanned = async ({ data }: { data: string }) => {
    setIsScanning(false);
    const creds = parseWifiQR(data);
    if (!creds) {
      Alert.alert('Invalid QR', 'Could not read Wi-Fi credentials from this QR code.');
      return;
    }
    setScannedSSID(creds.ssid);
    Alert.alert(
      'Network Found',
      `Join "${creds.ssid}" and connect to device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Connect', onPress: () => joinWifi(creds.ssid, creds.password) },
      ]
    );
  };

  // ── Join WiFi then MQTT ─────────────────────────────────────────────────
  const joinWifi = async (ssid: string, password: string) => {
    setConnState('connecting');
    try {
      await WifiManager.connectToProtectedSSID(ssid, password, false, false);
      // Wait for DHCP
      setTimeout(() => tryMQTT(), 3000);
    } catch {
      setConnState('disconnected');
      Alert.alert('WiFi Error', 'Could not join the network. Try manually in phone Settings.');
    }
  };

  // ── Manual connect ──────────────────────────────────────────────────────
  const handleManualConnect = async () => {
    if (!manualSsid.trim()) {
      Alert.alert('Error', 'Please enter the network SSID');
      return;
    }
    await joinWifi(manualSsid.trim(), manualPass.trim());
  };

  // ── Quick connect (already on hotspot) ─────────────────────────────────
  const handleQuickConnect = () => {
    disconnectMQTT();
    setTimeout(() => tryMQTT(), 300);
  };

  // ── Disconnect ──────────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    disconnectMQTT();
    setConnState('disconnected');
    setSnapshot(null);
    try { await WifiManager.disconnect(); } catch {}
  };

  // ── Status colour ───────────────────────────────────────────────────────
  const statusColor = connState === 'connected' ? '#00FF9C'
    : connState === 'connecting' ? '#FFB800' : '#FF3D5A';
  const statusLabel = connState === 'connected' ? 'CONNECTED'
    : connState === 'connecting' ? 'CONNECTING...' : 'NOT CONNECTED';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="wifi-arrow-right" size={32} color="#00D4FF" />
        <Text style={styles.title}>Device Connection</Text>
        <Text style={styles.subtitle}>E-Cleaning UV System  ·  {BROKER_IP}</Text>
      </View>

      {/* ── Status Card ── */}
      <View style={[styles.statusCard, { borderColor: statusColor }]}>
        <View style={styles.statusTop}>
          <Animated.View style={[
            styles.statusDot, { backgroundColor: statusColor, opacity: connState === 'connecting' ? pulseAnim : 1 }
          ]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          {connState === 'connected' && (
            <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectPill}>
              <Text style={styles.disconnectPillText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>
        {errorMsg && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#FF3D5A" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {connState === 'connected' && snapshot && (
          <View style={styles.snapshotGrid}>
            {[
              { k: 'STATE',    v: snapshot.deviceState },
              { k: 'MOTOR',    v: `${snapshot.motorRPM} RPM` },
              { k: 'UV',       v: snapshot.uvActive ? 'ON' : 'OFF' },
              { k: 'IP',       v: snapshot.deviceIp },
            ].map((item) => (
              <View key={item.k} style={styles.snapshotItem}>
                <Text style={styles.snapshotKey}>{item.k}</Text>
                <Text style={styles.snapshotVal}>{item.v}</Text>
              </View>
            ))}
          </View>
        )}

        {connState === 'connected' && !snapshot && (
          <Text style={styles.waitingText}>Waiting for first snapshot from device…</Text>
        )}

        {connState === 'disconnected' && (
          <View style={styles.quickConnectWrap}>
            <Text style={styles.quickConnectHint}>
              Already connected to "{DEVICE_SSID}" hotspot?
            </Text>
            <TouchableOpacity style={styles.quickConnectBtn} onPress={handleQuickConnect}>
              <MaterialCommunityIcons name="lan-connect" size={18} color="#0A0E1A" />
              <Text style={styles.quickConnectBtnText}>Connect to Device Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {connState === 'connecting' && (
          <Text style={styles.waitingText}>
            Reaching broker at {BROKER_IP}:1883…
          </Text>
        )}
      </View>

      {/* ── QR Scanner Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="qrcode-scan" size={20} color="#00D4FF" />
          <Text style={styles.cardTitle}>Scan Device QR</Text>
        </View>
        <Text style={styles.cardDesc}>
          Point camera at the QR code shown on the Pi screen to auto-join its Wi-Fi.
        </Text>

        <View style={styles.qrBox}>
          {isScanning ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={handleQRScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            >
              <View style={styles.qrOverlay}>
                <View style={styles.qrFrame}>
                  {['TL','TR','BL','BR'].map((c) => (
                    <View key={c} style={[styles.qrCorner,
                      c.includes('T') ? styles.qrTop : styles.qrBottom,
                      c.includes('L') ? styles.qrLeft : styles.qrRight,
                    ]} />
                  ))}
                </View>
                <Text style={styles.qrHint}>Align QR within frame</Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.qrPlaceholder}>
              <MaterialCommunityIcons name="qrcode" size={56} color="#1E2D4A" />
              <Text style={styles.qrPlaceholderText}>
                {scannedSSID ? `Scanned: ${scannedSSID}` : 'Camera off'}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btn, isScanning && styles.btnRed]}
          onPress={() => {
            if (!permission?.granted) {
              Alert.alert('Camera Permission', 'Allow camera access to scan QR codes.',
                [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]);
              return;
            }
            setIsScanning((v) => !v);
          }}
        >
          <MaterialCommunityIcons name={isScanning ? 'camera-off' : 'camera'} size={18} color={isScanning ? 'white' : '#0A0E1A'} />
          <Text style={[styles.btnText, isScanning && { color: 'white' }]}>
            {isScanning ? 'Stop Scanning' : 'Scan QR Code'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Manual Connect Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="wifi-settings" size={20} color="#00D4FF" />
          <Text style={styles.cardTitle}>Manual Wi-Fi</Text>
        </View>
        <Text style={styles.cardDesc}>
          Enter credentials if QR scanning is unavailable.
        </Text>

        <TextInput
          style={styles.input}
          placeholder={`SSID  (default: ${DEVICE_SSID})`}
          placeholderTextColor="#4A6080"
          value={manualSsid}
          onChangeText={setManualSsid}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={`Password  (default: ${DEVICE_PASS})`}
          placeholderTextColor="#4A6080"
          value={manualPass}
          onChangeText={setManualPass}
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.btn, connState === 'connecting' && styles.btnDisabled]}
          onPress={handleManualConnect}
          disabled={connState === 'connecting'}
        >
          <MaterialCommunityIcons name="wifi-arrow-right" size={18} color="#0A0E1A" />
          <Text style={styles.btnText}>Connect</Text>
        </TouchableOpacity>
      </View>

      {/* ── Help Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="help-circle-outline" size={20} color="#00D4FF" />
          <Text style={styles.cardTitle}>Troubleshooting</Text>
        </View>

        {[
          {
            icon: 'wifi',
            title: 'Already on device hotspot?',
            desc: `If your phone shows "${DEVICE_SSID}" in Wi-Fi settings, tap "Connect to Device Now" on the status card above — no need to scan QR.`,
          },
          {
            icon: 'qrcode',
            title: 'QR not scanning?',
            desc: 'Ensure good screen brightness on the Pi display. Hold phone 15–30 cm away. If it still fails, use Manual Wi-Fi below.',
          },
          {
            icon: 'server-network',
            title: 'Connected to WiFi but still offline?',
            desc: `Phone joined the hotspot but app can't reach the broker. Tap "Connect to Device Now". MQTT broker must be running on the Pi (port 1883).`,
          },
          {
            icon: 'alert-circle-outline',
            title: 'IP configuration failure?',
            desc: 'Restart the Pi app to restart hostapd and dnsmasq. Then forget the network on your phone and reconnect.',
          },
        ].map((item, i) => (
          <View key={i} style={styles.helpItem}>
            <View style={styles.helpIconWrap}>
              <MaterialCommunityIcons name={item.icon as any} size={18} color="#00D4FF" />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>{item.title}</Text>
              <Text style={styles.helpDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A' },
  content:   { padding: 16, paddingBottom: 32 },

  header: { alignItems: 'center', paddingTop: 16, marginBottom: 20 },
  title:   { fontSize: 24, fontWeight: '800', color: '#E8F4FD', marginTop: 10 },
  subtitle:{ fontSize: 12, color: '#4A6080', marginTop: 4 },

  // Status card
  statusCard: {
    borderRadius: 14, borderWidth: 1.5,
    backgroundColor: '#0F1629',
    padding: 18, marginBottom: 16,
  },
  statusTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1, flex: 1 },
  disconnectPill: {
    backgroundColor: '#FF3D5A', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  disconnectPillText: { fontSize: 11, fontWeight: '700', color: 'white' },

  snapshotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  snapshotItem: {
    flex: 1, minWidth: '44%',
    backgroundColor: '#141D35', borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: '#1E2D4A',
  },
  snapshotKey: { fontSize: 9, fontWeight: '800', color: '#4A6080', letterSpacing: 1, marginBottom: 3 },
  snapshotVal: { fontSize: 13, fontWeight: '700', color: '#00D4FF' },

  waitingText: { fontSize: 12, color: '#4A6080', textAlign: 'center', marginTop: 4 },

  quickConnectWrap: { alignItems: 'center', gap: 10 },
  quickConnectHint: { fontSize: 12, color: '#8BA4C0', textAlign: 'center' },
  quickConnectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#00FF9C', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 20,
  },
  quickConnectBtnText: { fontSize: 14, fontWeight: '800', color: '#0A0E1A' },

  // Generic card
  card: {
    backgroundColor: '#141D35', borderRadius: 14,
    padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#1E2D4A',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: '#E8F4FD' },
  cardDesc:   { fontSize: 12, color: '#8BA4C0', lineHeight: 18, marginBottom: 14 },

  // QR
  qrBox: {
    height: 230, borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#0F1629', borderWidth: 1, borderColor: '#1E2D4A',
    marginBottom: 14, position: 'relative',
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  qrFrame: { width: 160, height: 160, position: 'relative' },
  qrCorner: {
    position: 'absolute', width: 24, height: 24, borderColor: '#00D4FF',
  },
  qrTop:    { top: 0,    borderTopWidth: 3 },
  qrBottom: { bottom: 0, borderBottomWidth: 3 },
  qrLeft:   { left: 0,  borderLeftWidth: 3 },
  qrRight:  { right: 0, borderRightWidth: 3 },
  qrHint:   { color: 'white', fontSize: 12, marginTop: 20, fontWeight: '500' },
  qrPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  qrPlaceholderText: { fontSize: 12, color: '#4A6080', marginTop: 10 },

  // Buttons
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#00D4FF', borderRadius: 10,
    paddingVertical: 13, gap: 8,
  },
  btnRed:      { backgroundColor: '#FF3D5A' },
  btnDisabled: { backgroundColor: '#1E2D4A', opacity: 0.6 },
  btnText:     { fontSize: 14, fontWeight: '700', color: '#0A0E1A' },

  // Input
  input: {
    backgroundColor: '#0F1629', borderWidth: 1, borderColor: '#1E2D4A',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#E8F4FD', marginBottom: 10,
  },

  // Help
  helpItem:    { flexDirection: 'row', gap: 12, marginBottom: 16 },
  helpIconWrap:{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#0F1629', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1E2D4A' },
  helpContent: { flex: 1 },
  helpTitle:   { fontSize: 13, fontWeight: '600', color: '#E8F4FD', marginBottom: 3 },
  helpDesc:    { fontSize: 12, color: '#8BA4C0', lineHeight: 18 },

  // error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,61,90,0.1)',
    borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,61,90,0.3)',
  },
  errorText: { flex: 1, fontSize: 12, color: '#FF3D5A', lineHeight: 18 },
});