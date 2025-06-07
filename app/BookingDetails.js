import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ImageView from 'react-native-image-viewing';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { showToast } from '../components/toastHelper';

import { Ionicons } from '@expo/vector-icons';

export default function BookingDetails() {
  const router = useRouter();
  const { id, service_type } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        console.log('Fetching booking details for ID:', id, 'Service Type:', service_type);
        const token = await AsyncStorage.getItem('access');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`https://mobile.wemakesoftwares.com/api/user/eachbooking/?service_type=${encodeURIComponent(service_type)}&id=${id}`, { headers });
        const data = await res.json();
        setDetails(data);
      } catch (_e) {
        showToast('error', 'Error', 'Failed to fetch booking details');
      }
      setLoading(false);
    };
    if (id && service_type) fetchDetails();
  }, [id, service_type]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!details || Object.keys(details).length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ThemedText style={{ color: '#888' }}>No details found.</ThemedText>
      </View>
    );
  }

  // Determine booking type
  let bookingType = '';
  if (details.mandap_name) bookingType = 'mandap';
  else if (details.service_type && details.service_type.toLowerCase().includes('waste')) bookingType = 'waste';
  else if (details.service_type && details.service_type.toLowerCase().includes('pollution')) bookingType = 'pollution';
  else if (details.service_type && details.service_type.toLowerCase() === 'cesspool') bookingType = 'cesspool';
  else if (details.service_type && (details.service_type.toLowerCase() === 'complaint' || details.service_type.toLowerCase() === 'complaints')) bookingType = 'complaints';
  else bookingType = details.service_type || 'other';

  // Prepare images for each type
  let images = [];
  if (bookingType === 'mandap' && details.kalyanmandap_images && Array.isArray(details.kalyanmandap_images)) {
    images = details.kalyanmandap_images.map(img => ({ uri: img.image.startsWith('http') ? img.image : `https://mobile.wemakesoftwares.com${img.image}` }));
  } else if (bookingType === 'complaints' && details.complaint_images && Array.isArray(details.complaint_images)) {
    images = details.complaint_images.map(img => ({ uri: img.image.startsWith('http') ? img.image : `https://mobile.wemakesoftwares.com${img.image}` }));
  } else if (bookingType === 'pollution' && details.pollution_images && Array.isArray(details.pollution_images)) {
    images = details.pollution_images.map(img => ({ uri: img.image.startsWith('http') ? img.image : `https://mobile.wemakesoftwares.com${img.image}` }));
  } else if (bookingType === 'cesspool' && details.cesspool_images && Array.isArray(details.cesspool_images)) {
    images = details.cesspool_images.map(img => ({ uri: img.image.startsWith('http') ? img.image : `https://mobile.wemakesoftwares.com${img.image}` }));
  } else if (details.request_images && Array.isArray(details.request_images)) {
    images = details.request_images.map(img => ({ uri: img.image.startsWith('http') ? img.image : `https://mobile.wemakesoftwares.com${img.image}` }));
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#fff', padding: 0 }}>
      {/* Header with back button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 18, paddingBottom: 10, paddingHorizontal: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', elevation: 2 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6, marginRight: 8, borderRadius: 20, backgroundColor: '#F5F6F7' }}>
          <Ionicons name="arrow-back" size={24} color="#181A20" />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: '#181A20' }}>Booking Details</ThemedText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 0 }}>
        <View style={styles.card}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            {/* Dynamic title */}
            <ThemedText style={{ fontWeight: 'bold', fontSize: 18, color: '#181A20', marginBottom: 2 }}>
              {bookingType === 'mandap' && 'Mandap Booking'}
              {bookingType === 'waste' && 'Waste Pickup'}
              {bookingType === 'pollution' && 'Pollution Report'}
              {bookingType === 'complaints' && 'Complaint'}
              {bookingType === 'cesspool' && 'Cess pool'}
              {bookingType === 'other' && (details.service_type || 'Misc')}
            </ThemedText>
            {/* Show details for each type */}
            {bookingType === 'mandap' && (
              <>
                <ThemedText style={{ color: '#6C6C6C', fontSize: 15, marginBottom: 2 }}>Mandap Name: {details.mandap_name}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Description: {details.mandap_description}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Address: {details.mandap_address}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Contact: {details.mandap_contact_number}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Capacity: {details.mandap_capacity}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Amenities: {details.mandap_amenities}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Minimum Booking Unit: {details.mandap_minimum_booking_unit}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Price Note: {details.mandap_price_note}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Occasion: {details.occasion}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Number of People: {details.number_of_people}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Start: {details.start_datetime ? new Date(details.start_datetime).toLocaleString() : ''}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>End: {details.end_datetime ? new Date(details.end_datetime).toLocaleString() : ''}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Duration: {details.duration} hours</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Additional Requests: {details.additional_requests}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Payment Method: {details.payment_method}</ThemedText>
                <ThemedText style={{ color: details.status === 'approved' ? '#43A047' : '#E87A1D', fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>Status: {details.status ? details.status.charAt(0).toUpperCase() + details.status.slice(1) : ''}</ThemedText>
                {details.comment && <ThemedText style={{ color: '#E87A1D', fontSize: 13, marginTop: 4 }}>Comment: {details.comment}</ThemedText>}
              </>
            )}
            {bookingType === 'waste' && (
              <>
                <ThemedText style={{ color: '#6C6C6C', fontSize: 15, marginBottom: 2 }}>{details.type} Waste</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 15, marginBottom: 2 }}>{details.waste_type}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Booking ID: {details.id}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Status: <ThemedText style={{ color: details.status === 'approved' ? '#43A047' : '#E87A1D', fontWeight: 'bold' }}>{details.status ? details.status.charAt(0).toUpperCase() + details.status.slice(1) : ''}</ThemedText></ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Payment: <ThemedText style={{ color: details.payment_status ? '#43A047' : '#E87A1D', fontWeight: 'bold' }}>{details.payment_status ? 'Paid' : 'Not Paid'}</ThemedText></ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Time: {details.time_slot}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Contact: {details.contact_number}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Location: {details.location}</ThemedText>
                {details.comment && <ThemedText style={{ color: '#E87A1D', fontSize: 13, marginTop: 4 }}>Notice: {details.comment}</ThemedText>}
              </>
            )}
            {bookingType === 'pollution' && (
              <>
                <ThemedText style={{ color: '#6C6C6C', fontSize: 15, marginBottom: 2 }}>Type: {details.type_name}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Location: {details.location}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Address: {details.address}</ThemedText>
                <ThemedText style={{ color: details.status === 'approved' ? '#43A047' : '#E87A1D', fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>Status: {details.status ? details.status.charAt(0).toUpperCase() + details.status.slice(1) : ''}</ThemedText>
                {details.comment && <ThemedText style={{ color: '#E87A1D', fontSize: 13, marginTop: 4 }}>Comment: {details.comment}</ThemedText>}
              </>
            )}
            {bookingType === 'cesspool' && (
              <>
                <ThemedText style={{ color: '#6C6C6C', fontSize: 15, marginBottom: 2 }}>Name: {details.name}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Contact: {details.contact_number}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Location: {details.location}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Address: {details.address}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Description: {details.description}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Tank Type: {details.waste_tank_type}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Capacity: {details.capacity}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Urgency: {details.urgency_level}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Preferred Date/Time: {details.preferred_datetime ? new Date(details.preferred_datetime).toLocaleString() : ''}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Accessibility Note: {details.accessibility_note}</ThemedText>
                <ThemedText style={{ color: details.status === 'approved' ? '#43A047' : '#E87A1D', fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>Status: {details.status ? details.status.charAt(0).toUpperCase() + details.status.slice(1) : ''}</ThemedText>
                {details.comment && <ThemedText style={{ color: '#E87A1D', fontSize: 13, marginTop: 4 }}>Comment: {details.comment}</ThemedText>}
              </>
            )}
            {bookingType === 'complaints' && (
              <>
                <ThemedText style={{ color: '#6C6C6C', fontSize: 15, marginBottom: 2 }}>Complainant: {details.user_name}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Category: {details.category_name}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Subcategory: {details.subcategory_name}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Description: {details.description}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Address: {details.address}</ThemedText>
                <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Location: {details.location}</ThemedText>
                <ThemedText style={{ color: details.status === 'approved' ? '#43A047' : details.status === 'pending' ? '#E87A1D' : '#E53935', fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>Status: {details.status ? details.status.charAt(0).toUpperCase() + details.status.slice(1) : ''}</ThemedText>
                {details.comment && <ThemedText style={{ color: '#E87A1D', fontSize: 13, marginTop: 4 }}>Comment: {details.comment}</ThemedText>}
              </>
            )}
          </View>
          {/* Images Section */}
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: 14, paddingBottom: 0, paddingTop: 10 }}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setImageViewerIndex(idx);
                    setImageViewerVisible(true);
                  }}
                  activeOpacity={0.85}
                  style={{ marginRight: 10, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' }}
                >
                  <Image
                    source={{ uri: img.uri }}
                    style={{ width: 120, height: 90, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {/* Details Section for waste only */}
          {bookingType === 'waste' && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Details</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 15, marginBottom: 2 }}>Waste Type: {details.waste_type}</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 15, marginBottom: 2 }}>Payment Method: {details.payment_method}</ThemedText>
              {details.description && <ThemedText style={{ color: '#888', fontSize: 15, marginBottom: 2 }}>Description: {details.description}</ThemedText>}
            </View>
          )}
          {/* Location Section - as text display for all types */}
          {details.location && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Location</ThemedText>
              <ThemedText style={{ color: '#888', fontSize: 15, marginBottom: 2 }}>
                 Location: {details.location}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Image Viewer Modal */}
      <ImageView
        images={images}
        imageIndex={imageViewerIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
        backgroundColor="#181A20"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#181A20',
  },
  card: {
    backgroundColor: '#F5F6F7',
    borderRadius: 18,
    margin: 16,
    marginTop: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    padding: 0,
  },
  headerSection: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#fff',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  section: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  sectionTitle: {
    color: '#181A20',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden'
  },
  map: {
    flex: 1
  }
});
