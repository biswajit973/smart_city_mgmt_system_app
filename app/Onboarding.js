import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const anim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Check for authentication state
    const checkAuth = async () => {
      try {
        const authToken = await AsyncStorage.getItem('access');
        if (authToken) {
          // User is authenticated, redirect to MainTabs (tab navigator root)
          router.replace('/BookingServices');
          return;
        }
        // No auth token, show onboarding after loading animation
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => checkAuth(), 2000);
    return () => clearTimeout(timer);
  }, [anim, router]);

  if (loading) {
    const themeColors = ['#F6C63F', '#F89B29', '#F857A6', '#FF5858', '#6C63FF']; // theme-matching
    return (
      <View style={styles.loadingContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const inputRange = [0, 0.2 * i, Math.min(0.2 * i + 0.4, 1), 1];
            const outputRange = [0.5, 1, 0.5, 0.5];
            const scale = anim.interpolate({ inputRange, outputRange });
            return (
              <Animated.View
                key={i}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  marginHorizontal: 4,
                  backgroundColor: themeColors[i],
                  transform: [{ scale }],
                  shadowColor: themeColors[i],
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              />
            );
          })}
        </View>
        <Text style={styles.loadingText}>Loading Joda municipality...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/teamwork.png')} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>Joda municipality</Text>
      <Text style={styles.subtitle}>
        Seamless access to city cleaning, waste pickup, and grievance redressal. Empowering citizens for a cleaner, greener, and more responsive Joda.
      </Text>
      <Text style={styles.publicService}>
        Book cleaning services, request waste pickup, or submit grievances directly from your phone. Join us in making Joda a better place for all!
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/Login')}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/Signup')}>
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F6F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6C63FF',
    fontWeight: 'bold',
    marginTop: 32,
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: 220,
    height: 180,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 32,
  },
  publicService: {
    fontSize: 15,
    color: '#2a2a2a',
    textAlign: 'center',
    marginBottom: 28,
    marginTop: 8,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 16,
  },
  signInBtn: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginRight: 8,
  },
  signInText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerBtn: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  registerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
