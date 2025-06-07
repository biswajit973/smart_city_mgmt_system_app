import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { showToast } from '../components/toastHelper';

export default function LogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    console.log('useEffect triggered in LogoutScreen');
    const doLogout = async () => {
      console.log('doLogout function started');
      try {
        // Clear all authentication and user data
        console.log('Clearing AsyncStorage...');
        await AsyncStorage.clear(); // Clear all keys for full logout
        console.log('AsyncStorage cleared successfully.');

        // showToast('success', 'Logged out', 'You have been logged out successfully.');
        console.log('Redirecting to login page...');

        // Debugging log to confirm route existence
        console.log('Attempting to navigate to /Login');
    
          console.log('Calling router.replace to navigate to /Login');
          router.replace('/Login');
          console.log('router.replace called successfully.');

      } catch (error) {
        console.error('Error during logout:', error);
        showToast('error', 'Logout failed', 'An error occurred while logging out.');
      }
    };
    doLogout();
  }, [router]);

  // const manualLogoutTest = async () => {
  //   console.log('Manual logout test button clicked');
  //   await AsyncStorage.clear();
  //   console.log('AsyncStorage cleared manually');
  //   router.replace('/Login');
  // };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6C63FF" />
   
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
