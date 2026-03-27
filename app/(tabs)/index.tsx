import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { connectMQTT, DeviceCommands, PiSnapshot } from "../mqttService";
import { systemLog } from '../systemLogService';

const screenWidth = Dimensions.get('window').width;

// ── Helpers ───────────────────────────────────────────────────────────────────

const getStatusColor = (status: 'good' | 'warning' | 'bad') =>
  status === 'good' ? '#00FF9C' : status === 'warning' ? '#FFB800' : '#FF3D5A';

const getStatusIndicator = (status: 'good' | 'warning' | 'bad') => (
  <View style={[styles.statusIndicatorDot, { backgroundColor: getStatusColor(status) }]} />
);

const formatTimeAgo = (timestamp?: number) => {
  if (!timestamp) return '--';
  const diff    = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1)    return 'Just now';
  if (minutes < 60)   return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ── State badge colour map ─────────────────────────────────────────────────────
const STATE_COLOR: Record<string, string> = {
  "Idle":                                   '#4A6080',
  "Machine On":                             '#00FF9C',
  "Automatic Cleaning Mode selected":       '#00D4FF',
  "Manual Cleaning Mode selected":          '#FFB800',
  "UV Light Turned On":                     '#00D4FF',
  "UV Light Turned Off":                    '#4A6080',
  "Conveyor Running..":                     '#00FF9C',
  "Conveyor Stopped":                       '#4A6080',
  "paused":                                 '#FFB800',
  "error":                                  '#FF3D5A',
  "Checking System...":                     '#8B5CF6',
  "Restarting system...":                   '#FFB800',
  "Cleaning Started":                       '#00FF9C',
  "Cleaning completes. Collect Packet":     '#00FF9C',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();

  const [status,             setStatus]             = useState<PiSnapshot | null>(null);
  const [connected,          setConnected]           = useState(false);
  const [recentOperations,   setRecentOperations]    = useState<any[]>([]);
  const [rpmHistory,         setRpmHistory]          = useState<number[]>([0]);
  const [motorStatus,        setMotorStatus]         = useState<'good'|'warning'|'bad'>('good');
  const [uvStatus,           setUvStatus]            = useState<'good'|'warning'|'bad'>('bad');
  const [conveyorStatus,     setConveyorStatus]      = useState<'good'|'warning'|'bad'>('good');

  const rpmHistoryRef   = useRef<number[]>([0]);
  const MAX_HISTORY     = 20;

  // ── MQTT ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    connectMQTT(
      (data: PiSnapshot) => {
        setStatus(data);
        systemLog.logStatus(data);

        // RPM history for chart
        rpmHistoryRef.current = [
          ...rpmHistoryRef.current, data.motorRPM
        ].slice(-MAX_HISTORY);
        setRpmHistory([...rpmHistoryRef.current]);

        updateComponentStatuses(data);
      },
      () => {
        setConnected(true);
        systemLog.logConnection('MQTT Connected');
      }
    );

    // Recent operations from systemLog
    const logUnsub = systemLog.subscribe((logs) => {
      const ops = logs
        .filter((l: any) => l.type === 'operation' || l.type === 'command')
        .slice(0, 5)
        .map((l: any) => ({
          id:      l.id,
          title:   l.title,
          time:    formatTimeAgo(l.timestamp),
          details: l.message,
          type:    l.type,
        }));
      setRecentOperations(ops);
    });

    // Initial log load
    const initial = systemLog.getLogs(5)
      .filter((l: any) => l.type === 'operation' || l.type === 'command')
      .map((l: any) => ({
        id:      l.id,
        title:   l.title,
        time:    formatTimeAgo(l.timestamp),
        details: l.message,
        type:    l.type,
      }));
    setRecentOperations(initial);

    return () => { logUnsub(); };
  }, []);

  // ── Status evaluators ──────────────────────────────────────────────────────

  const updateComponentStatuses = (data: PiSnapshot) => {
    // Motor: 0–120 RPM
    if (data.motorRPM === 0)         setMotorStatus('good');
    else if (data.motorRPM <= 100)   setMotorStatus('good');
    else if (data.motorRPM <= 115)   setMotorStatus('warning');
    else                             setMotorStatus('bad');

    // UV
    setUvStatus(data.uvActive ? 'good' : 'bad');

    // Conveyor
    setConveyorStatus(
      data.conveyorDirection === 'STOP' ? 'good' :
      data.conveyorDirection === 'FORWARD' ? 'good' : 'warning'
    );
  };

  // ── Command helpers ────────────────────────────────────────────────────────

  const handleCommand = (label: string, fn: () => void) => {
    fn();
    systemLog.logCommand(label, { timestamp: Date.now() });
  };

  // ── Chart data ─────────────────────────────────────────────────────────────

  const chartData = {
    labels: rpmHistory.map((_, i) =>
      rpmHistory.length <= 5 || i % 4 === 0 ? `${i + 1}` : ''
    ),
    datasets: [{
      data:        rpmHistory.length > 0 ? rpmHistory : [0],
      color:       (opacity = 1) => `rgba(0, 212, 255, ${opacity})`,
      strokeWidth: 2,
    }],
  };

  // ── State badge ────────────────────────────────────────────────────────────

  const stateColor  = STATE_COLOR[status?.deviceState ?? 'Idle'] ?? '#4A6080';
  const stateLabel  = status?.deviceState ?? 'Idle';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Connection banner ── */}
      <View style={[
        styles.connectionBanner,
        { borderColor: connected ? '#00FF9C' : '#FF3D5A' }
      ]}>
        <View style={[
          styles.connectionDot,
          { backgroundColor: connected ? '#00FF9C' : '#FF3D5A' }
        ]} />
        <Text style={[
          styles.connectionText,
          { color: connected ? '#00FF9C' : '#FF3D5A' }
        ]}>
          {connected ? 'DEVICE CONNECTED  ·  192.168.4.1' : 'NOT CONNECTED'}
        </Text>
      </View>

      {/* ── Device state badge ── */}
      <View style={[styles.stateBadge, { borderColor: stateColor }]}>
        <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
        <Text style={[styles.stateText, { color: stateColor }]}>
          {stateLabel.toUpperCase()}
        </Text>
        {status && (
          <Text style={styles.stateTime}>
            {formatTimeAgo(status.lastUpdate)}
          </Text>
        )}
      </View>

      {/* ── Quick Actions ── */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCommand("Machine On", DeviceCommands.machineOn)}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(0,255,156,0.15)' }]}>
            <MaterialCommunityIcons name="power" size={28} color="#00FF9C" />
          </View>
          <Text style={styles.actionText}>Power On</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCommand("Machine Off", DeviceCommands.machineOff)}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,61,90,0.15)' }]}>
            <MaterialCommunityIcons name="power-off" size={28} color="#FF3D5A" />
          </View>
          <Text style={styles.actionText}>Power Off</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCommand("Auto Clean", () => {
            DeviceCommands.autoCleaning();
            router.push('/autoclean');
          })}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(0,212,255,0.15)' }]}>
            <MaterialCommunityIcons name="play-circle" size={28} color="#00D4FF" />
          </View>
          <Text style={styles.actionText}>Auto Clean</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCommand("Restart", DeviceCommands.restart)}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,184,0,0.15)' }]}>
            <MaterialCommunityIcons name="restart" size={28} color="#FFB800" />
          </View>
          <Text style={styles.actionText}>Restart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCommand("UV On", DeviceCommands.uvOn)}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(0,212,255,0.15)' }]}>
            <MaterialCommunityIcons name="lightbulb-on" size={28} color="#00D4FF" />
          </View>
          <Text style={styles.actionText}>UV On</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCommand("E-Stop", DeviceCommands.estop)}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,61,90,0.15)' }]}>
            <MaterialCommunityIcons name="alert-octagon" size={28} color="#FF3D5A" />
          </View>
          <Text style={styles.actionText}>E-Stop</Text>
        </TouchableOpacity>

      </View>

      {/* ── Status Cards ── */}
      <Text style={styles.sectionTitle}>Device Status</Text>
      <View style={styles.statusGrid}>

        {/* Motor */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconWrap, { backgroundColor: 'rgba(0,212,255,0.1)' }]}>
            <MaterialCommunityIcons name="engine" size={26} color="#00D4FF" />
          </View>
          <Text style={styles.statusCardTitle}>Motor</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusValue, { color: getStatusColor(motorStatus) }]}>
              {status?.motorRPM ?? 0}
            </Text>
            {getStatusIndicator(motorStatus)}
          </View>
          <Text style={styles.statusUnit}>RPM</Text>
          <Text style={styles.statusSub}>
            {status?.conveyorDirection ?? 'STOP'}
          </Text>
        </View>

        {/* UV Lamp */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconWrap, { backgroundColor: 'rgba(0,212,255,0.1)' }]}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={26} color="#00D4FF" />
          </View>
          <Text style={styles.statusCardTitle}>UV Lamp</Text>
          <View style={styles.statusRow}>
            <Text style={[
              styles.statusValue,
              { color: status?.uvActive ? '#00D4FF' : '#4A6080' }
            ]}>
              {status?.uvActive ? 'ON' : 'OFF'}
            </Text>
            {getStatusIndicator(uvStatus)}
          </View>
          <Text style={styles.statusUnit}>UV-C</Text>
          <Text style={styles.statusSub}>Disinfection</Text>
        </View>

        {/* Session Timer */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconWrap, { backgroundColor: 'rgba(255,184,0,0.1)' }]}>
            <MaterialCommunityIcons name="timer-outline" size={26} color="#FFB800" />
          </View>
          <Text style={styles.statusCardTitle}>Timer</Text>
          <Text style={[styles.statusValue, { color: '#FFB800', fontSize: 20 }]}>
            {formatDuration(status?.elapsedSeconds ?? 0)}
          </Text>
          <Text style={styles.statusUnit}>elapsed</Text>
          <Text style={styles.statusSub}>
            /{formatDuration(status?.targetDuration ?? 0)}
          </Text>
        </View>

        {/* Cycles */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconWrap, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
            <MaterialCommunityIcons name="rotate-right" size={26} color="#8B5CF6" />
          </View>
          <Text style={styles.statusCardTitle}>Cycles</Text>
          <Text style={[styles.statusValue, { color: '#8B5CF6' }]}>
            {status?.cycleCount ?? 0}
          </Text>
          <Text style={styles.statusUnit}>completed</Text>
          <Text style={styles.statusSub}>
            {status?.vegetableType ?? 'Not Set'}
          </Text>
        </View>

      </View>

      {/* ── Network info strip ── */}
      <View style={styles.networkStrip}>
        {[
          { label: 'IP',   value: status?.deviceIp    ?? '—'     },
          { label: 'MQTT', value: status?.mqttConnected ? 'Online' : 'Offline' },
          { label: 'WiFi', value: status?.wifiConnected ? 'Online' : 'Offline' },
          { label: 'TEMP', value: status?.cpuTemp ? `${status.cpuTemp.toFixed(1)}°C` : '—' },
        ].map((item) => (
          <View key={item.label} style={styles.networkItem}>
            <Text style={styles.networkLabel}>{item.label}</Text>
            <Text style={styles.networkValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* ── RPM Chart ── */}
      <Text style={styles.sectionTitle}>Motor RPM History</Text>
      <View style={styles.chartCard}>
        <LineChart
          data={chartData}
          width={screenWidth - 64}
          height={160}
          chartConfig={{
            backgroundColor:      '#0F1629',
            backgroundGradientFrom:'#0F1629',
            backgroundGradientTo:  '#141D35',
            decimalPlaces:         0,
            color:       (opacity = 1) => `rgba(0, 212, 255, ${opacity})`,
            labelColor:  (opacity = 1) => `rgba(139, 164, 192, ${opacity})`,
            propsForDots: { r: '3', strokeWidth: '1', stroke: '#00D4FF' },
            propsForBackgroundLines: { stroke: '#1E2D4A', strokeDasharray: '' },
          }}
          bezier
          withShadow={false}
          style={styles.chart}
          yAxisSuffix=" rpm"
          fromZero
        />
        <View style={styles.chartLegend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Conveyor Speed (RPM)</Text>
        </View>
      </View>

      {/* ── Recent Operations ── */}
      <Text style={styles.sectionTitle}>Recent Operations</Text>
      {recentOperations.length > 0 ? (
        <FlatList
          data={recentOperations}
          scrollEnabled={false}
          keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
          renderItem={({ item }) => (
            <View style={styles.opItem}>
              <View style={[
                styles.opIconWrap,
                { backgroundColor: item.type === 'command' ? 'rgba(0,212,255,0.1)' : 'rgba(0,255,156,0.1)' }
              ]}>
                <MaterialCommunityIcons
                  name={
                    item.title?.includes('Command') ? 'console-line' :
                    item.title?.includes('Status')  ? 'chart-line'   :
                    item.title?.includes('Error')   ? 'alert-circle' : 'cog-outline'
                  }
                  size={22}
                  color={item.type === 'command' ? '#00D4FF' : '#00FF9C'}
                />
              </View>
              <View style={styles.opDetails}>
                <Text style={styles.opTitle}>{item.title}</Text>
                <Text style={styles.opTime}>{item.time}</Text>
                <Text style={styles.opDesc} numberOfLines={1}>{item.details}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#4A6080" />
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="history" size={44} color="#1E2D4A" />
          <Text style={styles.emptyText}>No operations yet</Text>
          <Text style={styles.emptySub}>Actions will appear here</Text>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    paddingHorizontal: 16,
  },

  // Connection banner
  connectionBanner: {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1,
    borderRadius:   10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop:      16,
    marginBottom:   10,
    backgroundColor: '#0F1629',
  },
  connectionDot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 8,
  },
  connectionText: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
  },

  // State badge
  stateBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1,
    borderRadius:   10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom:   20,
    backgroundColor: '#0F1629',
  },
  stateDot: {
    width: 10, height: 10, borderRadius: 5, marginRight: 8,
  },
  stateText: {
    fontSize: 12, fontWeight: '800', letterSpacing: 1, flex: 1,
  },
  stateTime: {
    fontSize: 10, color: '#4A6080',
  },

  // Section title
  sectionTitle: {
    fontSize:     16,
    fontWeight:   '700',
    color:        '#E8F4FD',
    marginBottom: 12,
    marginTop:    4,
  },

  // Quick actions grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    justifyContent:'space-between',
    marginBottom:  20,
  },
  actionButton: {
    width:           '31%',
    backgroundColor: '#141D35',
    padding:         14,
    borderRadius:    12,
    marginBottom:    10,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     '#1E2D4A',
  },
  actionIcon: {
    width:         52,
    height:        52,
    borderRadius:  26,
    justifyContent:'center',
    alignItems:    'center',
    marginBottom:  8,
  },
  actionText: {
    fontSize:   11,
    fontWeight: '600',
    color:      '#8BA4C0',
    textAlign:  'center',
  },

  // Status grid
  statusGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    justifyContent:'space-between',
    marginBottom:  16,
  },
  statusCard: {
    width:           '48%',
    backgroundColor: '#141D35',
    padding:         14,
    borderRadius:    12,
    marginBottom:    12,
    borderWidth:     1,
    borderColor:     '#1E2D4A',
  },
  statusIconWrap: {
    width:         44,
    height:        44,
    borderRadius:  22,
    justifyContent:'center',
    alignItems:    'center',
    marginBottom:  10,
  },
  statusCardTitle: {
    fontSize:     13,
    fontWeight:   '600',
    color:        '#8BA4C0',
    marginBottom:  4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent:'space-between',
  },
  statusValue: {
    fontSize:   22,
    fontWeight: '800',
    color:      '#E8F4FD',
  },
  statusIndicatorDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  statusUnit: {
    fontSize:  10,
    color:     '#4A6080',
    marginTop:  2,
    fontWeight:'700',
    letterSpacing: 0.8,
  },
  statusSub: {
    fontSize:  11,
    color:     '#8BA4C0',
    marginTop:  4,
  },

  // Network strip
  networkStrip: {
    flexDirection:  'row',
    backgroundColor:'#0F1629',
    borderRadius:   12,
    borderWidth:    1,
    borderColor:    '#1E2D4A',
    marginBottom:   20,
    overflow:       'hidden',
  },
  networkItem: {
    flex:           1,
    alignItems:     'center',
    paddingVertical:12,
    borderRightWidth: 1,
    borderRightColor: '#1E2D4A',
  },
  networkLabel: {
    fontSize:  9,
    color:     '#4A6080',
    fontWeight:'700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  networkValue: {
    fontSize:  12,
    color:     '#00D4FF',
    fontWeight:'700',
  },

  // Chart
  chartCard: {
    backgroundColor: '#141D35',
    borderRadius:    12,
    padding:         16,
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     '#1E2D4A',
  },
  chart: {
    borderRadius: 8,
    marginLeft:   -8,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent:'center',
    marginTop:     10,
  },
  legendDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#00D4FF', marginRight: 6,
  },
  legendText: {
    fontSize: 12, color: '#8BA4C0',
  },

  // Operations
  opItem: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor:'#141D35',
    padding:        14,
    borderRadius:   12,
    marginBottom:   8,
    borderWidth:    1,
    borderColor:    '#1E2D4A',
  },
  opIconWrap: {
    width:         40,
    height:        40,
    borderRadius:  20,
    justifyContent:'center',
    alignItems:    'center',
    marginRight:   12,
  },
  opDetails: {
    flex: 1,
  },
  opTitle: {
    fontSize:   14,
    fontWeight: '600',
    color:      '#E8F4FD',
    marginBottom: 2,
  },
  opTime: {
    fontSize: 11, color: '#4A6080',
  },
  opDesc: {
    fontSize: 11, color: '#8BA4C0', marginTop: 2,
  },

  // Empty state
  emptyState: {
    alignItems:     'center',
    justifyContent: 'center',
    padding:        40,
    backgroundColor:'#141D35',
    borderRadius:   12,
    borderWidth:    1,
    borderColor:    '#1E2D4A',
  },
  emptyText: {
    fontSize:   15,
    fontWeight: '600',
    color:      '#4A6080',
    marginTop:  12,
  },
  emptySub: {
    fontSize: 12, color: '#1E2D4A', marginTop: 4,
  },
});