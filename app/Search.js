import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNotification } from '../components/NotificationContext';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { showToast } from '../components/toastHelper';

const popularServices = [
  {
    title: 'Booking',
    desc: 'Schedule a cesspool cleaning',
    image: require('../assets/images/main_service/cesspool.png'),
    onPress: (router) => router.push({ pathname: '/ServiceBooking', params: { title: 'Schedule a cesspool cleaning' } }),
  },
  {
    title: 'Booking',
    desc: 'Reserve a Kalyan Mandap for an event',
    image: require('../assets/images/main_service/kalyanmandap.png'),
    onPress: (router) => router.push('/KalyanMandapBooking'),
  },
];

const otherServices = [
  {
    title: 'Booking',
    desc: 'Get waste picked up from your home',
    image: require('../assets/images/main_service/dustpin.png'),
    onPress: (router) => router.push({ pathname: '/ServiceBooking', params: { title: 'Get waste picked up from your home' } }),
  },
  {
    title: 'Booking',
    desc: 'Request for space cleaning in the city',
    image: require('../assets/images/main_service/speawer.png'),
    onPress: (router) => router.push({ pathname: '/ServiceBooking', params: { title: 'Request for space cleaning in the city' } }),
  },
];

const ORANGE = '#E87A1D';

export default function Search() {
  const router = useRouter();
  const { setNotifModalVisible } = useNotification();
  const [accountModalVisible, setAccountModalVisible] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [search, setSearch] = useState('');
  const [notificationDiff, setNotificationDiff] = useState(0);

  React.useLayoutEffect(() => {
    if (router?.setOptions) {
      router.setOptions({ tabBarStyle: { display: 'flex' } });
    }
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('access');
      if (!token) {
        router.replace('/Login');
        showToast('success', 'Logged out', 'You have been logged out successfully.');

      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const getNotificationDiff = async () => {
      const diffStr = await AsyncStorage.getItem('notificationCountDiff');
      setNotificationDiff(diffStr ? parseInt(diffStr, 10) : 0);
    };
    getNotificationDiff();
  }, []);
  const handleLogout = async () => {
    setAccountModalVisible(false);
    try {
      await AsyncStorage.multiRemove([
        'access',
        'refresh', 
        'first_name',
        'last_name',
        'email',
        'user_id'
      ]);
      router.replace('/BookingServices');
    } catch (error) {
      showToast('error', 'Logout failed', 'An error occurred while logging out.');
    }
  };

  if (checkingAuth) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#fff'}}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  // Combine and filter services
  const allServices = [...popularServices, ...otherServices];
  const filteredServices = allServices.filter(item => {
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q)
    );
  });

  return (
    <ThemedView style={[styles.bg]} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.header}>Search Services</ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => setNotifModalVisible(true)} style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={28} color={"rgb(18, 0, 0)"} />
            {notificationDiff > 0 && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: '#E53935',
                borderRadius: 8,
                minWidth: 16,
                height: 16,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 3,
                zIndex: 2,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{notificationDiff}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#aaa" style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a service..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Account Modal */}
        <ThemedText style={[styles.sectionTitle, { color: ORANGE, marginTop: 18 }]}>Services</ThemedText>
        {filteredServices.length === 0 ? (
          <ThemedText style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>No services found.</ThemedText>
        ) : (
          filteredServices.map((item, idx) => (
            <View key={idx} style={[styles.serviceRow, { backgroundColor: '#fff', borderWidth: 0, borderRadius: 16, shadowColor: ORANGE, shadowOpacity: 0.08, shadowRadius: 8, marginBottom: 18 }]}> 
              <View style={styles.serviceTextBox}>
                <ThemedText style={[styles.serviceTitle, { color: ORANGE }]}>{item.title}</ThemedText>
                <ThemedText style={styles.serviceDesc}>{item.desc}</ThemedText>
                <TouchableOpacity 
                  style={{ backgroundColor: ORANGE, borderRadius: 16, paddingVertical: 5, paddingHorizontal: 18, alignSelf: 'flex-start', marginTop: 10, shadowColor: ORANGE, shadowOpacity: 0.12, shadowRadius: 6 }}
                  onPress={() => item.onPress ? item.onPress(router) : null}
                  activeOpacity={0.85}
                >
                  <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 12}}>Book Now</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={[styles.iconBox, { borderWidth: 0, borderRadius: 16 }]}> 
                <Image source={item.image} style={{ width: 120, height: 100, resizeMode: 'contain', borderRadius: 16 }} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
      {/* Notification Modal for global notifications - only one instance at the root */}

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: '#fff',
  },
  container: {
    padding: 0,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F7',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    paddingHorizontal: 12,
    color: '#181A20',
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    color: '#181A20',
    paddingHorizontal: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 28,
    padding: 0,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    elevation: 0,
    marginHorizontal: 10,
    minHeight: 110,
  },
  serviceTextBox: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 8,
  },
  serviceTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#181A20',
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 14,
    color: '#6C6C6C',
    marginBottom: 0,
    marginTop: 0,
  },
  bookBtn: {
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: '#F5F6F7',
    shadowColor: 'transparent',
    elevation: 0,
  },
  bookBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#181A20',
    letterSpacing: 0.2,
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginLeft: 16,
    backgroundColor: '#F5F6F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
