import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.card}>
        <Ionicons name="stats-chart" size={32} color="#007AFF" />
        <Text style={styles.cardTitle}>Performance</Text>
        <Text style={styles.cardText}>System running optimally</Text>
      </View>
      <View style={styles.card}>
        <Ionicons name="time" size={32} color="#007AFF" />
        <Text style={styles.cardTitle}>Last Cleaned</Text>
        <Text style={styles.cardText}>2 hours ago</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  cardText: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
  },
});