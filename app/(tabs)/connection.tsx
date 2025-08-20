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


export default function ConnectionScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [manualSsid, setManualSsid] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [isManualConnecting, setIsManualConnecting] = useState(false);

  const handleManualConnect = () => {
    if (!manualSsid.trim()) {
      Alert.alert("Error", "Please enter a valid SSID");
      return;
    }
    setIsManualConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      setIsConnected(true);
      setScannedData(manualSsid);
      setIsManualConnecting(false);
      Alert.alert("Success", `Connected to ${manualSsid} successfully!`);
    }, 2000);
  };


  // Request camera permission when component mounts
  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, []);

  // Handle QR code scanning
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setIsScanning(false);
    setScannedData(data);
    
    // Simulate connection process
    Alert.alert(
      "QR Code Scanned", 
      `Device ID: ${data}\n\nConnecting to device...`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Connect", 
          onPress: () => {
            // Simulate connection success after 2 seconds
            setTimeout(() => {
              setIsConnected(true);
              Alert.alert("Success", "Device connected successfully!");
            }, 2000);
          }
        }
      ]
    );
  };

  // Start scanning
  const startScanning = () => {
    if (!permission?.granted) {
      Alert.alert(
        "Camera Permission Required",
        "Please allow camera access to scan QR codes",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Open Settings", 
            onPress: () => Linking.openSettings() 
          }
        ]
      );
      return;
    }
    setIsScanning(true);
    setScannedData(null);
  };

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false);
  };

  // Disconnect from device
  const disconnectDevice = () => {
    setIsConnected(false);
    setScannedData(null);
    setManualSsid('');
    setManualPassword('');
    Alert.alert("Disconnected", "Device disconnected successfully");
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="wifi" size={32} color="#3498db" />
        <Text style={styles.title}>Device Connection</Text>
        <Text style={styles.subtitle}>Connect to your E-Cleaning device</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Connection Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons 
              name={isConnected ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={isConnected ? "#4CD964" : "#FF3B30"} 
            />
            <Text style={styles.cardTitle}>
              {isConnected ? "Connected" : "Disconnected"}
            </Text>
          </View>
          
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isConnected ? "#4CD964" : "#FF3B30" }
            ]} />
            <Text style={styles.statusText}>
              {isConnected 
                ? `Connected to device: ${scannedData || "E-Cleaner-001"}` 
                : "No device connected"
              }
            </Text>
          </View>
          
          {isConnected && (
            <TouchableOpacity 
              style={styles.disconnectButton}
              onPress={disconnectDevice}
            >
              <Ionicons name="power" size={20} color="white" />
              <Text style={styles.disconnectButtonText}>Disconnect Device</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* QR Scanner Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>QR Code Connection</Text>
          </View>
          
          <Text style={styles.cardDescription}>
            Scan the QR code on your E-Cleaning device to connect automatically
          </Text>
          
          <View style={styles.qrContainer}>
            {isScanning ? (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={scannedData ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417"],
                  }}
                />
                <View style={styles.scannerOverlay}>
                  <View style={styles.scannerFrame}>
                    <View style={[styles.corner, styles.cornerTopLeft]} />
                    <View style={[styles.corner, styles.cornerTopRight]} />
                    <View style={[styles.corner, styles.cornerBottomLeft]} />
                    <View style={[styles.corner, styles.cornerBottomRight]} />
                  </View>
                  <Text style={styles.scannerText}>Align QR code within the frame</Text>
                </View>
              </View>
            ) : (
              <View style={styles.qrPlaceholder}>
                <MaterialCommunityIcons name="qrcode" size={80} color="#ccc" />
                <Text style={styles.placeholderText}>
                  {scannedData ? "QR Code Already Scanned" : "QR Code Scanner"}
                </Text>
                {scannedData && (
                  <Text style={styles.scannedDataText}>
                    Scanned: {scannedData}
                  </Text>
                )}
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.scanButton, isScanning && styles.scanButtonActive]}
            onPress={isScanning ? stopScanning : startScanning}
            disabled={isConnected}
          >
            <MaterialCommunityIcons 
              name={isScanning ? "stop" : "qrcode-scan"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.scanButtonText}>
              {isScanning ? "Stop Scanning" : "Scan QR Code"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Manual SSID Connection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="wifi" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>Manual Connection</Text>
          </View>
          
          <Text style={styles.cardDescription}>
            Connect to your device manually by entering SSID and password
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter SSID"
            value={manualSsid}
            onChangeText={setManualSsid}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Enter Password"
            value={manualPassword}
            onChangeText={setManualPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          
          <TouchableOpacity 
            style={[
              styles.scanButton, 
              (isConnected || isManualConnecting) && styles.scanButtonDisabled
            ]}
            onPress={handleManualConnect}
            disabled={isConnected || isManualConnecting}
          >
            <Ionicons 
              name={isManualConnecting ? "time" : "wifi"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.scanButtonText}>
              {isManualConnecting ? "Connecting..." : "Connect Manually"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Connection Help Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="help-circle" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>Connection Help</Text>
          </View>
          
          <View style={styles.helpItem}>
            <View style={styles.helpIcon}>
              <MaterialIcons name="power" size={20} color="#3498db" />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Ensure Device is Powered On</Text>
              <Text style={styles.helpDescription}>
                Make sure your E-Cleaning device is turned on and in pairing mode
              </Text>
            </View>
          </View>
          
          <View style={styles.helpItem}>
            <View style={styles.helpIcon}>
              <Ionicons name="bluetooth" size={20} color="#3498db" />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Enable Bluetooth</Text>
              <Text style={styles.helpDescription}>
                Ensure Bluetooth is enabled on your mobile device
              </Text>
            </View>
          </View>
          
          <View style={styles.helpItem}>
            <View style={styles.helpIcon}>
              <MaterialCommunityIcons name="qrcode" size={20} color="#3498db" />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Position QR Code Properly</Text>
              <Text style={styles.helpDescription}>
                Hold your device steady and ensure the QR code is clearly visible
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>View Detailed Connection Guide</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#3498db" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    lineHeight: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  disconnectButton: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  qrContainer: {
    height: 300,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scannerFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3498db',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scannerText: {
    marginTop: 30,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  qrPlaceholder: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#adb5bd',
  },
  scannedDataText: {
    marginTop: 8,
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  scanButtonActive: {
    backgroundColor: '#e74c3c',
  },
  helpItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  helpIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  helpButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    marginTop: 8,
  },
  helpButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  input: {
  height: 50,
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  paddingHorizontal: 16,
  marginBottom: 16,
  fontSize: 16,
},
scanButtonDisabled: {
  backgroundColor: '#95a5a6',
  opacity: 0.7,
},
});