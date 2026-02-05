import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { connectMQTT, sendCommand } from "../mqttService";
import { systemLog } from '../systemLogService';

interface StatusData {
  state?: string;
  motorRPM?: number;
  uvStatus?: boolean;
  waterLevel?: number;
  conveyorStatus?: boolean;
  temperature?: number;
  lastUpdate?: number;
}

const screenWidth = Dimensions.get('window').width;
const router = useRouter();

// Helper function for status indicator
const getStatusIndicator = (status: string) => {
  const color = status === 'good' ? '#2ecc71' : 
                status === 'warning' ? '#f39c12' : '#e74c3c';
  return <View style={[styles.statusIndicator, { backgroundColor: color }]} />;
};

// Format time for display
const formatTimeAgo = (timestamp?: number) => {
  if (!timestamp) return '--';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
};

export default function DashboardScreen() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [connected, setConnected] = useState(false);
  const [recentOperations, setRecentOperations] = useState<any[]>([]);
  const [rpmHistory, setRpmHistory] = useState<number[]>([]);
  const [motorStatus, setMotorStatus] = useState<'good' | 'warning' | 'bad'>('good');
  const [uvStatus, setUvStatus] = useState<'good' | 'warning' | 'bad'>('good');
  const [waterSystemStatus, setWaterSystemStatus] = useState<'good' | 'warning' | 'bad'>('good');
  
  // Refs for history tracking
  const rpmHistoryRef = useRef<number[]>([]);
  const maxHistoryLength = 20;

  // Initialize MQTT connection
  useEffect(() => {
    const unsubscribe = connectMQTT(
      (data) => {
        console.log("STATUS:", data);
        setStatus(data);
        
        // Log status update
        systemLog.logStatus(data);
        
        // Update RPM history for chart
        if (data.motorRPM !== undefined) {
          const newRpm = data.motorRPM;
          rpmHistoryRef.current = [...rpmHistoryRef.current, newRpm].slice(-maxHistoryLength);
          setRpmHistory(rpmHistoryRef.current);
        }
        
        // Update component statuses based on data
        updateComponentStatuses(data);
      },
      () => {
        setConnected(true);
        systemLog.logConnection('MQTT Connected');
      }
    ) as (() => void) | undefined;

    // Subscribe to log updates for recent operations
    const logUnsubscribe = systemLog.subscribe((logs) => {
      // Filter for operations and commands, limit to 4 most recent
      const operations = logs
        .filter(log => log.type === 'operation' || log.type === 'command')
        .slice(0, 4)
        .map(log => ({
          id: log.id,
          title: log.title,
          time: formatTimeAgo(log.timestamp),
          details: log.message,
          type: log.type
        }));
      setRecentOperations(operations);
    });

    // Load initial recent operations
    const initialLogs = systemLog.getLogs(4);
    const initialOps = initialLogs
      .filter(log => log.type === 'operation' || log.type === 'command')
      .map(log => ({
        id: log.id,
        title: log.title,
        time: formatTimeAgo(log.timestamp),
        details: log.message,
        type: log.type
      }));
    setRecentOperations(initialOps);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      logUnsubscribe();
    };
  }, []);

  const updateComponentStatuses = (data: StatusData) => {
    // Update motor status based on RPM
    if (data.motorRPM !== undefined) {
      if (data.motorRPM > 0 && data.motorRPM < 1000) setMotorStatus('good');
      else if (data.motorRPM >= 1000 && data.motorRPM < 1500) setMotorStatus('warning');
      else setMotorStatus('bad');
    }

    // Update UV status (assuming boolean from data)
    setUvStatus(data.uvStatus ? 'good' : 'bad');

    // Update water system status
    if (data.waterLevel !== undefined) {
      if (data.waterLevel > 50) setWaterSystemStatus('good');
      else if (data.waterLevel > 20) setWaterSystemStatus('warning');
      else setWaterSystemStatus('bad');
    }
  };

  const handleCommand = (command: string) => {
    sendCommand(command);
    systemLog.logCommand(command, { timestamp: Date.now() });
  };

  // Prepare chart data
  const chartData = {
    labels: rpmHistory.map((_, index) => {
      // Show labels for some points to avoid clutter
      if (rpmHistory.length <= 7) return `${index + 1}`;
      if (index % 3 === 0 || index === rpmHistory.length - 1) return `${index + 1}`;
      return '';
    }),
    datasets: [{
      data: rpmHistory.length > 0 ? rpmHistory : [0, 10, 20, 30, 40, 50, 60],
      color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
      strokeWidth: 2,
    }],
  };

  return (
    <ScrollView style={styles.container}>
      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleCommand("start")}
          >
            <View style={[styles.actionIcon, {backgroundColor: 'rgba(46, 204, 113, 0.2)'}]}>
              <MaterialCommunityIcons name="power" size={28} color="#2ecc71" />
            </View>
            <Text style={styles.actionText}>Power On</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleCommand("stop")}
          >
            <View style={[styles.actionIcon, {backgroundColor: 'rgba(231, 76, 60, 0.2)'}]}>
              <MaterialCommunityIcons name="power-off" size={28} color="#e74c3c" />
            </View>
            <Text style={styles.actionText}>Power Off</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleCommand("restart")}
          >
            <View style={[styles.actionIcon, {backgroundColor: 'rgba(52, 152, 219, 0.2)'}]}>
              <MaterialCommunityIcons name="restart" size={28} color="#3498db" />
            </View>
            <Text style={styles.actionText}>Restart</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => {
              handleCommand("auto_clean");
              router.push('/autoclean');
            }}
          >
            <View style={[styles.actionIcon, {backgroundColor: 'rgba(52, 152, 219, 0.2)'}]}>
              <MaterialCommunityIcons name="play" size={28} color="#3498db" />
            </View>
            <Text style={styles.actionText} >Start Clean</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Device Status</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View Details</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons name="wifi" size={28} color="#3498db" />
            </View>
            <Text style={styles.statusTitle}>Network</Text>
            <Text style={[styles.statusValue, connected ? styles.connected : styles.disconnected]}>
              {connected ? "Connected" : "Connecting..."}
            </Text>
            <Text style={styles.statusSubtext}>State: {status?.state ?? "--"}</Text>
            <Text style={styles.statusSubtext}>
              Last update: {status?.lastUpdate ? formatTimeAgo(status.lastUpdate) : '--'}
            </Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons name="engine" size={28} color="#3498db" />
            </View>
            <Text style={styles.statusTitle}>Motor</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusValue}>{status?.motorRPM ?? 0} RPM</Text>
              {getStatusIndicator(motorStatus)}
            </View>
            <Text style={styles.statusSubtext}>{motorStatus === 'good' ? 'Normal' : motorStatus === 'warning' ? 'High RPM' : 'Critical'}</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons name="lightbulb-on" size={28} color="#3498db" />
            </View>
            <Text style={styles.statusTitle}>UV Lamp</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusValue}>{status?.uvStatus ? 'On' : 'Off'}</Text>
              {getStatusIndicator(uvStatus)}
            </View>
            <Text style={styles.statusSubtext}>Sterilization</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons name="water" size={28} color="#3498db" />
            </View>
            <Text style={styles.statusTitle}>Water System</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusValue}>{status?.waterLevel ?? 0}%</Text>
              {getStatusIndicator(waterSystemStatus)}
            </View>
            <Text style={styles.statusSubtext}>Level</Text>
          </View>
        </View>
      </View>

      {/* Performance Chart with Real Data */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Motor RPM History</Text>
          <TouchableOpacity onPress={() => setRpmHistory([])}>
            <Text style={styles.viewAll}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth - 60}
            height={220}
            yAxisSuffix=" RPM"
            fromZero={true}
            chartConfig={{
              backgroundColor: '#ebebbb',
              backgroundGradientFrom: '#f8f9fa',
              backgroundGradientTo: '#ebebbb',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 8 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#2E86DE' },
              propsForBackgroundLines: {
                strokeDasharray: ""
              }
            }}
            bezier
            style={{ borderRadius: 12, paddingRight: 10 }}
          />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, {backgroundColor: '#3498db'}]} />
              <Text style={styles.legendText}>
                Motor RPM ({rpmHistory.length > 0 ? rpmHistory[rpmHistory.length - 1] : 0} RPM)
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Operations with Real Data */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Operations</Text>
            <TouchableOpacity onPress={() => router.push('/SystemLogScreen')}>
              <Text style={styles.viewAll}>
                See All
              </Text>
            </TouchableOpacity>
        </View>
        
        {recentOperations.length > 0 ? (
          <FlatList
            data={recentOperations}
            scrollEnabled={false}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.operationItem}>
                <View style={[
                  styles.operationIcon,
                  { backgroundColor: item.type === 'command' ? '#ebebbb' : '#f0f7ff' }
                ]}>
                  <MaterialCommunityIcons 
                    name={item.title.includes('Command') ? 'console' : 
                          item.title.includes('Status') ? 'chart-line' :
                          item.title.includes('Error') ? 'alert-circle' : 'cog'} 
                    size={24} 
                    color={item.type === 'command' ? '#3498db' : '#2ecc71'} 
                  />
                </View>
                <View style={styles.operationDetails}>
                  <Text style={styles.opTitle}>{item.title}</Text>
                  <Text style={styles.opTime}>{item.time}</Text>
                  <Text style={styles.opDetails} numberOfLines={1}>
                    {item.details}
                  </Text>
                </View>
                <TouchableOpacity style={styles.operationAction}>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#7f8c8d" />
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={48} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>No operations yet</Text>
            <Text style={styles.emptyStateSubtext}>Operations will appear here</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BAB86C',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  profileButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  viewAll: {
    color: '#663535',
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#ebebbb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    backgroundColor: '#ebebbb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  connected: {
    color: '#2ecc71',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  chartContainer: {
    backgroundColor: '#ebebbb',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  operationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  operationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  operationDetails: {
    flex: 1,
  },
  opTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  opTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  operationAction: {
    padding: 4,
  },
  disconnected: {
    color: '#e74c3c',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 4,
  },
  opDetails: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  }
});