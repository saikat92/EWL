import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Helper function to format time
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ManualCleanScreen() {
  const [motorSpeed, setMotorSpeed] = useState('75');
  const [motorRunning, setMotorRunning] = useState(false);
  const [uvOn, setUvOn] = useState(false);
  const [motorTime, setMotorTime] = useState(0);
  const [uvTime, setUvTime] = useState(0);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showConfirmStop, setShowConfirmStop] = useState(false);
  const [rpmInputFocused, setRpmInputFocused] = useState(false);

  // Timer effects
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (motorRunning) {
      timer = setTimeout(() => setMotorTime(motorTime + 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [motorRunning, motorTime]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (uvOn) {
      timer = setTimeout(() => setUvTime(uvTime + 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [uvOn, uvTime]);

  const handleRpmChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText === '' || (parseInt(numericText) >= 10 && parseInt(numericText) <= 1800)) {
      setMotorSpeed(numericText);
    }
  };

  const toggleMotor = () => {
    if (motorRunning) {
      setShowConfirmStop(true);
    } else {
      setMotorRunning(true);
    }
  };

  const toggleUV = () => {
    setUvOn(!uvOn);
  };

  const handleEmergencyStop = () => {
    setMotorRunning(false);
    setUvOn(false);
    setShowEmergencyModal(false);
    Alert.alert("Emergency Stop", "All operations have been stopped.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="hand-pointing-right" size={32} color="#3498db" />
        <Text style={styles.title}>Manual Cleaning</Text>
        <Text style={styles.subtitle}>Full control over cleaning parameters</Text>
      </View>

      {/* Motor Control Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="engine" size={24} color="#3498db" />
          <Text style={styles.cardTitle}>Motor Control</Text>
        </View>
        
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Motor Speed (RPM)</Text>
          <Text style={styles.rpmValue}>{motorSpeed} RPM</Text>
        </View>
        
        {/* RPM Input Field */}
        <View style={[styles.inputContainer, rpmInputFocused && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            value={motorSpeed}
            onChangeText={handleRpmChange}
            keyboardType="number-pad"
            placeholder="10 - 1800"
            onFocus={() => setRpmInputFocused(true)}
            onBlur={() => setRpmInputFocused(false)}
            editable={!motorRunning}
          />
          <Text style={styles.rpmUnit}>RPM</Text>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              motorRunning ? styles.toggleButtonOn : styles.toggleButtonOff,
              motorRunning && { backgroundColor: '#2ecc71' }
            ]}
            onPress={toggleMotor}
            disabled={showEmergencyModal}
          >
            <MaterialCommunityIcons 
              name={motorRunning ? "motion-sensor" : "motion-off"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.toggleButtonText}>
              {motorRunning ? "RUNNING" : "START MOTOR"}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons name="timer" size={20} color="#7f8c8d" />
            <Text style={styles.timerText}>{formatTime(motorTime)}</Text>
          </View>
        </View>
      </View>

      {/* UV Lamp Control Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="lightbulb-on" size={24} color="#3498db" />
          <Text style={styles.cardTitle}>UV Lamp Control</Text>
        </View>
        
        <View style={styles.uvStatus}>
          <MaterialCommunityIcons 
            name={uvOn ? "lightbulb-on" : "lightbulb-off"} 
            size={40} 
            color={uvOn ? "#f1c40f" : "#bdc3c7"} 
          />
          <Text style={[styles.uvStatusText, uvOn && { color: "#f1c40f" }]}>
            {uvOn ? "UV LAMP ACTIVE" : "UV LAMP INACTIVE"}
          </Text>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              uvOn ? styles.toggleButtonOn : styles.toggleButtonOff,
              uvOn && { backgroundColor: '#f1c40f' }
            ]}
            onPress={toggleUV}
            disabled={showEmergencyModal}
          >
            <MaterialCommunityIcons 
              name={uvOn ? "power-plug" : "power-plug-off"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.toggleButtonText}>
              {uvOn ? "TURN OFF" : "TURN ON"}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons name="timer" size={20} color="#7f8c8d" />
            <Text style={styles.timerText}>{formatTime(uvTime)}</Text>
          </View>
        </View>
      </View>

      {/* Emergency Stop Section */}
      <View style={styles.emergencySection}>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => setShowEmergencyModal(true)}
        >
          <MaterialCommunityIcons name="alert-octagon" size={32} color="white" />
          <Text style={styles.emergencyText}>EMERGENCY STOP</Text>
        </TouchableOpacity>
        <Text style={styles.emergencyHint}>Press only in critical situations</Text>
      </View>

      {/* Status Indicators */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <MaterialCommunityIcons 
              name="engine" 
              size={24} 
              color={motorRunning ? "#2ecc71" : "#e74c3c"} 
            />
            <Text style={styles.statusLabel}>Motor</Text>
            <Text style={styles.statusValue}>
              {motorRunning ? "Running" : "Stopped"}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <MaterialCommunityIcons 
              name="lightbulb-on" 
              size={24} 
              color={uvOn ? "#f1c40f" : "#7f8c8d"} 
            />
            <Text style={styles.statusLabel}>UV Lamp</Text>
            <Text style={styles.statusValue}>
              {uvOn ? "Active" : "Inactive"}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <MaterialCommunityIcons 
              name="shield-check" 
              size={24} 
              color="#2ecc71" 
            />
            <Text style={styles.statusLabel}>System</Text>
            <Text style={styles.statusValue}>
              {showEmergencyModal ? "Emergency" : "Normal"}
            </Text>
          </View>
        </View>
      </View>

      {/* Emergency Stop Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showEmergencyModal}
        onRequestClose={() => setShowEmergencyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="alert-octagon" size={60} color="#e74c3c" />
            <Text style={styles.modalTitle}>EMERGENCY STOP</Text>
            <Text style={styles.modalText}>
              This will immediately stop all operations. Are you sure you want to proceed?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEmergencyModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.emergencyModalButton]}
                onPress={handleEmergencyStop}
              >
                <Text style={styles.modalButtonText}>Confirm Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Motor Stop Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmStop}
        onRequestClose={() => setShowConfirmStop(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="engine-off" size={60} color="#3498db" />
            <Text style={styles.modalTitle}>Stop Motor?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to stop the motor?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmStop(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setMotorRunning(false);
                  setShowConfirmStop(false);
                }}
              >
                <Text style={styles.modalButtonText}>Stop Motor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  rpmValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 50,
  },
  inputFocused: {
    borderColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  rpmUnit: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: '60%',
  },
  toggleButtonOn: {
    backgroundColor: '#2ecc71',
  },
  toggleButtonOff: {
    backgroundColor: '#3498db',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  uvStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  uvStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 8,
  },
  emergencySection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  emergencyHint: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statusCard: {
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 2,
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
  emergencyModalButton: {
    backgroundColor: '#e74c3c',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});