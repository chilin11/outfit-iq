import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { theme } from './src/theme';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {showSettings ? (
        <SettingsScreen onClose={() => setShowSettings(false)} />
      ) : (
        <HomeScreen onOpenSettings={() => setShowSettings(true)} />
      )}
    </SafeAreaProvider>
  );
}
