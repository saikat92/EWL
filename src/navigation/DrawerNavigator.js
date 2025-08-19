import { createDrawerNavigator } from '@react-navigation/drawer';
import SideMenu from '../screens/SideMenu';
import TabNavigator from './TabNavigator';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <SideMenu {...props} />}
    screenOptions={{
      drawerPosition: 'right',
      headerShown: false,
      drawerStyle: {
        width: '80%'
      }
    }}
  >
    <Drawer.Screen name="Main" component={TabNavigator} />
  </Drawer.Navigator>
);

export default DrawerNavigator;