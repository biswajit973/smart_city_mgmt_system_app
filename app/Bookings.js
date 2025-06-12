import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNotification } from '../components/NotificationContext';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { showToast } from '../components/toastHelper';
import AccountDetailsScreen from './AccountDetails';

const STATUS_COLORS = {
  pending: '#E87A1D', // Orange
  initiated: '#E87A1D',
  ongoing: '#E87A1D',
  completed: '#43A047', // Green
  rejected: '#E53935', // Red
  cancelled: '#E53935',
};

const SERVICE_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'mandap', label: 'Kalyan Mandap' },
  { key: 'waste', label: 'Waste Pickup' },
  // { key: 'pollution', label: 'Pollution' }, // Added pollution filter
  { key: 'complaints', label: 'Complaints' },
  { key: 'cesspool', label: 'Cess pool' }, // <-- Add this line
  { key: 'misc', label: 'Misc' },
];

export default function AllBookings() {
  const router = useRouter();
  const { setNotifModalVisible, notificationCount } = useNotification();
  const [accountModalVisible, setAccountModalVisible] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState('active');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  React.useLayoutEffect(() => {
    if (router?.setOptions) {
      router.setOptions({ tabBarStyle: { display: 'flex' } });
    }
  }, [router]);

  // Effect to check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('access');
        if (!token) {
          router.replace('/Login');
          return;
        }
        setCheckingAuth(false);
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('access');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const type = typeFilter;
        // Map UI tab to API status param
        const statusParam = tab === 'past' ? 'notactive' : 'active';
        const url = `https://mobile.wemakesoftwares.com/api/user/bookings/?status=${statusParam}&type=${type}`;
        // console.log('Fetching bookings from:', url);
        const res = await fetch(url, { headers });
        const data = await res.json();
        // Handle new API structure
        // console.log('Fetched bookings:', data);
        
        let merged = [];
        if (data) {
          if (Array.isArray(data)) {
            merged = data;
          } else if (typeof data === 'object') {
            if (Array.isArray(data.waste_bookings)) merged = merged.concat(data.waste_bookings);
            if (Array.isArray(data.mandap_bookings)) merged = merged.concat(data.mandap_bookings);
            if (Array.isArray(data.pollution_bookings)) merged = merged.concat(data.pollution_bookings);
            if (Array.isArray(data.complaints_bookings)) merged = merged.concat(data.complaints_bookings);
            if (Array.isArray(data.cesspool_bookings)) merged = merged.concat(data.cesspool_bookings);
          }
        }
        setBookings(merged);
        if (tab === 'past') {
          console.log('Statuses in past tab:', merged.map(b => b.status));
        }
      } catch (_e) {
        showToast('error', 'Error', 'Failed to fetch bookings');
        setBookings([]);
      }
      setLoading(false);
    };
    fetchBookings();
  }, [tab, typeFilter]);
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
    } catch (_error) {
      showToast('error', 'Logout failed', 'An error occurred while logging out.');
    }
  };// Status map for filtering after API fetch
  const statusMap = {
    active: ['pending', 'scheduled'],
    past: ['completed', 'approved'],
  };

  const filterByType = (booking) => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'kalyanmandap') return booking.mandap_name;
    if (typeFilter === 'waste') return (booking.service_type && booking.service_type.toLowerCase().includes('waste'));
    if (typeFilter === 'pollution') return (booking.service_type && booking.service_type.toLowerCase().includes('pollution'));
    if (typeFilter === 'complaints') return booking.service_type && (booking.service_type.toLowerCase() === 'complaint' || booking.service_type.toLowerCase() === 'complaints');
    if (typeFilter === 'cesspool') return booking.service_type && booking.service_type.toLowerCase() === 'cesspool';
    if (typeFilter === 'misc') return booking.service_type === 'misc';
    return true;
  };

  // Filtering bookings
  const filteredBookings = tab === 'past'
    ? bookings.filter(filterByType).filter(b => {
        if (!search) return true;
        const s = search.toLowerCase();
        // Search relevant fields for each booking type
        return (
          (b.mandap_name && b.mandap_name.toLowerCase().includes(s)) ||
          (b.occasion && b.occasion.toLowerCase().includes(s)) ||
          (b.waste_type && b.waste_type.toLowerCase().includes(s)) ||
          (b.type && b.type.toLowerCase().includes(s)) ||
          (b.category_name && b.category_name.toLowerCase().includes(s)) ||
          (b.description && b.description.toLowerCase().includes(s)) ||
          (b.location && b.location.toLowerCase().includes(s)) ||
          (b.address && b.address.toLowerCase().includes(s)) ||
          (b.service_type && b.service_type.toLowerCase().includes(s))
        );
      })
    : bookings
        .filter(b => statusMap[tab].includes((b.status || '').toLowerCase()))
        .filter(filterByType)
        .filter(b => {
          if (!search) return true;
          const s = search.toLowerCase();
          return (
            (typeof b.mandap_name === 'string' && b.mandap_name.toLowerCase().includes(s)) ||
            (typeof b.occasion === 'string' && b.occasion.toLowerCase().includes(s)) ||
            (typeof b.waste_type === 'string' && b.waste_type.toLowerCase().includes(s)) ||
            (typeof b.type === 'string' && b.type.toLowerCase().includes(s)) ||
            (typeof b.category_name === 'string' && b.category_name.toLowerCase().includes(s)) ||
            (typeof b.description === 'string' && b.description.toLowerCase().includes(s)) ||
            (typeof b.location === 'string' && b.location.toLowerCase().includes(s)) ||
            (typeof b.address === 'string' && b.address.toLowerCase().includes(s)) ||
            (typeof b.service_type === 'string' && b.service_type.toLowerCase().includes(s))
          );
        });

  if (checkingAuth) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#fff'}}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ThemedView style={[styles.bg, { flex: 1 }]} contentContainerStyle={styles.container}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerRow}>
            <ThemedText style={styles.header}>All Bookings</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={() => setNotifModalVisible(true)} style={{ position: 'relative' }}>
                <Ionicons name="notifications-outline" size={28} color={"rgb(18, 0, 0)"} />
                {notificationCount > 0 && (
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
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

            </View>
          </View>
          {/* Tab buttons */}
          <View style={{ flexDirection: 'row', marginTop: 10, marginHorizontal: 16 , marginBottom: 10 }}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]}
              onPress={() => setTab('active')}
            >
              <ThemedText style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Active</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'past' && styles.tabBtnActive]}
              onPress={() => setTab('past')}
            >
              <ThemedText style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Past</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{  marginLeft: 16 }}>
            {SERVICE_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.filterBtn, typeFilter === t.key && styles.filterBtnActive]}
                onPress={() => setTypeFilter(t.key)}
              >
                <ThemedText style={[styles.filterText, typeFilter === t.key && styles.filterTextActive]}>{t.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ marginHorizontal: 16, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6F7', borderRadius: 10, paddingHorizontal: 10 }}>
              <Ionicons name="search" size={20} color="#888" style={{ marginRight: 6 }} />
              <TextInput
                placeholder="Search by name or occasion..."
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, backgroundColor: 'transparent', fontSize: 15, paddingVertical: 10 }}
              />
            </View>
          </View>
          {/* Bookings list scrollable only */}
          <View style={{ flex: 200 ,marginBottom: 20 }}>
            {loading ? (
              <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
            ) : filteredBookings.length === 0 ? (
              <ThemedText style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>No bookings found.</ThemedText>
            ) : (
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                {filteredBookings.map((booking) => {
                  // Generate a unique key for each booking
                  let bookingType = '';
                  if (booking.mandap_name) bookingType = 'mandap';
                  else if (booking.service_type && booking.service_type.toLowerCase().includes('waste')) bookingType = 'waste';
                  else if (booking.service_type && booking.service_type.toLowerCase().includes('pollution')) bookingType = 'pollution';
                  else if (booking.service_type && booking.service_type.toLowerCase() === 'cesspool') bookingType = 'cesspool';
                  else if (booking.service_type && (booking.service_type.toLowerCase() === 'complaint' || booking.service_type.toLowerCase() === 'complaints')) bookingType = 'complaints';
                  else bookingType = booking.service_type || 'other';
                  const uniqueKey = `${bookingType}_${booking.id}`;

                  // Card accent color and icon
                  let accentColor = '#E87A1D';
                  let iconName = 'apps';
                  if (bookingType === 'mandap') {
                    accentColor = '#6C63FF';
                    iconName = 'home';
                  } else if (bookingType === 'waste') {
                    accentColor = '#43A047';
                    iconName = 'trash';
                  } else if (bookingType === 'pollution') {
                    accentColor = '#E53935';
                    iconName = 'cloud-outline';
                  } else if (bookingType === 'complaints') {
                    accentColor = '#E53935';
                    iconName = 'alert-circle';
                  }

                  return (
                    <TouchableOpacity
                      key={uniqueKey}
                      style={[
                        styles.bookingCard,
                        {
                          borderColor: accentColor,
                          backgroundColor: '#fff',
                          borderRadius: 16,
                          shadowColor: accentColor,
                          shadowOpacity: 0.08,
                          shadowRadius: 8,
                          elevation: 2,
                          marginBottom: 10, // reduced
                          marginHorizontal: 16,
                          padding: 10, // reduced
                          flexDirection: 'row',
                          alignItems: 'center',
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      {/* Service Icon */}
                      <View style={{
                        width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F6F7', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: accentColor // reduced size and margin
                      }}>
                        <Ionicons
                          name={iconName}
                          size={24}
                          color={accentColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        {/* Title and details */}
                        <ThemedText style={{ fontWeight: 'bold', fontSize: 15, color: '#181A20', marginBottom: 1 }}>
                          {bookingType === 'mandap' && 'Mandap Booking'}
                          {bookingType === 'waste' && 'Waste Pickup'}
                          {bookingType === 'pollution' && 'Pollution Report'}
                          {bookingType === 'complaints' && 'Complaints'}
                          {bookingType === 'cesspool' && 'Cess pool'}
                          {bookingType === 'other' && (booking.service_type || 'Misc')}
                        </ThemedText>
                        {/* Show more info for each type */}
                        {bookingType === 'mandap' && (
                          <>
                            <ThemedText style={{ fontSize: 12, color: '#6C6C6C', marginBottom: 1 }}>{booking.mandap_name}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>Occasion: {booking.occasion}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>People: {booking.number_of_people}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>{booking.start_datetime ? new Date(booking.start_datetime).toLocaleString() : ''}</ThemedText>
                          </>
                        )}
                        {bookingType === 'waste' && (
                          <>
                            <ThemedText style={{ fontSize: 12, color: '#6C6C6C', marginBottom: 1 }}>{booking.type} </ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>Waste Type: {booking.waste_type}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>{booking.time_slot ? `Time: ${booking.time_slot}` : ''}</ThemedText>
                          </>
                        )}
                        {bookingType === 'pollution' && (
                          <>
                            <ThemedText style={{ fontSize: 12, color: '#6C6C6C', marginBottom: 1 }}>{booking.type_name}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>Location: {booking.location}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>Address: {booking.address}</ThemedText>
                          </>
                        )}
                        {bookingType === 'cesspool' && (
                          <>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>Tank Type: {booking.waste_tank_type}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>Capacity: {booking.capacity}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>Urgency: {booking.urgency_level}</ThemedText>
                          </>
                        )}
                        {bookingType === 'complaints' && (
                          <>
                            <ThemedText style={{ fontSize: 12, color: '#6C6C6C', marginBottom: 1 }}>{booking.category_name}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>Description: {booking.description}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: '#888', marginBottom: 1 }}>Location: {booking.location}</ThemedText>
                            {/* Show complaint images if available */}
                
                          </>
                        )}
                        {/* Show images if available */}
                        <TouchableOpacity
                          style={{ marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#181A20', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 }}
                          onPress={() => {
                            let serviceTypeParam = booking.service_type;
                            if (!serviceTypeParam && booking.mandap_name) serviceTypeParam = 'mandap booking';
                            // For complaints and cesspool, ensure correct param
                            if (bookingType === 'complaints') serviceTypeParam = 'complaints';
                            if (bookingType === 'cesspool') serviceTypeParam = 'cesspool';
                            if (bookingType === 'pollution') serviceTypeParam = 'pollution report';
                            if (bookingType === 'waste') serviceTypeParam = 'waste pickup';
                            router.push({ pathname: '/BookingDetails', params: { id: booking.id, service_type: serviceTypeParam } });
                          }}
                        >
                          <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>View Details</ThemedText>
                        </TouchableOpacity>
                      </View>
                      <View style={{ minWidth: 70, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#F5F6F7', marginLeft: 8 }}>
                        <ThemedText style={{ color: accentColor, fontWeight: 'bold', fontSize: 12 }}>{(booking.status || '').charAt(0).toUpperCase() + (booking.status || '').slice(1)}</ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
          {/* Modals remain outside the bookings list scrollview */}
          <Modal
            visible={accountModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setAccountModalVisible(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, minWidth: 260, alignItems: 'center', shadowColor: STATUS_COLORS.pending, shadowOpacity: 0.12, shadowRadius: 12 }}>
                <Ionicons name="person-circle-outline" size={40} color={STATUS_COLORS.pending} style={{ marginBottom: 10 }} />
                <ThemedText style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, color: STATUS_COLORS.pending }}>Account</ThemedText>
                <AccountDetailsScreen />
                <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#E53935', borderRadius: 22, paddingVertical: 10, paddingHorizontal: 32, marginTop: 18 }}>
                  <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Logout</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAccountModalVisible(false)} style={{ marginTop: 16 }}>
                  <ThemedText style={{ color: STATUS_COLORS.pending, fontWeight: 'bold' }}>Close</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    color: '#181A20',
    paddingHorizontal: 16,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    marginHorizontal: 16,
    marginBottom: 10, // reduced from 18
    padding: 10, // reduced from 16
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bookingService: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#181A20',
    marginBottom: 2,
  },
  bookingAddress: {
    fontSize: 13,
    color: '#6C6C6C',
    marginBottom: 2,
  },
  bookingDateTime: {
    fontSize: 13,
    color: '#888',
    marginBottom: 0,
  },
  statusBox: {
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F5F6F7',
    marginLeft: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  tabBtnActive: {
    borderColor: '#000',
  },
  tabTextActive: {
    color: '#000',
  },
  filterBtn: {
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F5F6F7',
    marginRight: 10,
    height: 32,
    justifyContent: 'center',
    marginBottom: 10,
  },
  filterBtnActive: {
    backgroundColor: '"rgb(0, 0, 0)"}',
  },
  filterText: {
    color: '#888',
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#fff',
  },
});
