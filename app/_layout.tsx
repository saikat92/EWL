import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
          <StatusBar style="light" backgroundColor="#0F1629" />
        {/* <Stack.Screen name="SystemLogScreen" component={SystemLogScreen} /> */}
      </Stack>
    </SafeAreaView>
    
  );
}