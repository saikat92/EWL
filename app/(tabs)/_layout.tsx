import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import SidebarMenu from '../../components/SidebarMenu';

// Right Sidebar Button Component
const RightSidebarButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.sidebarButton} onPress={onPress}>
      <Ionicons name="options" size={24} color="#007AFF" />
    </TouchableOpacity>
  );
};

// Custom Header Component that doesn't show title
const CustomHeader = ({ onSidebarPress }: { onSidebarPress: () => void }) => {
  return (
    <View style={styles.customHeader}>
      <View style={{ flex: 1 }} />
      <RightSidebarButton onPress={onSidebarPress} />
    </View>
  );
};

export default function TabLayout() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#F8F8F8',
            borderTopWidth: 1,
            borderTopColor: '#E5E5E5',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          header: () => <CustomHeader onSidebarPress={() => setIsSidebarVisible(true)} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="speedometer" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="connection"
          options={{
            title: 'Connection',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="link" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="autoclean"
          options={{
            title: 'Auto Clean',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="robot" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="manualclean"
          options={{
            title: 'Manual Clean',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="hands" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Sidebar Menu */}
      <SidebarMenu 
        isVisible={isSidebarVisible} 
        onClose={() => setIsSidebarVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 60,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingHorizontal: 16,
  },
});