import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

export default function AutoCleanScreen() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [schedule, setSchedule] = useState('Daily at 10:00 AM');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Auto Clean</Text>
      
      <View style={styles.control}>
        <View style={styles.controlText}>
          <Ionicons name="time" size={24} color="#007AFF" />
          <Text style={styles.controlLabel}>Auto Clean</Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={setIsEnabled}
        />
      </View>
      
      <View style={styles.schedule}>
        <Text style={styles.scheduleTitle}>Schedule</Text>
        <Text style={styles.scheduleText}>{schedule}</Text>
      </View>
      
      <View style={styles.info}>
        <Ionicons name="information-circle" size={24} color="#007AFF" />
        <Text style={styles.infoText}>
          When enabled, the system will automatically clean based on your schedule.
        </Text>
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
    marginBottom: 24,
  },
  control: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 16,
  },
  controlText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  schedule: {
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 16,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
});