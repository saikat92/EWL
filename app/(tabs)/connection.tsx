import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import { connectMQTT, disconnectMQTT, PiSnapshot } from "../mqttService";


export default function ConnectionScreen() {
  const [isScanning, setIsScanning]           = useState(false);
  const [scannedData, setScannedData]         = useState<string | null>(null);
  const [permission, requestPermission]       = useCameraPermissions();
  const [piIp, setPiIp]                       = useState<string>('192.168.4.1');
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');

  const [manualSsid, setManualSsid]           = useState('');
  const [manualPassword, setManualPassword]   = useState('');
  const [isManualConnecting, setIsManualConnecting] = useState(false);

  const [status, setStatus]     = useState<PiSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // ── MQTT connection ────────────────────────────────────────────────────────
  useEffect(() => {
    connectMQTT(
      (data) => {
        // Snapshot received from Pi — device is definitely reachable
        setStatus(data);
        if (!connected) {
          setConnected(true);
          setIsConnected(true);
          setConnectionStatus('Connected');
          setPiIp('192.168.4.1');
        }
      },
      () => {
        // MQTT broker handshake complete
        setConnected(true);
        setIsConnected(true);
        setConnectionStatus('Connected');
      }
    );
  }, []);

  // ── Camera permission on mount ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, []);

  // ── WiFi connection ───────────────────────────────────────────────────────
  const connectToWifi = async (ssid: string, password: string) => {
    try {
      await WifiManager.connectToProtectedSSID(ssid, password, false, false);
      return true;
    } catch (error) {
      console.error('WiFi connection failed:', error);
      Alert.alert("Connection Error", "Failed to connect to WiFi network");
      return false;
    }
  };

  // ── Parse QR WiFi credentials ─────────────────────────────────────────────
  // Expected format: WIFI:T:WPA;S:SSID;P:password;;
  const parseWifiCredentials = (data: string) => {
    try {
      const ssidMatch     = data.match(/S:([^;]+)/);
      const passwordMatch = data.match(/P:([^;]+)/);
      if (ssidMatch && passwordMatch) {
        return { ssid: ssidMatch[1], password: passwordMatch[1] };
      }
      return null;
    } catch {
      return null;
    }
  };

  // ── Manual connect ────────────────────────────────────────────────────────
  const handleManualConnect = async () => {
    if (!manualSsid.trim()) {
      Alert.alert("Error", "Please enter a valid SSID");
      return;
    }
    setIsManualConnecting(true);
    try {
      const success = await connectToWifi(manualSsid, manualPassword);
      if (success) {
        // MQTT will auto-reconnect once on the Pi network
        // Connection state is set by the MQTT onConnected callback above
        Alert.alert(
          "WiFi Joined",
          `Joined ${manualSsid}. Waiting for device connection...`
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to establish connection");
    } finally {
      setIsManualConnecting(false);
    }
  };

  // ── QR scan handler ───────────────────────────────────────────────────────
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setIsScanning(false);
    setScannedData(data);

    const credentials = parseWifiCredentials(data);
    if (!credentials) {
      Alert.alert("Error", "Invalid QR code format. Expected WiFi QR.");
      return;
    }

    Alert.alert(
      "QR Code Scanned",
      `Network: ${credentials.ssid}\n\nConnect to this device?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          onPress: async () => {
            try {
              const success = await connectToWifi(
                credentials.ssid,
                credentials.password
              );
              if (success) {
                Alert.alert(
                  "WiFi Joined",
                  "Joined device network. Connecting to MQTT broker..."
                );
                // MQTT will auto-reconnect — callback sets isConnected
              }
            } catch {
              Alert.alert("Error", "Failed to connect to device network");
            }
          }
        }
      ]
    );
  };

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnectDevice = async () => {
    try {
      disconnectMQTT();
      await WifiManager.disconnect();
      setIsConnected(false);
      setConnected(false);
      setConnectionStatus('Disconnected');
      setScannedData(null);
      setManualSsid('');
      setManualPassword('');
      setStatus(null);
      Alert.alert("Disconnected", "Device disconnected successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to disconnect from device");
    }
  };

  // ── Scan controls ─────────────────────────────────────────────────────────
  const startScanning = () => {
    if (!permission?.granted) {
      Alert.alert(
        "Camera Permission Required",
        "Please allow camera access to scan QR codes",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }
    setIsScanning(true);
    setScannedData(null);
  };

  const stopScanning = () => setIsScanning(false);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="wifi" size={32} color="#00D4FF" />
        <Text style={styles.title}>Device Connection</Text>
        <Text style={styles.subtitle}>Connect to your E-Cleaning device</Text>
      </View>

      {/* ── Connection Status Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons
            name={connected ? "checkmark-circle" : "close-circle"}
            size={24}
            color={connected ? "#00FF9C" : "#FF3D5A"}
          />
          <Text style={styles.cardTitle}>
            {connected ? "Connected" : "Not Connected"}
          </Text>
        </View>

        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot,
            { backgroundColor: connected ? "#00FF9C" : "#FF3D5A" }
          ]} />
          <Text style={styles.statusText}>
            {connected
              ? `Device reachable at ${piIp}`
              : "No device connected"}
          </Text>
        </View>

        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot,
            { backgroundColor: connected ? "#00FF9C" : "#FF3D5A" }
          ]} />
          <Text style={styles.statusText}>
            {connected
              ? `MQTT Broker: ${piIp}:1883`
              : "MQTT broker not reachable"}
          </Text>
        </View>

        {/* Live snapshot preview when connected */}
        {connected && status && (
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotBadge}>
              <Text style={styles.snapshotLabel}>STATE</Text>
              <Text style={styles.snapshotValue}>{status.deviceState}</Text>
            </View>
            <View style={styles.snapshotBadge}>
              <Text style={styles.snapshotLabel}>MOTOR</Text>
              <Text style={styles.snapshotValue}>{status.motorRPM} RPM</Text>
            </View>
            <View style={styles.snapshotBadge}>
              <Text style={styles.snapshotLabel}>UV</Text>
              <Text style={styles.snapshotValue}>
                {status.uvActive ? "ON" : "OFF"}
              </Text>
            </View>
          </View>
        )}

        {isConnected && (
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={disconnectDevice}
          >
            <Ionicons name="power" size={18} color="white" />
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── QR Scanner Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="qrcode-scan" size={24} color="#00D4FF" />
          <Text style={styles.cardTitle}>Scan Device QR Code</Text>
        </View>

        <Text style={styles.cardDescription}>
          Scan the QR code shown on the E-Cleaning device screen to
          automatically join its Wi-Fi network.
        </Text>

        <View style={styles.qrContainer}>
          {isScanning ? (
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              />
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame}>
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>
                <Text style={styles.scannerText}>
                  Align QR code within the frame
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.qrPlaceholder}>
              <MaterialCommunityIcons name="qrcode" size={64} color="#4A6080" />
              <Text style={styles.placeholderText}>
                {scannedData ? "QR code scanned" : "Camera inactive"}
              </Text>
              {scannedData && (
                <Text style={styles.scannedDataText} numberOfLines={1}>
                  {scannedData}
                </Text>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonActive]}
          onPress={isScanning ? stopScanning : startScanning}
        >
          <MaterialCommunityIcons
            name={isScanning ? "camera-off" : "camera"}
            size={20}
            color="white"
          />
          <Text style={styles.scanButtonText}>
            {isScanning ? "Stop Scanning" : "Scan QR Code"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Manual Connect Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="wifi-settings" size={24} color="#00D4FF" />
          <Text style={styles.cardTitle}>Manual Connection</Text>
        </View>

        <Text style={styles.cardDescription}>
          Manually enter the device Wi-Fi credentials if QR scanning is
          unavailable.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Network SSID (e.g. ECleaning-Device)"
          placeholderTextColor="#4A6080"
          value={manualSsid}
          onChangeText={setManualSsid}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#4A6080"
          value={manualPassword}
          onChangeText={setManualPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[
            styles.scanButton,
            isManualConnecting && styles.scanButtonDisabled
          ]}
          onPress={handleManualConnect}
          disabled={isManualConnecting}
        >
          <MaterialCommunityIcons name="wifi-arrow-right" size={20} color="white" />
          <Text style={styles.scanButtonText}>
            {isManualConnecting ? "Connecting..." : "Connect Manually"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Help Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="help-circle" size={24} color="#00D4FF" />
          <Text style={styles.cardTitle}>Connection Help</Text>
        </View>

        {[
          {
            icon: <MaterialIcons name="power" size={20} color="#00D4FF" />,
            title: "Ensure Device is Powered On",
            desc: "Make sure your E-Cleaning device is turned on. The screen should show the QR pairing page.",
          },
          {
            icon: <Ionicons name="wifi" size={20} color="#00D4FF" />,
            title: "Enable Wi-Fi on Your Phone",
            desc: `Connect to "ECleaning-Device" network. Default password: ecl3an2024`,
          },
          {
            icon: <MaterialCommunityIcons name="qrcode" size={20} color="#00D4FF" />,
            title: "Scan the QR Code",
            desc: "Hold your phone steady 15–30 cm from the screen. Ensure good lighting.",
          },
          {
            icon: <MaterialCommunityIcons name="server-network" size={20} color="#00D4FF" />,
            title: "MQTT Broker",
            desc: "The app connects to 192.168.4.1:1883 automatically after joining the device network.",
          },
        ].map((item, i) => (
          <View key={i} style={styles.helpItem}>
            <View style={styles.helpIcon}>{item.icon}</View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>{item.title}</Text>
              <Text style={styles.helpDescription}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#E8F4FD',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#8BA4C0',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#141D35',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#E8F4FD',
    marginLeft: 10,
  },
  cardDescription: {
    fontSize: 13,
    color: '#8BA4C0',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#8BA4C0',
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  snapshotBadge: {
    flex: 1,
    backgroundColor: '#0F1629',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  snapshotLabel: {
    fontSize: 9,
    color: '#4A6080',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  snapshotValue: {
    fontSize: 12,
    color: '#00D4FF',
    fontWeight: '700',
  },
  disconnectButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3D5A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  qrContainer: {
    height: 260,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerFrame: {
    width: 180,
    height: 180,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#00D4FF',
  },
  cornerTopLeft:     { top: 0,    left: 0,    borderTopWidth: 3, borderLeftWidth: 3,   borderTopLeftRadius: 10 },
  cornerTopRight:    { top: 0,    right: 0,   borderTopWidth: 3, borderRightWidth: 3,  borderTopRightRadius: 10 },
  cornerBottomLeft:  { bottom: 0, left: 0,    borderBottomWidth: 3, borderLeftWidth: 3,  borderBottomLeftRadius: 10 },
  cornerBottomRight: { bottom: 0, right: 0,   borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  scannerText: {
    marginTop: 24,
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  qrPlaceholder: {
    flex: 1,
    backgroundColor: '#0F1629',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4A6080',
  },
  scannedDataText: {
    marginTop: 6,
    fontSize: 12,
    color: '#00D4FF',
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#00D4FF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#0A0E1A',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  scanButtonActive: {
    backgroundColor: '#FF3D5A',
  },
  scanButtonDisabled: {
    backgroundColor: '#4A6080',
    opacity: 0.7,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 15,
    color: '#E8F4FD',
    backgroundColor: '#0F1629',
  },
  helpItem: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  helpIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F1629',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F4FD',
    marginBottom: 3,
  },
  helpDescription: {
    fontSize: 13,
    color: '#8BA4C0',
    lineHeight: 19,
  },
});