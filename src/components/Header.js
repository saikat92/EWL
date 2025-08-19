import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

const Header = ({ navigation }) => (
  <View style={styles.header}>
    <MaterialIcons 
      name="menu" 
      size={28} 
      color="black" 
      onPress={() => navigation.toggleDrawer()}
      style={styles.menuIcon}
    />
  </View>
);

const styles = StyleSheet.create({
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  menuIcon: {
    padding: 10
  }
});

export default Header;