import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

export default function ConnectionScreen() {
  const [isConnected, setIsConnected] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connection</Text>
      <View style={styles.statusContainer}>
        <Ionicons 
          name={isConnected ? "wifi" : "wifi-off"} 
          size={48} 
          color={isConnected ? "#4CD964" : "#FF3B30"} 
        />
        <Text style={styles.statusText}>
          {isConnected ? "Connected" : "Disconnected"}
        </Text>
      </View>
      <View style={styles.control}>
        <Text>Connection Status</Text>
        <Switch
          value={isConnected}
          onValueChange={setIsConnected}
        />
      </View>
    </View>
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
  statusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusText: {
    fontSize: 20,
    marginTop: 16,
  },
  control: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
});