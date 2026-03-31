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
  View,
} from 'react-native';
import { DeviceCommands, sendCommand } from '../mqttService';

// ── Vegetable presets ─────────────────────────────────────────────────────────
// time in minutes, rpm calculated for 2.5 ft belt
const VEGGIE_DATA: Record<string, { minutes: number; rpm: number }> = {
  Tomato:      { minutes: 3.0,  rpm: 60 },
  Cucumber:    { minutes: 2.0,  rpm: 80 },
  Carrot:      { minutes: 2.5,  rpm: 70 },
  Lettuce:     { minutes: 3.33, rpm: 55 },
  'Bell Pepper':{ minutes: 2.16, rpm: 75 },
  Potato:      { minutes: 4.0,  rpm: 45 },
  Broccoli:    { minutes: 2.83, rpm: 62 },
  Cauliflower: { minutes: 3.16, rpm: 58 },
};

// Clamp RPM to Pi hardware range 0–120
const clampRpm = (v: number) => Math.min(120, Math.max(10, Math.round(v)));

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AutoCleanScreen() {
  const [selectedVeggie, setSelectedVeggie] = useState<string>('Tomato');
  const [running,        setRunning]        = useState(false);
  const [countdown,      setCountdown]      = useState(0);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [showSuccess,    setShowSuccess]    = useState(false);

  const preset     = VEGGIE_DATA[selectedVeggie];
  const totalSecs  = Math.round(preset.minutes * 60);
  const motorRpm   = clampRpm(preset.rpm);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    if (countdown <= 0) {
      setRunning(false);
      setShowSuccess(true);
      // Notify Pi: cleaning complete
      sendCommand('state', 'Cleaning completes. Collect Packet');
      DeviceCommands.uvOff();
      DeviceCommands.conveyorStop();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [running, countdown]);

  // ── Progress ──────────────────────────────────────────────────────────────
  const progress = totalSecs > 0 ? (totalSecs - countdown) / totalSecs : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const startCleaning = () => {
    setCountdown(totalSecs);
    setRunning(true);
    setShowConfirm(false);

    // Send sequence to Pi
    DeviceCommands.autoCleaning();
    sendCommand('vegetable', selectedVeggie);
    sendCommand('duration',  totalSecs);
    sendCommand('speed',     motorRpm);
    sendCommand('direction', 'FORWARD');
    DeviceCommands.uvOn();
    DeviceCommands.cleaningStart();
  };

  const stopCleaning = () => {
    setRunning(false);
    DeviceCommands.conveyorStop();
    DeviceCommands.uvOff();
    sendCommand('state', 'paused');
    Alert.alert('Process Paused', 'Cleaning has been paused.');
  };

  const resetProcess = () => {
    setRunning(false);
    setCountdown(0);
    setShowSuccess(false);
    setShowConfirm(false);
    DeviceCommands.machineOff();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="robot-industrial" size={34} color="#00D4FF" />
        <Text style={styles.title}>Auto-Clean</Text>
        <Text style={styles.subtitle}>Automated UV disinfection cycle</Text>
      </View>

      {/* Vegetable picker card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="food-apple" size={22} color="#00D4FF" />
          <Text style={styles.cardTitle}>Select Vegetable</Text>
        </View>

        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={selectedVeggie}
            onValueChange={(v) => setSelectedVeggie(v)}
            style={styles.picker}
            dropdownIconColor="#00D4FF"
            enabled={!running}
            itemStyle={{ color: '#E8F4FD' }}
          >
            {Object.keys(VEGGIE_DATA).map((v) => (
              <Picker.Item key={v} label={v} value={v} color="#E8F4FD" />
            ))}
          </Picker>
        </View>
      </View>

      {/* Operation settings */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="tune" size={22} color="#00D4FF" />
          <Text style={styles.cardTitle}>Operation Settings</Text>
        </View>

        {[
          { label: 'Cleaning Time',       value: formatTime(totalSecs),   color: '#FFB800' },
          { label: 'Motor Speed',         value: `${motorRpm} RPM`,       color: '#00FF9C' },
          { label: 'UV Sterilization',    value: 'Enabled',               color: '#00D4FF' },
          { label: 'Conveyor Direction',  value: 'Forward',               color: '#8B5CF6' },
        ].map((row, i) => (
          <View key={i} style={[styles.settingRow, i === 3 && { borderBottomWidth: 0 }]}>
            <Text style={styles.settingLabel}>{row.label}</Text>
            <Text style={[styles.settingValue, { color: row.color }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Timer card */}
      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>TIME REMAINING</Text>
        <Text style={styles.timerText}>{formatTime(countdown)}</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>
          {running
            ? `${Math.round(progress * 100)}% complete`
            : countdown === 0 && totalSecs > 0
            ? 'Ready to start'
            : 'Ready'}
        </Text>

        {/* Status badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, running && styles.badgeActive]}>
            <MaterialCommunityIcons
              name={running ? 'motion-sensor' : 'motion-sensor-off'}
              size={16}
              color={running ? '#00FF9C' : '#4A6080'}
            />
            <Text style={[styles.badgeText, running && { color: '#00FF9C' }]}>
              {running ? 'Running' : 'Stopped'}
            </Text>
          </View>

          <View style={[styles.badge, running && styles.badgeUV]}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={16}
              color={running ? '#00D4FF' : '#4A6080'}
            />
            <Text style={[styles.badgeText, running && { color: '#00D4FF' }]}>
              {running ? 'UV ON' : 'UV OFF'}
            </Text>
          </View>

          <View style={[styles.badge, running && styles.badgeConveyor]}>
            <MaterialCommunityIcons
              name="arrow-right-bold"
              size={16}
              color={running ? '#8B5CF6' : '#4A6080'}
            />
            <Text style={[styles.badgeText, running && { color: '#8B5CF6' }]}>
              {running ? 'Belt ON' : 'Belt OFF'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      {!running ? (
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => setShowConfirm(true)}
        >
          <MaterialCommunityIcons name="play-circle" size={24} color="#0A0E1A" />
          <Text style={styles.startBtnText}>START CLEANING</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.stopBtn} onPress={stopCleaning}>
          <MaterialCommunityIcons name="pause-circle" size={24} color="white" />
          <Text style={styles.stopBtnText}>PAUSE PROCESS</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.resetBtn} onPress={resetProcess}>
        <MaterialCommunityIcons name="restart" size={20} color="#8BA4C0" />
        <Text style={styles.resetBtnText}>RESET</Text>
      </TouchableOpacity>

      {/* ── Confirm Modal ── */}
      <Modal transparent animationType="fade" visible={showConfirm}
        onRequestClose={() => setShowConfirm(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="robot-excited" size={52} color="#00D4FF" />
            <Text style={styles.modalTitle}>Confirm Auto-Clean</Text>
            <Text style={styles.modalText}>
              Start UV cleaning cycle for {selectedVeggie}?{'\n'}
              Duration: {formatTime(totalSecs)}  ·  Speed: {motorRpm} RPM
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={startCleaning}>
                <Text style={styles.modalConfirmText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Success Modal ── */}
      <Modal transparent animationType="fade" visible={showSuccess}
        onRequestClose={() => setShowSuccess(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="check-circle" size={60} color="#00FF9C" />
            <Text style={styles.modalTitle}>Cleaning Complete!</Text>
            <Text style={styles.modalText}>
              {selectedVeggie} has been disinfected.{'\n'}Collect your vegetables.
            </Text>
            <TouchableOpacity
              style={[styles.modalConfirm, { width: '100%' }]}
              onPress={() => { setShowSuccess(false); resetProcess(); }}
            >
              <Text style={styles.modalConfirmText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A' },
  content:   { padding: 16, paddingBottom: 40 },

  header: { alignItems: 'center', paddingTop: 16, marginBottom: 24 },
  title:  { fontSize: 26, fontWeight: '800', color: '#E8F4FD', marginTop: 10 },
  subtitle: { fontSize: 13, color: '#8BA4C0', marginTop: 4 },

  card: {
    backgroundColor: '#141D35',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardTitle:  { fontSize: 16, fontWeight: '700', color: '#E8F4FD', marginLeft: 10 },

  pickerWrap: {
    borderWidth: 1,
    borderColor: '#1E2D4A',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0F1629',
  },
  picker: { height: 52, color: '#E8F4FD' },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2D4A',
  },
  settingLabel: { fontSize: 14, color: '#8BA4C0' },
  settingValue: { fontSize: 14, fontWeight: '700' },

  // Timer card
  timerCard: {
    backgroundColor: '#0F1629',
    borderRadius: 14,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  timerLabel: { fontSize: 11, fontWeight: '700', color: '#4A6080', letterSpacing: 2, marginBottom: 8 },
  timerText:  { fontSize: 56, fontWeight: '800', color: '#00D4FF', fontVariant: ['tabular-nums'] },

  progressTrack: {
    width: '100%', height: 4, backgroundColor: '#1E2D4A',
    borderRadius: 2, marginTop: 16, marginBottom: 6, overflow: 'hidden',
  },
  progressFill:  { height: '100%', backgroundColor: '#00D4FF', borderRadius: 2 },
  progressLabel: { fontSize: 11, color: '#4A6080', marginBottom: 16 },

  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#141D35', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#1E2D4A', gap: 5,
  },
  badgeActive:   { borderColor: '#00FF9C', backgroundColor: 'rgba(0,255,156,0.08)' },
  badgeUV:       { borderColor: '#00D4FF', backgroundColor: 'rgba(0,212,255,0.08)' },
  badgeConveyor: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.08)' },
  badgeText:     { fontSize: 11, fontWeight: '600', color: '#4A6080' },

  // Buttons
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#00D4FF', borderRadius: 12,
    paddingVertical: 16, marginBottom: 12, gap: 10,
  },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#0A0E1A' },

  stopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF3D5A', borderRadius: 12,
    paddingVertical: 16, marginBottom: 12, gap: 10,
  },
  stopBtnText: { fontSize: 16, fontWeight: '800', color: 'white' },

  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#141D35', borderRadius: 12,
    paddingVertical: 13, marginBottom: 8, gap: 8,
    borderWidth: 1, borderColor: '#1E2D4A',
  },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: '#8BA4C0' },

  // Modal
  modalBg:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: '#141D35', borderRadius: 20, padding: 28,
    alignItems: 'center', width: '86%',
    borderWidth: 1, borderColor: '#1E2D4A',
  },
  modalTitle:       { fontSize: 20, fontWeight: '700', color: '#E8F4FD', marginTop: 14, marginBottom: 8 },
  modalText:        { fontSize: 14, color: '#8BA4C0', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalBtns:        { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel:      { flex: 1, backgroundColor: '#0F1629', borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#1E2D4A' },
  modalCancelText:  { fontSize: 15, fontWeight: '600', color: '#8BA4C0' },
  modalConfirm:     { flex: 1, backgroundColor: '#00D4FF', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#0A0E1A' },
});
