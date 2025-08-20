// components/SidebarMenu.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
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
  if (!isVisible) return null;

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://www.usa.canon.com/internet/portal/us/home/terms-of-use/privacy-policy');
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
      <View style={styles.sidebar}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.menuContent}>
          {/* App Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>E-Cleaning Connect</Text>
            <Text style={styles.versionText}>Version 3.4.10.12 (build 1451)</Text>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User ID</Text>
            <Text style={styles.emailText}>say.picklu@gmail.com</Text>
            <TouchableOpacity style={styles.menuItem}>
              <Text>Confirming and deleting your account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>

          {/* App Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App settings</Text>
            <View style={styles.settingItem}>
              <Text>Name</Text>
              <Text style={styles.settingValue}>RMP2108</Text>
            </View>
            <View style={styles.settingItem}>
              <Text>Appearance mode</Text>
              <Text style={styles.settingValue}>Light</Text>
            </View>
          </View>

          {/* Reset Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reset</Text>
            <TouchableOpacity style={styles.menuItem}>
              <Text>Reset message display</Text>
            </TouchableOpacity>
          </View>

          {/* App Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App information</Text>
            <TouchableOpacity style={styles.menuItem}>
              <Text>About this app</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text>License</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text>Intellectual Property Rights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
              <Text style={styles.privacyText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          {/* Toggles Section */}
          <View style={styles.section}>
            <View style={styles.toggleItem}>
              <View>
                <Text>Usage collection</Text>
                <Text style={styles.toggleSubtext}>Agree</Text>
              </View>
              <Switch value={true} onValueChange={() => {}} />
            </View>
            <View style={styles.toggleItem}>
              <View>
                <Text>Notifications for you</Text>
                <Text style={styles.toggleSubtext}>Agree</Text>
              </View>
              <Switch value={true} onValueChange={() => {}} />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© KEI. 2022-2025</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 300,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  menuContent: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
  },
  emailText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 12,
  },
  menuItem: {
    paddingVertical: 12,
  },
  signOutText: {
    color: '#FF3B30',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingValue: {
    color: '#666',
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  privacyText: {
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});

export default SidebarMenu;