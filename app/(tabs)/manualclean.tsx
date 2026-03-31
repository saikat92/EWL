import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ManualCleanScreen() {
  const [rpm,             setRpm]             = useState(60);
  const [direction,       setDirection]       = useState<'FORWARD' | 'BACKWARD'>('FORWARD');
  const [conveyorOn,      setConveyorOn]      = useState(false);
  const [uvOn,            setUvOn]            = useState(false);
  const [conveyorTime,    setConveyorTime]    = useState(0);
  const [uvTime,          setUvTime]          = useState(0);
  const [showEstop,       setShowEstop]       = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  // ── Timers ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conveyorOn) return;
    const t = setTimeout(() => setConveyorTime((v) => v + 1), 1000);
    return () => clearTimeout(t);
  }, [conveyorOn, conveyorTime]);

  useEffect(() => {
    if (!uvOn) return;
    const t = setTimeout(() => setUvTime((v) => v + 1), 1000);
    return () => clearTimeout(t);
  }, [uvOn, uvTime]);

  // ── MQTT actions ──────────────────────────────────────────────────────────

  const toggleConveyor = () => {
    if (conveyorOn) {
      setShowStopConfirm(true);
    } else {
      setConveyorOn(true);
      DeviceCommands.manualCleaning();
      sendCommand('direction', direction);
      sendCommand('speed', rpm);
      DeviceCommands.conveyorStart();
    }
  };

  const confirmStopConveyor = () => {
    setConveyorOn(false);
    setShowStopConfirm(false);
    DeviceCommands.conveyorStop();
    sendCommand('speed', 0);
  };

  const toggleUV = () => {
    const next = !uvOn;
    setUvOn(next);
    if (next) {
      DeviceCommands.uvOn();
    } else {
      DeviceCommands.uvOff();
    }
  };

  const applySpeed = () => {
    if (conveyorOn) {
      sendCommand('speed', rpm);
    }
  };

  const setConveyorDirection = (dir: 'FORWARD' | 'BACKWARD') => {
    setDirection(dir);
    if (conveyorOn) {
      sendCommand('direction', dir);
    }
  };

  const handleEmergencyStop = () => {
    setConveyorOn(false);
    setUvOn(false);
    setShowEstop(false);
    DeviceCommands.estop();
    Alert.alert('Emergency Stop', 'All operations halted.');
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
        <MaterialCommunityIcons name="hand-pointing-right" size={34} color="#FFB800" />
        <Text style={styles.title}>Manual Control</Text>
        <Text style={styles.subtitle}>Direct control over all device parameters</Text>
      </View>

      {/* ── UV Lamp Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={22} color="#00D4FF" />
          <Text style={styles.cardTitle}>UV-C Lamp</Text>
          <View style={[styles.liveBadge, uvOn && styles.liveBadgeOn]}>
            <View style={[styles.liveDot, uvOn && styles.liveDotOn]} />
            <Text style={[styles.liveText, uvOn && { color: '#00D4FF' }]}>
              {uvOn ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {/* UV glow indicator */}
        <View style={[styles.uvGlow, uvOn && styles.uvGlowOn]}>
          <MaterialCommunityIcons
            name={uvOn ? 'lightbulb-on' : 'lightbulb-off-outline'}
            size={48}
            color={uvOn ? '#00D4FF' : '#1E2D4A'}
          />
          <Text style={[styles.uvGlowText, uvOn && { color: '#00D4FF' }]}>
            {uvOn ? 'UV LAMP ACTIVE' : 'UV LAMP OFF'}
          </Text>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlBtn, uvOn && styles.controlBtnActive]}
            onPress={toggleUV}
            disabled={showEstop}
          >
            <MaterialCommunityIcons
              name={uvOn ? 'power-plug-off' : 'power-plug'}
              size={20}
              color={uvOn ? '#0A0E1A' : '#00D4FF'}
            />
            <Text style={[styles.controlBtnText, uvOn && { color: '#0A0E1A' }]}>
              {uvOn ? 'TURN OFF' : 'TURN ON'}
            </Text>
          </TouchableOpacity>

          <View style={styles.timerBadge}>
            <MaterialCommunityIcons name="timer-outline" size={16} color="#4A6080" />
            <Text style={styles.timerBadgeText}>{formatTime(uvTime)}</Text>
          </View>
        </View>
      </View>

      {/* ── Conveyor Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="arrow-right-bold-box" size={22} color="#00FF9C" />
          <Text style={styles.cardTitle}>Conveyor Belt</Text>
          <View style={[styles.liveBadge, conveyorOn && styles.liveBadgeConveyor]}>
            <View style={[styles.liveDot, conveyorOn && styles.liveDotConveyor]} />
            <Text style={[styles.liveText, conveyorOn && { color: '#00FF9C' }]}>
              {conveyorOn ? direction : 'STOPPED'}
            </Text>
          </View>
        </View>

        {/* Speed slider */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Motor Speed</Text>
            <Text style={styles.sliderValue}>{rpm} RPM</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={120}
            step={1}
            value={rpm}
            onValueChange={(v) => setRpm(Math.round(v))}
            onSlidingComplete={applySpeed}
            minimumTrackTintColor="#00FF9C"
            maximumTrackTintColor="#1E2D4A"
            thumbTintColor="#00FF9C"
            disabled={!conveyorOn}
          />
          <View style={styles.sliderRange}>
            <Text style={styles.sliderRangeText}>10 RPM</Text>
            <Text style={styles.sliderRangeText}>120 RPM</Text>
          </View>
        </View>

        {/* Direction selector */}
        <View style={styles.directionRow}>
          <TouchableOpacity
            style={[styles.dirBtn, direction === 'FORWARD' && styles.dirBtnActive]}
            onPress={() => setConveyorDirection('FORWARD')}
          >
            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color={direction === 'FORWARD' ? '#0A0E1A' : '#8BA4C0'}
            />
            <Text style={[styles.dirBtnText, direction === 'FORWARD' && { color: '#0A0E1A' }]}>
              Forward
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dirBtn, direction === 'BACKWARD' && styles.dirBtnReverse]}
            onPress={() => setConveyorDirection('BACKWARD')}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={direction === 'BACKWARD' ? '#0A0E1A' : '#8BA4C0'}
            />
            <Text style={[styles.dirBtnText, direction === 'BACKWARD' && { color: '#0A0E1A' }]}>
              Reverse
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlBtn, conveyorOn && styles.controlBtnStop]}
            onPress={toggleConveyor}
            disabled={showEstop}
          >
            <MaterialCommunityIcons
              name={conveyorOn ? 'stop-circle' : 'play-circle'}
              size={20}
              color={conveyorOn ? 'white' : '#00FF9C'}
            />
            <Text style={[
              styles.controlBtnText,
              conveyorOn ? { color: 'white' } : { color: '#00FF9C' },
            ]}>
              {conveyorOn ? 'STOP BELT' : 'START BELT'}
            </Text>
          </TouchableOpacity>

          <View style={styles.timerBadge}>
            <MaterialCommunityIcons name="timer-outline" size={16} color="#4A6080" />
            <Text style={styles.timerBadgeText}>{formatTime(conveyorTime)}</Text>
          </View>
        </View>
      </View>

      {/* ── Status summary ── */}
      <View style={styles.summaryCard}>
        {[
          { label: 'UV Lamp',   value: uvOn ? 'ON' : 'OFF',        color: uvOn ? '#00D4FF' : '#4A6080' },
          { label: 'Conveyor',  value: conveyorOn ? 'ON' : 'OFF',  color: conveyorOn ? '#00FF9C' : '#4A6080' },
          { label: 'Speed',     value: `${rpm} RPM`,               color: '#FFB800' },
          { label: 'Direction', value: direction,                   color: '#8B5CF6' },
        ].map((item, i) => (
          <View key={i} style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{item.label}</Text>
            <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* ── Emergency Stop ── */}
      <TouchableOpacity
        style={styles.estopBtn}
        onPress={() => setShowEstop(true)}
      >
        <MaterialCommunityIcons name="alert-octagon" size={24} color="white" />
        <Text style={styles.estopText}>EMERGENCY STOP</Text>
      </TouchableOpacity>
      <Text style={styles.estopHint}>Immediately halts all motors and UV lamp</Text>

      {/* ── Stop Conveyor Confirm Modal ── */}
      <Modal transparent animationType="fade" visible={showStopConfirm}
        onRequestClose={() => setShowStopConfirm(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="stop-circle-outline" size={48} color="#FFB800" />
            <Text style={styles.modalTitle}>Stop Conveyor?</Text>
            <Text style={styles.modalText}>The conveyor belt will stop moving.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowStopConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalWarn} onPress={confirmStopConveyor}>
                <Text style={styles.modalWarnText}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Emergency Modal ── */}
      <Modal transparent animationType="fade" visible={showEstop}
        onRequestClose={() => setShowEstop(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-octagon" size={56} color="#FF3D5A" />
            <Text style={styles.modalTitle}>Emergency Stop</Text>
            <Text style={styles.modalText}>
              This will immediately halt the conveyor and UV lamp. Confirm?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowEstop(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalEstop} onPress={handleEmergencyStop}>
                <Text style={styles.modalEstopText}>STOP ALL</Text>
              </TouchableOpacity>
            </View>
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

  header:   { alignItems: 'center', paddingTop: 16, marginBottom: 24 },
  title:    { fontSize: 26, fontWeight: '800', color: '#E8F4FD', marginTop: 10 },
  subtitle: { fontSize: 13, color: '#8BA4C0', marginTop: 4 },

  card: {
    backgroundColor: '#141D35',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#E8F4FD', flex: 1 },

  liveBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F1629', borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10, gap: 5,
    borderWidth: 1, borderColor: '#1E2D4A',
  },
  liveBadgeOn:      { borderColor: '#00D4FF', backgroundColor: 'rgba(0,212,255,0.08)' },
  liveBadgeConveyor:{ borderColor: '#00FF9C', backgroundColor: 'rgba(0,255,156,0.08)' },
  liveDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4A6080' },
  liveDotOn:        { backgroundColor: '#00D4FF' },
  liveDotConveyor:  { backgroundColor: '#00FF9C' },
  liveText:         { fontSize: 10, fontWeight: '700', color: '#4A6080', letterSpacing: 0.5 },

  uvGlow: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0F1629', borderRadius: 12,
    paddingVertical: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#1E2D4A',
  },
  uvGlowOn:   { borderColor: '#00D4FF', backgroundColor: 'rgba(0,212,255,0.06)' },
  uvGlowText: { fontSize: 13, fontWeight: '700', color: '#4A6080', marginTop: 8 },

  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  controlBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#00D4FF',
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20,
    flex: 1, marginRight: 12, justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: '#00D4FF', borderColor: '#00D4FF' },
  controlBtnStop:   { backgroundColor: '#FF3D5A', borderColor: '#FF3D5A' },
  controlBtnText:   { fontSize: 13, fontWeight: '700', color: '#00D4FF' },

  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timerBadgeText: { fontSize: 15, color: '#8BA4C0', fontVariant: ['tabular-nums'] },

  // Slider
  sliderSection: { marginBottom: 16 },
  sliderHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sliderLabel:   { fontSize: 13, color: '#8BA4C0' },
  sliderValue:   { fontSize: 14, fontWeight: '700', color: '#00FF9C' },
  slider:        { width: '100%', height: 36 },
  sliderRange:   { flexDirection: 'row', justifyContent: 'space-between' },
  sliderRangeText: { fontSize: 10, color: '#4A6080' },

  // Direction
  directionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  dirBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11,
    borderRadius: 10, borderWidth: 1, borderColor: '#1E2D4A',
    backgroundColor: '#0F1629',
  },
  dirBtnActive:  { backgroundColor: '#00FF9C', borderColor: '#00FF9C' },
  dirBtnReverse: { backgroundColor: '#FFB800', borderColor: '#FFB800' },
  dirBtnText:    { fontSize: 13, fontWeight: '600', color: '#8BA4C0' },

  // Summary
  summaryCard: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: '#0F1629', borderRadius: 14,
    borderWidth: 1, borderColor: '#1E2D4A',
    marginBottom: 20, overflow: 'hidden',
  },
  summaryItem: {
    width: '50%', padding: 14,
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#1E2D4A',
  },
  summaryLabel: { fontSize: 10, color: '#4A6080', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '800' },

  // E-stop
  estopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF3D5A', borderRadius: 12,
    paddingVertical: 18, gap: 10, marginBottom: 8,
  },
  estopText: { fontSize: 17, fontWeight: '800', color: 'white' },
  estopHint: { textAlign: 'center', fontSize: 11, color: '#4A6080', marginBottom: 8 },

  // Modal
  modalBg:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: '#141D35', borderRadius: 20, padding: 28,
    alignItems: 'center', width: '86%',
    borderWidth: 1, borderColor: '#1E2D4A',
  },
  modalTitle:      { fontSize: 20, fontWeight: '700', color: '#E8F4FD', marginTop: 14, marginBottom: 8 },
  modalText:       { fontSize: 14, color: '#8BA4C0', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalBtns:       { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel:     { flex: 1, backgroundColor: '#0F1629', borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#1E2D4A' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#8BA4C0' },
  modalWarn:       { flex: 1, backgroundColor: '#FFB800', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  modalWarnText:   { fontSize: 15, fontWeight: '700', color: '#0A0E1A' },
  modalEstop:      { flex: 1, backgroundColor: '#FF3D5A', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  modalEstopText:  { fontSize: 15, fontWeight: '800', color: 'white' },
});
