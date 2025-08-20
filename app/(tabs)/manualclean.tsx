import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ManualCleanScreen() {
  const [isCleaning, setIsCleaning] = useState(false);

  const startCleaning = () => {
    setIsCleaning(true);
    // Simulate cleaning process
    setTimeout(() => setIsCleaning(false), 5000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Clean</Text>
      
      <View style={styles.statusContainer}>
        <Ionicons 
          name={isCleaning ? "play-circle" : "power"} 
          size={64} 
          color={isCleaning ? "#4CD964" : "#007AFF"} 
        />
        <Text style={styles.statusText}>
          {isCleaning ? "Cleaning in progress..." : "Ready to clean"}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isCleaning && styles.buttonDisabled]}
        onPress={startCleaning}
        disabled={isCleaning}
      >
        <Text style={styles.buttonText}>
          {isCleaning ? "Cleaning..." : "Start Cleaning"}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.info}>
        <Ionicons name="information-circle" size={24} color="#007AFF" />
        <Text style={styles.infoText}>
          Press the button to start manual cleaning process.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  statusText: {
    fontSize: 20,
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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