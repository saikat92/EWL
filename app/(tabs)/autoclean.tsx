import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Vegetable data with cleaning times
const veggieData = {
  'Tomato': 180, // 3 minutes
  'Cucumber': 120, // 2 minutes
  'Carrot': 150, // 2.5 minutes
  'Lettuce': 200, // 3.33 minutes
  'Bell Pepper': 130, // 2.16 minutes
  'Potato': 240, // 4 minutes
  'Broccoli': 170, // 2.83 minutes
  'Cauliflower': 190, // 3.16 minutes
};

// Helper function to format time
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function AutoCleanScreen() {
  const [selectedVeggie, setSelectedVeggie] = useState<string>('Tomato');
  const [running, setRunning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Calculate time required based on selected vegetable
  const timeRequired = veggieData[selectedVeggie as keyof typeof veggieData];
  
  // Fixed settings
  const conveyorLength = 2.5;
  const motorRPM = 75;

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (running && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (running && countdown === 0) {
      setRunning(false);
      setShowSuccess(true);
    }
    return () => clearTimeout(timer);
  }, [running, countdown]);

  const startCleaning = () => {
    setCountdown(timeRequired);
    setRunning(true);
    setShowConfirmation(false);
  };

  const stopCleaning = () => {
    setRunning(false);
    Alert.alert(
      "Process Stopped",
      "The cleaning process has been stopped.",
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="robot-industrial" size={32} color="#3498db" />
        <Text style={styles.title}>Auto-Clean Operation</Text>
        <Text style={styles.subtitle}>Automated cleaning for various vegetables</Text>
      </View>

      {/* Vegetable Selection Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="food-apple" size={24} color="#3498db" />
          <Text style={styles.cardTitle}>Select Vegetable</Text>
        </View>
        
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedVeggie}
            onValueChange={(itemValue) => setSelectedVeggie(itemValue)}
            style={styles.picker}
            dropdownIconColor="#3498db"
            enabled={!running}
          >
            {Object.keys(veggieData).map((veg) => (
              <Picker.Item label={veg} value={veg} key={veg} />
            ))}
          </Picker>
        </View>
        
        <View style={styles.veggieInfo}>
          <MaterialCommunityIcons name="clock" size={20} color="#7f8c8d" />
          <Text style={styles.infoText}>Cleaning time: {formatTime(timeRequired)}</Text>
        </View>
      </View>

      {/* Settings Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="tune" size={24} color="#3498db" />
          <Text style={styles.cardTitle}>Operation Settings</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Conveyor Belt Length</Text>
          <Text style={styles.settingValue}>{conveyorLength} meters</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Motor Speed</Text>
          <Text style={[styles.settingValue, styles.rpmValue]}>{motorRPM} RPM</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>UV Sterilization</Text>
          <Text style={styles.settingValue}>Enabled</Text>
        </View>
      </View>

      {/* Timer Card */}
      <View style={[styles.card, styles.timerCard]}>
        <Text style={styles.timerLabel}>TIME REMAINING</Text>
        <Text style={styles.timerText}>{formatTime(countdown)}</Text>
        
        <View style={styles.statusRow}>
          <View style={styles.statusIndicator}>
            <MaterialCommunityIcons 
              name={running ? "motion-sensor" : "motion-off"} 
              size={20} 
              color={running ? "#2ecc71" : "#e74c3c"} 
            />
            <Text style={styles.statusText}>{running ? "Running" : "Stopped"}</Text>
          </View>
          
          <View style={styles.statusIndicator}>
            <MaterialCommunityIcons 
              name="lightbulb-on" 
              size={20} 
              color={running ? "#f1c40f" : "#7f8c8d"} 
            />
            <Text style={styles.statusText}>{running ? "UV On" : "UV Off"}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {!running ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={() => setShowConfirmation(true)}
            disabled={running}
          >
            <MaterialCommunityIcons name="play" size={24} color="white" />
            <Text style={styles.buttonText}>START CLEANING</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopCleaning}
          >
            <MaterialCommunityIcons name="stop" size={24} color="white" />
            <Text style={styles.buttonText}>STOP PROCESS</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmation}
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="robot-confused" size={48} color="#3498db" />
            <Text style={styles.modalTitle}>Confirm Auto-Clean</Text>
            <Text style={styles.modalText}>
              Start cleaning process for {selectedVeggie}? This will take {formatTime(timeRequired)}.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={startCleaning}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccess}
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="check-circle" size={60} color="#2ecc71" />
            <Text style={styles.modalTitle}>Cleaning Complete!</Text>
            <Text style={styles.modalText}>
              {selectedVeggie} has been cleaned successfully.
            </Text>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.successButton]}
              onPress={() => setShowSuccess(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BAB86C',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  veggieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  settingLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  rpmValue: {
    color: '#3498db',
    fontWeight: '600',
  },
  timerCard: {
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  timerLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  timerText: {
    color: 'white',
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButton: {
    backgroundColor: '#2ecc71',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#e9ecef',
  },
  confirmButton: {
    backgroundColor: '#3498db',
  },
  successButton: {
    backgroundColor: '#2ecc71',
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});