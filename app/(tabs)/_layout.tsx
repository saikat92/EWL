import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import SidebarMenu from '../../components/SidebarMenu';

const RightSidebarButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.sidebarButton} onPress={onPress}>
    <Ionicons name="options" size={22} color="#00D4FF" />
  </TouchableOpacity>
);

const CustomHeader = ({ onSidebarPress }: { onSidebarPress: () => void }) => (
  <View style={styles.customHeader}>
    <View style={{ flex: 1 }} />
    <RightSidebarButton onPress={onSidebarPress} />
  </View>
);

export default function TabLayout() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor:   '#00D4FF',
          tabBarInactiveTintColor: '#4A6080',
          tabBarStyle: {
            backgroundColor:  '#0F1629',
            borderTopWidth:   1,
            borderTopColor:   '#1E2D4A',
            height:           62,
            paddingBottom:    10,
            paddingTop:       8,
          },
          tabBarLabelStyle: {
            fontSize:   10,
            fontWeight: '600',
          },
          header: () => (
            <CustomHeader onSidebarPress={() => setIsSidebarVisible(true)} />
          ),
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
            title: 'Manual',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="hands" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <SidebarMenu
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarButton: {
    marginRight: 14,
    padding:     8,
    borderRadius: 20,
    backgroundColor: '#141D35',
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  customHeader: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'flex-end',
    height:           56,
    backgroundColor:  '#0F1629',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2D4A',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
});
