import { StyleSheet, Text, View } from 'react-native';
import Header from '../../../components/Header';

const ConnectionScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Header navigation={navigation} />
    <Text style={styles.title}>Connection Screen</Text>
    {/* Add your specific connection UI here */}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', margin: 20 }
});

export default ConnectionScreen;