import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SidebarMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ isVisible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue:         isVisible ? 0 : 320,
      duration:        280,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="robot-industrial" size={24} color="#00D4FF" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerTitle}>E-Cleaning</Text>
              <Text style={styles.headerSub}>Control System</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#8BA4C0" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>

          {/* ── App info ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>APP INFO</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Application</Text>
              <Text style={styles.infoValue}>E-Cleaning Connect</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0 (build 1)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Device Model</Text>
              <Text style={styles.infoValue}>UV-VD-MK1</Text>
            </View>
          </View>

          {/* ── Account ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={[styles.infoValue, { color: '#00D4FF' }]}>
                araneusedutech@gmail.com
              </Text>
            </View>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="person-outline" size={16} color="#8BA4C0" />
              <Text style={styles.menuItemText}>Account Settings</Text>
              <Ionicons name="chevron-forward" size={16} color="#4A6080" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="log-out-outline" size={16} color="#FF3D5A" />
              <Text style={[styles.menuItemText, { color: '#FF3D5A' }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={16} color="#4A6080" />
            </TouchableOpacity>
          </View>

          {/* ── App settings ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>APP SETTINGS</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Device Name</Text>
              <Text style={styles.infoValue}>ECPi</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Broker</Text>
              <Text style={styles.infoValue}>192.168.4.1:1883</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Theme</Text>
              <Text style={styles.infoValue}>Dark</Text>
            </View>
          </View>

          {/* ── Toggles ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PREFERENCES</Text>

            {[
              { label: 'Usage Analytics', sub: 'Help improve the app' },
              { label: 'Push Notifications', sub: 'Device alerts and status' },
            ].map((item, i) => (
              <View key={i} style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>{item.label}</Text>
                  <Text style={styles.toggleSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ false: '#1E2D4A', true: '#00D4FF' }}
                  thumbColor="#E8F4FD"
                />
              </View>
            ))}
          </View>

          {/* ── Logs & Info ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMATION & LOGS</Text>

            <Link href="/SystemLogScreen" asChild>
              <TouchableOpacity style={styles.menuItem} onPress={onClose}>
                <MaterialCommunityIcons name="text-box-outline" size={16} color="#8BA4C0" />
                <Text style={styles.menuItemText}>System Logs</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>View</Text>
                </View>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="information-circle-outline" size={16} color="#8BA4C0" />
              <Text style={styles.menuItemText}>About Device</Text>
              <Ionicons name="chevron-forward" size={16} color="#4A6080" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="document-text-outline" size={16} color="#8BA4C0" />
              <Text style={styles.menuItemText}>License</Text>
              <Ionicons name="chevron-forward" size={16} color="#4A6080" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL('#')}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color="#8BA4C0" />
              <Text style={styles.menuItemText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={16} color="#4A6080" />
            </TouchableOpacity>
          </View>

          {/* ── Reset ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RESET</Text>
            <TouchableOpacity style={styles.menuItem}>
              <MaterialCommunityIcons name="refresh" size={16} color="#FFB800" />
              <Text style={[styles.menuItemText, { color: '#FFB800' }]}>
                Reset App Data
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#4A6080" />
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © KEI · MSME Innovative Scheme · 2022–2025
            </Text>
            <Text style={styles.footerRef}>IDEAWB012694</Text>
          </View>

        </ScrollView>
      </Animated.View>
    </View>
  );
};

export default SidebarMenu;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },

  sidebar: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: '82%', maxWidth: 310,
    backgroundColor: '#0F1629',
    borderLeftWidth: 1, borderLeftColor: '#1E2D4A',
    shadowColor: '#000', shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 20,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, paddingTop: 24,
    borderBottomWidth: 1, borderBottomColor: '#1E2D4A',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#E8F4FD' },
  headerSub:   { fontSize: 11, color: '#4A6080', marginTop: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#141D35', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#1E2D4A',
  },

  scrollArea: { flex: 1 },

  section: {
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1E2D4A',
  },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: '#4A6080',
    letterSpacing: 1.5, marginBottom: 12,
  },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6,
  },
  infoLabel: { fontSize: 13, color: '#8BA4C0' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#E8F4FD', maxWidth: '55%', textAlign: 'right' },

  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, gap: 10,
  },
  menuItemText: { flex: 1, fontSize: 14, color: '#8BA4C0' },

  badge: {
    backgroundColor: '#00D4FF', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#0A0E1A' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 12,
  },
  toggleLabel: { fontSize: 14, color: '#E8F4FD', marginBottom: 2 },
  toggleSub:   { fontSize: 11, color: '#4A6080' },

  footer: { padding: 20, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#4A6080', textAlign: 'center' },
  footerRef:  { fontSize: 10, color: '#1E2D4A', marginTop: 4 },
});
