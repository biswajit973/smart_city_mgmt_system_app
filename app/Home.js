import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { useNotification } from '../components/NotificationContext';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { showToast } from '../components/toastHelper';
import AccountDetailsScreen from './AccountDetails';

const ORANGE = '#E87A1D';

export default function Home() {
  const router = useRouter();
  const { setNotifModalVisible } = useNotification();
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [wasteModalVisible, setWasteModalVisible] = useState(false);
  const [complaintModalVisible, setComplaintModalVisible] = useState(false);
  const [kalyanModalVisible, setKalyanModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [wasteSuccessModalVisible, setWasteSuccessModalVisible] = useState(false);
  const [wasteSuccessType, setWasteSuccessType] = useState(''); // 'public' or 'personal'
  const [pollutionModalVisible, setPollutionModalVisible] = useState(false);
  const [cesspoolModalVisible, setCesspoolModalVisible] = useState(false);

  const handleWasteModalOk = () => {
    setWasteModalVisible(false);
    setWasteSuccessType('public');
    setWasteSuccessModalVisible(true);
  };

  const handlePersonalWaste = () => {
    setWasteModalVisible(false);
    setWasteSuccessType('personal');
    setWasteSuccessModalVisible(true);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('access');
      if (!token) {
        router.replace('/logout');
        return;
      }
      // Validate token by calling account-details API
      try {
        const res = await fetch('https://mobile.wemakesoftwares.com/api/account-details/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.status !== 200) {
          await AsyncStorage.removeItem('access');
          router.replace('/logout');
          return;
        }
      } catch (_e) {
        await AsyncStorage.removeItem('access');
        router.replace('/logout');
        return;
      }
      const firstName = await AsyncStorage.getItem('first_name');
      const lastName = await AsyncStorage.getItem('last_name');
      if (firstName || lastName) {
        setFullName(`${firstName || ''} ${lastName || ''}`.trim());
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        let geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (geo && geo.length > 0) {
          setUserLocation(`${geo[0].name || ''} ${geo[0].street || ''}, ${geo[0].city || geo[0].district || ''}`);
        } else {
          setUserLocation('Location not found');
        }
      } catch (_e) {
        setLocationError('Unable to fetch location');
      }
    })();
  }, []);

  const services = [
    {
      desc: 'Waste Management',
      image: require('../assets/images/main_service/dustpin.png'),
      onPress: () => setWasteModalVisible(true),
    },
    {
      desc: 'Kalyan Mandap',
      image: require('../assets/images/main_service/kalyanmandap.png'),
      onPress: () => setKalyanModalVisible(true),
    },


    {
      desc: 'Complaints',
      image: require('../assets/images/main_service/speawer.png'),
      onPress: () => setComplaintModalVisible(true),
    },
    //     {
    //   desc: 'Pollution Control',
    //  image: require('../assets/images/main_service/pollution.png'),
    //   onPress: () => setPollutionModalVisible(true),
    // },
        {
      desc: 'Cess pool',
     image: require('../assets/images/main_service/cesspool.png'),
      onPress: () => setCesspoolModalVisible(true),
    },
  ];

  const handleLogout = async () => {
    console.log('handleLogout function started');
    try {
      console.log('Removing authToken...');
      await AsyncStorage.removeItem('access');
      console.log('access removed successfully.');
      router.replace('/BookingServices');
    } catch (error) {
      console.error('Error during logout:', error);
      showToast('error', 'Logout failed', 'An error occurred while logging out.');
    }
  };

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Top Bar with location and notification (fixed) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }}>
        <View>
          <ThemedText style={{ fontWeight: 'bold', fontSize: 20 }}>{fullName ? fullName : 'Full Name'}</ThemedText>
          <ThemedText style={{ color: '#888', fontSize: 13 }}>
            {userLocation ? userLocation : locationError ? locationError : 'Detecting...'}
          </ThemedText>
        </View>
        <TouchableOpacity style={{ marginBottom:3 }} onPress={() => setNotifModalVisible(true)}>
          <Ionicons name="notifications-outline" size={28} color={"rgb(18, 0, 0)"} />
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
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>3</Text>
          </View>
        </TouchableOpacity>
      </View>
      {/* Only services section scrolls */}
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Services List (vertical, one row at a time) */}
        <View style={{ paddingHorizontal: 16, marginTop: 18, marginBottom: 8 }}>
          {services.map((item, idx) => (
            <View
              key={idx}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginBottom: 16, paddingVertical: 14, paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            >
              <Image source={item.image} style={{ width: 54, height: 54, resizeMode: 'contain', marginRight: 18 }} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 16, color: '#181A20', fontWeight: '600', marginBottom: 2 }}>{item.desc}</ThemedText>
                <Text style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>
                  {item.desc === 'Waste Management' && 'Get your waste picked up quickly and efficiently.'}
                  {item.desc === 'Kalyan Mandap' && 'Book community halls for your events and functions.'}
                  {item.desc === 'Complaints' && 'Report civic issues and track your complaints.'}
                  {item.desc === 'Cess pool' && 'Request cesspool cleaning and maintenance.'}
                </Text>
                <TouchableOpacity
                  style={{ alignSelf: 'flex-start', backgroundColor: '#181A20', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 18 }}
                  onPress={item.onPress}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Book now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        {/* Help & Support Service Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 0, marginBottom: 24 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            onPress={() => router.push('/HelpSupport')}
            activeOpacity={0.85}
          >
            <Ionicons name="help-circle-outline" size={55} color="#E87A1D" style={{ marginRight: 18 }} />
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontSize: 16, color: '#181A20', fontWeight: '600', marginBottom: 2 }}>Help & Support</ThemedText>
              <Text style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>
                Get assistance, contact support, or find answers to your questions.
              </Text>
              <TouchableOpacity
                style={{ alignSelf: 'flex-start', backgroundColor: '#181A20', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 18 }}
                onPress={() => router.push('/HelpSupport')}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Support Desk</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
        {/* Banner Section */}
        {/* <View style={{ marginHorizontal: 16, marginTop: 8, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f7f7f7' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <Image source={require('../assets/images/main_service/cesspool.png')} style={{ width: 80, height: 80, resizeMode: 'contain', marginRight: 16 }} />
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>Deep clean with foam-jet AC service</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>AC service & repair</ThemedText>
              <TouchableOpacity style={{ backgroundColor: '#181A20', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 18, alignSelf: 'flex-start' }}>
                <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Book now</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View> */}
      </ScrollView>
      {/* Modals and other overlays remain outside ScrollView */}
      {/* Notification Modal */}
      {/* <Modal
        visible={notifModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotifModalVisible(false)}
        style={{ margin: 0 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'flex-end', alignItems: 'center', width: '100%', height: '100%' }}>
          <View style={{ width: '100%', maxHeight: '70%', backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 18, paddingBottom: 24, paddingHorizontal: 0, alignItems: 'stretch', shadowColor: ORANGE, shadowOpacity: 0.12, shadowRadius: 12 }}>
            {/* Header Row */}
            {/* <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 8 }}>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 22, color: '#181A20' }}>Notifications</ThemedText>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                <Ionicons name="close" size={28} color="#181A20" />
              </TouchableOpacity>
            </View> */}
            {/* Divider */}
            {/* <View style={{ height: 1, backgroundColor: '#eee', marginHorizontal: 0, marginBottom: 8 }} /> */}
            {/* Notifications List */}
            {/* {notifications.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
                <Ionicons name="mail-open-outline" size={54} color="#bbb" style={{ marginBottom: 10 }} />
                <ThemedText style={{ fontWeight: 'bold', fontSize: 18, color: '#181A20', marginBottom: 6 }}>No notifications yet</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 10 }}>Your notification will appear here once you've received them.</ThemedText>
                <TouchableOpacity>
                  <ThemedText style={{ color: ORANGE, fontWeight: 'bold', fontSize: 14 }}>Go to historical notifications.</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ flex: 1, paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: 18 }}>
                {notifications.map(n => (
                  <View key={n.id} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18, backgroundColor: '#F5F6F7', borderRadius: 14, padding: 14 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#181A20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{n.title[0]}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontWeight: 'bold', color: '#181A20', fontSize: 15, marginBottom: 2 }}>{n.title}</ThemedText>
                      <ThemedText style={{ color: '#444', fontSize: 14 }}>{n.message}</ThemedText>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal> */}
      {/* Account Modal */}
      <Modal
        visible={false}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, minWidth: 260, alignItems: 'center', shadowColor: ORANGE, shadowOpacity: 0.12, shadowRadius: 12 }}>
            <Ionicons name="person-circle-outline" size={40} color={ORANGE} style={{ marginBottom: 10 }} />
            <ThemedText style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, color: ORANGE }}>Account</ThemedText>
            <AccountDetailsScreen />
            <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#E53935', borderRadius: 22, paddingVertical: 10, paddingHorizontal: 32, marginTop: 18 }}>
              <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Logout</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 16 }}>
              <ThemedText style={{ color: ORANGE, fontWeight: 'bold' }}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Waste Pickup Modal (Bottom Sheet) with drag-to-dismiss */}
      <Modal
        isVisible={wasteModalVisible}
        onBackdropPress={() => setWasteModalVisible(false)}
        onSwipeComplete={() => setWasteModalVisible(false)}
        swipeDirection={["down"]}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropTransitionOutTiming={0}
        propagateSwipe
      >
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, minHeight: 340, elevation: 10 }}>
          {/* Close button at middle bottom */}
          <TouchableOpacity onPress={() => setWasteModalVisible(false)} style={{ alignSelf: 'center', position: 'absolute', bottom: 15 }}>
            <Ionicons name="close-circle-outline" size={32} color="#bbb" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginBottom: 18, marginTop: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#eee', marginBottom: 12 }} />
            <ThemedText style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 2 }}>Get waste picked up from your home</ThemedText>
            <ThemedText style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>Choose a service type</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
            {/* Public Waste Option */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginRight: 10, paddingVertical: 18 }}
              onPress={handleWasteModalOk}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-bin-outline" size={38} color="#6C63FF" style={{ marginBottom: 8 }} />
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>Public Waste</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13 }}>Free service</ThemedText>
            </TouchableOpacity>
            {/* Personal Waste Option */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginLeft: 10, paddingVertical: 18 }}
              onPress={handlePersonalWaste}
              activeOpacity={0.85}
            >
              {/* Paid Ribbon */}
              <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#E87A1D', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, zIndex: 2 }}>
                <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>Paid</ThemedText>
              </View>
              <Ionicons name="person-outline" size={38} color="#E87A1D" style={{ marginBottom: 8 }} />
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>Personal Waste</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13 }}>Paid service</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Waste Success Modal */}
      <Modal
        isVisible={wasteSuccessModalVisible}
        onBackdropPress={() => setWasteSuccessModalVisible(false)}
        onSwipeComplete={() => setWasteSuccessModalVisible(false)}
        swipeDirection={["down"]}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropTransitionOutTiming={0}
        propagateSwipe
      >
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 66, minHeight: 280, elevation: 10 }}>
          {/* Close button at middle bottom */}
          <TouchableOpacity onPress={() => setWasteSuccessModalVisible(false)} style={{ alignSelf: 'center', position: 'absolute', bottom: 15, paddingTop: 10, marginTop: 20 }}>
            <Ionicons name="close-circle-outline" size={32} color="#bbb" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginBottom: 18, marginTop: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#eee', marginBottom: 12 }} />
            <ThemedText style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 2 }}>
              {wasteSuccessType === 'public' ? 'Public Waste' : 'Personal Waste'}
            </ThemedText>
            <ThemedText style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>Request Submitted Successfully</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
            {/* New Request */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginRight: 10, paddingVertical: 18 }}
              onPress={() => {
                setWasteSuccessModalVisible(false);
                if (wasteSuccessType === 'public') {
                  router.push('/PublicWasteForm');
                } else {
                  router.push('/PersonalWasteForm');
                }
              }}
              activeOpacity={0.85}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8EAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="add-circle-outline" size={28} color="#6C63FF" />
              </View>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>New Request</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13 }}>Submit another request</ThemedText>
            </TouchableOpacity>
            {/* Track Requests */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginLeft: 10, paddingVertical: 18 }}
              onPress={() => { setWasteSuccessModalVisible(false); router.push('/Bookings'); }}
              activeOpacity={0.85}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F6F2', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="list-circle-outline" size={28} color="#43A047" />
              </View>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>Track Requests</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>View all your requests</ThemedText>
            </TouchableOpacity>
          </View>
          {/* Help & Support */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginTop: 18, paddingVertical: 18, paddingHorizontal: 16 }}
            onPress={() => { setWasteSuccessModalVisible(false); router.push('/HelpSupport'); }}
            activeOpacity={0.85}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF6ED', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="help-circle-outline" size={28} color="#E87A1D" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>Help & Support</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13 }}>Contact for escalation</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* Complaint Modal */}
      <Modal
        isVisible={complaintModalVisible}
        onBackdropPress={() => setComplaintModalVisible(false)}
        onSwipeComplete={() => setComplaintModalVisible(false)}
        swipeDirection={["down"]}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropTransitionOutTiming={0}
        propagateSwipe
      >
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 66, minHeight: 280, elevation: 10 }}>
          {/* Close button at middle bottom */}
          <TouchableOpacity onPress={() => setComplaintModalVisible(false)} style={{ alignSelf: 'center', position: 'absolute', bottom: 15, paddingTop: 10,marginTop: 20 }}>
            <Ionicons name="close-circle-outline" size={32} color="#bbb" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginBottom: 18, marginTop: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#eee', marginBottom: 12 }} />
            <ThemedText style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 2 }}>Complaints & Support</ThemedText>
            <ThemedText style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>Choose an option</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
            {/* New Complaint */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginRight: 10, paddingVertical: 18 }}
              onPress={() => { setComplaintModalVisible(false); router.push('/NewComplaintForm'); }}
              activeOpacity={0.85}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8EAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="add-circle-outline" size={28} color="#6C63FF" />
              </View>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>New Complaint</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13 }}>Submit a new complaint</ThemedText>
            </TouchableOpacity>
            {/* Your Complaints */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginLeft: 10, paddingVertical: 18 }}
              onPress={() => { setComplaintModalVisible(false); router.push('/Bookings'); }}
              activeOpacity={0.85}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F6F2', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="list-circle-outline" size={28} color="#43A047" />
              </View>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>Your Complaints</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>Track all complaints</ThemedText>
            </TouchableOpacity>
          </View>
          {/* Help & Support */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginTop: 18, paddingVertical: 18, paddingHorizontal: 16 }}
            onPress={() => { setComplaintModalVisible(false); router.push('/HelpSupport'); }}
            activeOpacity={0.85}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF6ED', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="help-circle-outline" size={28} color="#E87A1D" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>Help & Support</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13 }}>Contact information for escalation</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* Kalyan Mandap Modal */}
      <Modal
        isVisible={kalyanModalVisible}
        onBackdropPress={() => setKalyanModalVisible(false)}
        onSwipeComplete={() => setKalyanModalVisible(false)}
        swipeDirection={["down"]}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropTransitionOutTiming={0}
        propagateSwipe
      >
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 66, minHeight: 280, elevation: 10 }}>
          {/* Close button at middle bottom */}
          <TouchableOpacity onPress={() => setKalyanModalVisible(false)} style={{ alignSelf: 'center', position: 'absolute', bottom: 15, paddingTop: 10, marginTop: 20 }}>
            <Ionicons name="close-circle-outline" size={32} color="#bbb" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginBottom: 18, marginTop: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#eee', marginBottom: 12 }} />
            <ThemedText style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 2 }}>Kalyan Mandap</ThemedText>
            <ThemedText style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>Choose an option</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
            {/* Kalyan Mandap Option */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginRight: 10, paddingVertical: 18 }}
              onPress={() => { setKalyanModalVisible(false); router.push('/KalyanMandapBooking'); }}
              activeOpacity={0.85}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8EAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="business-outline" size={28} color="#6C63FF" />
              </View>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>Kalyan Mandap</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>Book or view details</ThemedText>
            </TouchableOpacity>
            {/* Your Bookings Option */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginLeft: 10, paddingVertical: 18 }}
              onPress={() => { setKalyanModalVisible(false); router.push('/Bookings'); }}
              activeOpacity={0.85}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F6F2', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="list-circle-outline" size={28} color="#43A047" />
              </View>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>Your Bookings</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>Track all bookings</ThemedText>
            </TouchableOpacity>
          </View>
          {/* Help & Support */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginTop: 18, paddingVertical: 18, paddingHorizontal: 16 }}
            onPress={() => { setKalyanModalVisible(false); router.push('/HelpSupport'); }}
            activeOpacity={0.85}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF6ED', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="help-circle-outline" size={28} color="#E87A1D" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>Help & Support</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13 }}>Contact information for escalation</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* Pollution Control Modal */}
      <Modal
        isVisible={pollutionModalVisible}
        onBackdropPress={() => setPollutionModalVisible(false)}
        onSwipeComplete={() => setPollutionModalVisible(false)}
        swipeDirection={["down"]}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropTransitionOutTiming={0}
        propagateSwipe
      >
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 66, minHeight: 280, elevation: 10 }}>
          {/* Close button at middle bottom */}
          <TouchableOpacity onPress={() => setPollutionModalVisible(false)} style={{ alignSelf: 'center', position: 'absolute', bottom: 15, paddingTop: 10, marginTop: 20 }}>
            <Ionicons name="close-circle-outline" size={32} color="#bbb" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginBottom: 18, marginTop: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#eee', marginBottom: 12 }} />
            <ThemedText style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 2 }}>Pollution Control & Support</ThemedText>
            <ThemedText style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>Choose an option</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
            {/* New Pollution Complaint */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginRight: 10, paddingVertical: 18 }}
              onPress={() => { setPollutionModalVisible(false); router.push('/PollutionComplaintForm'); }}
              activeOpacity={0.85}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8EAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="add-circle-outline" size={28} color="#6C63FF" />
              </View>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20', textAlign: 'center' }}>New Pollution Complaint</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>Submit a new pollution complaint</ThemedText>
            </TouchableOpacity>
            {/* Your Pollution Complaints */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginLeft: 10, paddingVertical: 18 }}
              onPress={() => { setPollutionModalVisible(false); router.push('/Bookings'); }}
              activeOpacity={0.85}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F6F2', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="list-circle-outline" size={28} color="#43A047" />
              </View>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20', textAlign: 'center' }}>Your Pollution Complaints</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>Track all pollution complaints</ThemedText>
            </TouchableOpacity>
          </View>
          {/* Help & Support */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginTop: 18, paddingVertical: 18, paddingHorizontal: 16 }}
            onPress={() => { setPollutionModalVisible(false); router.push('/HelpSupport'); }}
            activeOpacity={0.85}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF6ED', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="help-circle-outline" size={28} color="#E87A1D" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>Help & Support</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13 }}>Contact information for escalation</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* Cesspool Modal (same as Complaint Modal, with text changes) */}
      <Modal
        isVisible={cesspoolModalVisible}
        onBackdropPress={() => setCesspoolModalVisible(false)}
        onSwipeComplete={() => setCesspoolModalVisible(false)}
        swipeDirection={["down"]}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropTransitionOutTiming={0}
        propagateSwipe
      >
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 66, minHeight: 280, elevation: 10 }}>
          {/* Close button at middle bottom */}
          <TouchableOpacity onPress={() => setCesspoolModalVisible(false)} style={{ alignSelf: 'center', position: 'absolute', bottom: 15, paddingTop: 10,marginTop: 20 }}>
            <Ionicons name="close-circle-outline" size={32} color="#bbb" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginBottom: 18, marginTop: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#eee', marginBottom: 12 }} />
            <ThemedText style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 2 }}>Cesspool Services</ThemedText>
            <ThemedText style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>Choose an option</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
            {/* New Cesspool Request */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginRight: 10, paddingVertical: 18, paddingHorizontal: 8 }}
              onPress={() => { setCesspoolModalVisible(false); router.push('/NewCesspoolRequest'); }}
              activeOpacity={0.85}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8EAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="add-circle-outline" size={28} color="#6C63FF" />
              </View>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20', textAlign: 'center' }}>New Cesspool Request</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13, textAlign: 'center', paddingHorizontal: 2 }}>Submit a new cesspool request</ThemedText>
            </TouchableOpacity>
            {/* Your Cesspool Requests */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginLeft: 10, paddingVertical: 18, paddingHorizontal: 8 }}
              onPress={() => { setCesspoolModalVisible(false); router.push('/Bookings'); }}
              activeOpacity={0.85}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F6F2', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="list-circle-outline" size={28} color="#43A047" />
              </View>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20', textAlign: 'center' }}>Your Cesspool Requests</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13, textAlign: 'center', paddingHorizontal: 2 }}>Track all cesspool requests</ThemedText>
            </TouchableOpacity>
          </View>
          {/* Help & Support */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 16, marginTop: 18, paddingVertical: 18, paddingHorizontal: 16 }}
            onPress={() => { setCesspoolModalVisible(false); router.push('/HelpSupport'); }}
            activeOpacity={0.85}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF6ED', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="help-circle-outline" size={28} color="#E87A1D" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#181A20' }}>Help & Support</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 13 }}>Contact for escalation</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </ThemedView>
  );
}
