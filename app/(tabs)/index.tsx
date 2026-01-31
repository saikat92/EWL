import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { sendCommand } from "../mqttService";


// Mock data for the dashboard
const user = { email: 'say.picklu@gmail.com' };
const motor = { status: 'good', rpm: 50, distance: '120 cm' };
const uvLamp = { status: 'good' };
const waterSystem = { status: 'bad', level: 85 };

const mockOperations = [
  { id: '1', title: 'Auto Cleaning', time: '2 hours ago' },
  { id: '2', title: 'Manual Cleaning', time: '5 hours ago' },
  { id: '3', title: 'System Update', time: '1 day ago' },
  { id: '4', title: 'UV Lamp Maintenance', time: '2 days ago' },
];

const chartData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      data: [45, 52, 48, 60, 55, 65, 70],
      color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

const screenWidth = Dimensions.get('window').width;

// Helper function for status indicator
const getStatusIndicator = (status: string) => {
  const color = status === 'good' ? '#2ecc71' : '#e74c3c';
  return <View style={[styles.statusIndicator, { backgroundColor: color }]} />;
};

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
     
      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.actionsContainer}>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => sendCommand("start")}>
            <View style={[styles.actionIcon, {backgroundColor: 'rgba(46, 204, 113, 0.2)'}]}>
              <MaterialCommunityIcons name="power" size={28} color="#2ecc71" />
            </View>
            <Text style={styles.actionText}>Power On</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => sendCommand("stop")}>
            <View style={[styles.actionIcon, {backgroundColor: 'rgba(231, 76, 60, 0.2)'}]}>
              <MaterialCommunityIcons name="power-off" size={28} color="#e74c3c" />
            </View>
            <Text style={styles.actionText}>Power Off</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, {backgroundColor: 'rgba(52, 152, 219, 0.2)'}]}>
              <MaterialCommunityIcons name="restart" size={28} color="#3498db" />
            </View>
            <Text style={styles.actionText}>Restart</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, {backgroundColor: 'rgba(52, 152, 219, 0.2)'}]}>
              <MaterialCommunityIcons name="play" size={28} color="#3498db" />
            </View>
            <Text style={styles.actionText}>Start Clean</Text>
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
            <Text style={styles.statusTitle}>WiFi</Text>
            <Text style={[styles.statusValue, styles.connected]}>Connected</Text>
            <Text style={styles.statusSubtext}>v1.0.2</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons name="engine" size={28} color="#3498db" />
            </View>
            <Text style={styles.statusTitle}>Motor</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusValue}>{motor.rpm} RPM</Text>
              {getStatusIndicator(motor.status)}
            </View>
            <Text style={styles.statusSubtext}>{motor.distance}</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons name="lightbulb-on" size={28} color="#3498db" />
            </View>
            <Text style={styles.statusTitle}>UV Lamp</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusValue}>Ready</Text>
              {getStatusIndicator(uvLamp.status)}
            </View>
            <Text style={styles.statusSubtext}>Sterilization</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons name="water" size={28} color="#3498db" />
            </View>
            <Text style={styles.statusTitle}>Water System</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusValue}>{waterSystem.level}%</Text>
              {getStatusIndicator(waterSystem.status)}
            </View>
            <Text style={styles.statusSubtext}>Level</Text>
          </View>
        </View>
      </View>

      {/* Performance Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>Full Report</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisSuffix=" RPM"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#f8f9fa',
              backgroundGradientTo: '#f8f9fa',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 8 },
              propsForDots: { r: '5', strokeWidth: '2', stroke: '#2E86DE' },
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
              <Text style={styles.legendText}>Motor RPM</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Operations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Operations</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={mockOperations}
          scrollEnabled={false}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.operationItem}>
              <View style={styles.operationIcon}>
                <MaterialCommunityIcons 
                  name={item.title.includes('Auto') ? 'robot' : 
                        item.title.includes('Manual') ? 'hand-back-right' :
                        item.title.includes('System') ? 'restart' : 'lightbulb-on'} 
                  size={24} 
                  color="#3498db" 
                />
              </View>
              <View style={styles.operationDetails}>
                <Text style={styles.opTitle}>{item.title}</Text>
                <Text style={styles.opTime}>{item.time}</Text>
              </View>
              <TouchableOpacity style={styles.operationAction}>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#006435ff',
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
    color: '#3498db',
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
    backgroundColor: 'white',
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
    backgroundColor: 'white',
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
    backgroundColor: 'white',
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
});