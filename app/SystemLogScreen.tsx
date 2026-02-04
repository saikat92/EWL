// SystemLogScreen.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { systemLog } from './systemLogService';

const SystemLogScreen = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Get initial logs
    setLogs(systemLog.getLogs());
    
    // Subscribe to log updates
    const unsubscribe = systemLog.subscribe((updatedLogs) => {
      setLogs([...updatedLogs]);
    });
    
    return unsubscribe;
  }, []);

  const getIconForType = (type: string) => {
    switch(type) {
      case 'command': return 'console';
      case 'status': return 'chart-line';
      case 'error': return 'alert-circle';
      case 'operation': return 'cog';
      case 'connection': return 'wifi';
      default: return 'information';
    }
  };

  const getColorForType = (type: string) => {
    switch(type) {
      case 'command': return '#3498db';
      case 'status': return '#2ecc71';
      case 'error': return '#e74c3c';
      case 'operation': return '#f39c12';
      case 'connection': return '#9b59b6';
      default: return '#7f8c8d';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Log</Text>
        <Text style={styles.headerSubtitle}>{logs.length} log entries</Text>
      </View>
      
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <View style={[styles.logIcon, { backgroundColor: getColorForType(item.type) + '20' }]}>
              <MaterialCommunityIcons 
                name={getIconForType(item.type)} 
                size={20} 
                color={getColorForType(item.type)} 
              />
            </View>
            <View style={styles.logContent}>
              <Text style={styles.logTitle}>{item.title}</Text>
              <Text style={styles.logMessage}>{item.message}</Text>
              <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="text-box-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>No logs available</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.clearButton}
        onPress={() => systemLog.clearLogs()}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={20} color="white" />
        <Text style={styles.clearButtonText}>Clear All Logs</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  logItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 12,
    color: '#95a5a6',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#bdc3c7',
    marginTop: 16,
  },
  clearButton: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SystemLogScreen;