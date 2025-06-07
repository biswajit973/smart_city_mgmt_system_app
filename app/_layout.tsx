import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

import { ErrorBoundary } from '../components/ErrorBoundary';
import SplashScreen from './SplashScreen';

export default function AppLayout() {
  const [isSplash, setIsSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (isSplash) return <SplashScreen />;

  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#4BB543',
          backgroundColor: '#f0fff0',
          borderRadius: 12,
          borderWidth: 0,
          marginVertical: 4,
          paddingVertical: 10,
          paddingHorizontal: 0,
        }}
        contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 0 }}
        text1Style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#228B22',
          textAlign: 'left',
          flexWrap: 'wrap',
          flex: 1,
          marginBottom: 0,
          paddingBottom: 0,
        }}
        text2Style={{
          fontSize: 14,
          color: '#228B22',
          textAlign: 'left',
          flexWrap: 'wrap',
          flex: 1,
          marginTop: 0,
          paddingTop: 0,
        }}
        leadingIcon={{ tintColor: '#4BB543' }}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: '#FF3333', // bright red
          backgroundColor: '#fff0f0', // light red background
          borderRadius: 12,
          borderWidth: 0,
          marginVertical: 4,
          paddingVertical: 10,
          paddingHorizontal: 0,
        }}
        contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 0 }}
        text1Style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#FF3333', // red text
          textAlign: 'left',
          flexWrap: 'wrap',
          flex: 1,
          marginBottom: 0,
          paddingBottom: 0,
        }}
        text2Style={{
          fontSize: 14,
          color: '#FF3333', // red text
          textAlign: 'left',
          flexWrap: 'wrap',
          flex: 1,
          marginTop: 0,
          paddingTop: 0,
        }}
        leadingIcon={{ tintColor: '#FF3333' }}
      />
    ),
    info: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#888',
          backgroundColor: '#f4f6fa',
          borderRadius: 12,
          borderWidth: 0,
          marginVertical: 4,
          paddingVertical: 10,
          paddingHorizontal: 0,
        }}
        contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 0 }}
        text1Style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#444',
          textAlign: 'left',
          flexWrap: 'wrap',
          flex: 1,
          marginBottom: 0,
          paddingBottom: 0,
        }}
        text2Style={{
          fontSize: 14,
          color: '#444',
          textAlign: 'left',
          flexWrap: 'wrap',
          flex: 1,
          marginTop: 0,
          paddingTop: 0,
        }}
        leadingIcon={{ tintColor: '#888' }}
      />
    ),
    warning: (props: any) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: '#FF3333',
          backgroundColor: '#fff0f0',
          borderRadius: 12,
          borderWidth: 0,
          marginVertical: 4,
          paddingVertical: 10,
          paddingHorizontal: 0,
        }}
        contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 0 }}
        text1Style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#FF3333',
          textAlign: 'left',
          flexWrap: 'wrap',
          flex: 1,
          marginBottom: 0,
          paddingBottom: 0,
        }}
        text2Style={{
          fontSize: 14,
          color: '#FF3333',
          textAlign: 'left',
          flexWrap: 'wrap',
          flex: 1,
          marginTop: 0,
          paddingTop: 0,
        }}
        leadingIcon={{ tintColor: '#FF3333' }}
      />
    ),
  };
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)" />
          <Toast config={toastConfig} />
        </SafeAreaView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
