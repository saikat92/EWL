import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AutoCleanScreen from '../screens/tabs/AutoCleanScreen';
import ConnectionScreen from '../screens/tabs/ConnectionScreen';
import DashboardScreen from '../screens/tabs/DashboardScreen';
import ManualCleanScreen from '../screens/tabs/ManualCleanScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        const icons = {
          Connection: 'wifi',
          Dashboard: 'dashboard',
          AutoClean: 'auto-awesome',
          ManualClean: 'brush'
        };
        return <MaterialIcons name={icons[route.name]} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#0066cc',
      tabBarInactiveTintColor: '#999',
      headerShown: false,
      tabBarStyle: {
        paddingBottom: 5,
        height: 60
      }
    })}
  >
    <Tab.Screen name="Connection" component={ConnectionScreen} />
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="AutoClean" component={AutoCleanScreen} />
    <Tab.Screen name="ManualClean" component={ManualCleanScreen} />
  </Tab.Navigator>
);

export default TabNavigator;