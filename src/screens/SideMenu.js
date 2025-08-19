import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SideMenu = ({ navigation }) => (
  <ScrollView style={styles.container}>
    <View style={styles.userSection}>
      <MaterialIcons name="account-circle" size={80} color="#555" />
      <Text style={styles.userEmail}>say.picklu@gmail.com</Text>
    </View>
    
    <MenuItem icon="settings" text="App settings" />
    <MenuItem icon="security" text="Privacy Policy" />
    <MenuItem icon="info" text="App information" />
    <MenuItem icon="copyright" text="Intellectual Property" />
    
    <TouchableOpacity style={[styles.menuItem, styles.signOut]}>
      <MaterialIcons name="logout" size={24} color="#d32f2f" />
      <Text style={[styles.menuText, styles.signOutText]}>Sign out</Text>
    </TouchableOpacity>
    
    <View style={styles.footer}>
      <Text style={styles.footerText}>© KEI. 2022 - 2025</Text>
      <Text style={styles.version}>Version 3.4.10.12 (build 1451)</Text>
    </View>
  </ScrollView>
);

const MenuItem = ({ icon, text }) => (
  <TouchableOpacity style={styles.menuItem}>
    <MaterialIcons name={icon} size={24} color="#333" />
    <Text style={styles.menuText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  userSection: { alignItems: 'center', paddingVertical: 30, borderBottomWidth: 1, borderBottomColor: '#eee' },
  userEmail: { fontSize: 16, marginTop: 10, color: '#555' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 25, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuText: { fontSize: 16, marginLeft: 15 },
  signOut: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#eee' },
  signOutText: { color: '#d32f2f' },
  footer: { marginTop: 'auto', padding: 25, paddingBottom: 40 },
  footerText: { textAlign: 'center', color: '#666' },
  version: { textAlign: 'center', color: '#999', fontSize: 12, marginTop: 5 }
});

export default SideMenu;