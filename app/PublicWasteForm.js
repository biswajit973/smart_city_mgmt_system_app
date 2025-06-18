import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { showToast } from '../components/toastHelper';
import FloatingLabelInput from '../components/ui/FloatingLabelInput';
import { API_BASE_URL } from '../constants/api';

const WASTE_OPTIONS = [
  'Drainage Blockage',
  'Dead Animal on Road',
  'Tree Branches Fallen on Road',
  'Dry Leaves Accumulated on Road',
  'Garbage Dumped on Open Ground',
  'Overflowing Public Dustbin',
  'Waste Spilled on Footpath',
  'Waste Blockage Near Public Facility (e.g. School, Hospital)',
  'Waterlogging with Trash',
  'Roadside Construction Debris (Small amount, unattended)',
  'Other',
];

export default function PublicWasteForm() {
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState('');
  const [otherType, setOtherType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [images, setImages] = useState([]); // Multiple images
  const [showTypeOptions, setShowTypeOptions] = useState(false);
  const [mapModal, setMapModal] = useState(false);
  const [marker, setMarker] = useState(null);
  const [showMapOk, setShowMapOk] = useState(false);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dropdownError, setDropdownError] = useState('');
  const [imageError, setImageError] = useState('');
  // Add error states for each input
  const [errors, setErrors] = useState({
    otherType: '',
    description: '',
    location: '',
    address: '',
    contact: '',
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setMarker({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        let geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (geo && geo.length > 0) {
          setLocation(`${geo[0].name || ''} ${geo[0].street || ''}, ${geo[0].city || geo[0].district || ''}`);
        }
      }
    })();
    setContact('');
  }, []);

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, ...result.assets.map(a => a.uri)]);
    }
  };

  const removeImage = idx => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    // Validation
    let newErrors = {
      otherType: '',
      description: '',
      location: '',
      address: '',
      contact: '',
    };
    let hasError = false;
    setDropdownError('');
    setImageError('');
    if (!selectedType) {
      setDropdownError('Type of waste is required');
      hasError = true;
    }
    if (selectedType === 'Other' && !otherType.trim()) {
      newErrors.otherType = 'Please specify the waste type';
      hasError = true;
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
      hasError = true;
    }
    if (!location.trim()) {
      newErrors.location = 'Location is required';
      hasError = true;
    }
    if (!address.trim()) {
      newErrors.address = 'Address is required';
      hasError = true;
    }
    const phoneRegex = /^\d{10}$/;
    if (!contact.trim()) {
      newErrors.contact = 'Contact number is required';
      hasError = true;
    } else if (!phoneRegex.test(contact.trim())) {
      newErrors.contact = 'Enter a valid 10-digit phone number';
      hasError = true;
    }
    if (!images.length) {
      setImageError('Please upload at least one photo');
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;
    setSubmitting(true);
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('type', 'Public Waste');
      formData.append('waste_type', selectedType);
      if (selectedType === 'Other') {
        formData.append('waste_type_other', otherType);
      }
      formData.append('description', description);
      formData.append('location', location);
      formData.append('contact_number', contact);
      formData.append('payment_method', "0");
      images.forEach((uri, idx) => {
        let name = uri.split('/').pop();
        let type = 'image/jpeg';
        if (name && name.endsWith('.png')) type = 'image/png';
        formData.append('request_images', {
          uri,
          name: name || `photo_${idx}.jpg`,
          type,
        });
      });

      // Print extra fields
      console.log('Address:', address);

      // Get auth token
      const token = await AsyncStorage.getItem('access');
      console.log('Auth Token:', token);

      // API call
      const res = await fetch(`${API_BASE_URL}/api/waste_mgmt/create/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const data = await res.json();
      if (res.status === 201) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          router.replace('/(tabs)/Bookings');
        }, 3000);
        return;
      } else {
        console.log('Error response:', data);
        showToast('error', data.message || 'Failed to create request');
      }
    } catch (err) {
      showToast('error', 'Network error', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let localSound;
    if (showSuccess) {
      (async () => {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/success.mp3')
        );
        localSound = sound;
        await sound.playAsync();
      })();
    }
    return () => {
      if (localSound) {
        localSound.unloadAsync();
      }
    };
  }, [showSuccess]);

  if (showSuccess) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <LottieView
          source={require('../assets/Animation - 1747848194852.json')}
          autoPlay
          loop={false}
          style={{ width: 180, height: 180 }}
          resizeMode="cover"
        />
        <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: '#19e38a', marginTop: 18 }}>Request Submitted!</ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      enabled
    >
      <ThemedView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={26} color="#181A20" />
          </TouchableOpacity>
          <ThemedText style={styles.header}>Public Waste Form</ThemedText>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          bounces={false}
        >
          <ThemedText style={styles.label}>Type of Waste</ThemedText>
          <View style={styles.dropdownBox}>
            <Picker
              selectedValue={selectedType}
              onValueChange={(itemValue) => setSelectedType(itemValue)}
              style={{ color: '#181A20' }}
            >
              <Picker.Item label="---Select---" value="" color="#181A20" />
              {WASTE_OPTIONS.map((option, idx) => (
                <Picker.Item key={idx} label={option} value={option} color="#181A20" />
              ))}
            </Picker>
          </View>
          {dropdownError ? (
            <Text style={{ color: '#E53935', marginTop: 2, marginLeft: 2, fontSize: 13 }}>{dropdownError}</Text>
          ) : null}
          {selectedType === 'Other' && (
            <FloatingLabelInput
              label="Please specify"
              value={otherType}
              onChangeText={setOtherType}
              error={errors.otherType}
              multiline
              style={{ minHeight: 60, maxHeight: 200, textAlignVertical: 'top' }}
            />
          )}
          <ThemedText style={styles.label}>Upload Photos</ThemedText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            {images.length < 5 && (
              <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
                <Ionicons name="camera-outline" size={36} color="#aaa" />
                <ThemedText style={{ color: '#888', marginTop: 6 }}>Choose Photos</ThemedText>
              </TouchableOpacity>
            )}
            {images.map((img, idx) => (
              <View key={idx} style={{ position: 'relative', marginRight: 8, marginBottom: 8 }}>
                <Image source={{ uri: img }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                <TouchableOpacity onPress={() => removeImage(idx)} style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12, padding: 2, elevation: 2 }}>
                  <Ionicons name="close-circle" size={20} color="#E53935" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {imageError ? (
            <Text style={{ color: '#E53935', marginTop: -4, marginBottom: 4, marginLeft: 2, fontSize: 13 }}>{imageError}</Text>
          ) : null}
          <ThemedText style={styles.label}>Description</ThemedText>
          <FloatingLabelInput
            label="Describe the waste, location, etc."
            value={description}
            onChangeText={setDescription}
            error={errors.description}
            multiline
            style={{ minHeight: 80, maxHeight: 200, textAlignVertical: 'top' }}
          />
          <ThemedText style={styles.label}>Location</ThemedText>
          <TouchableOpacity onPress={() => setMapModal(true)}>
            <View style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}> 
              <Ionicons name="location-outline" size={20} color="#E87A1D" style={{ marginRight: 8 }} />
              <Text style={{ color: '#181A20', fontSize: 15, flex: 1 }}>{location || 'Choose location on map'}</Text>
              <Ionicons name="map-outline" size={20} color="#888" />
            </View>
          </TouchableOpacity>
          <FloatingLabelInput
            label="Enter complete address"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
            multiline
            style={{ minHeight: 60, maxHeight: 200, textAlignVertical: 'top',marginTop:8, marginBottom: 8 }}
          />
          <Modal
            isVisible={mapModal}
            animationType="slide"
            onBackdropPress={() => setMapModal(false)}
            onSwipeComplete={() => setMapModal(false)}
            swipeDirection={["down"]}
            style={{ margin: 0, justifyContent: 'flex-end' }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#181A20' }}>Location: {location || 'No location selected'}</Text>
              </View>
              <TouchableOpacity onPress={() => setMapModal(false)} style={{ position: 'absolute', top: 40, right: 20, backgroundColor: '#fff', borderRadius: 20, padding: 8, elevation: 4 }}>
                <Ionicons name="close" size={28} color="#E53935" />
              </TouchableOpacity>
              {showMapOk && (
                <TouchableOpacity onPress={() => {
                  setLocation(`${marker.latitude}, ${marker.longitude}`);
                  setMapModal(false);
                  setShowMapOk(false);
                }} style={{ position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#E87A1D', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 32, elevation: 4 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Set Location</Text>
                </TouchableOpacity>
              )}
            </View>
          </Modal>
          <ThemedText style={styles.label}>Contact Number</ThemedText>
          <FloatingLabelInput
            label="Contact Number"
            value={contact}
            onChangeText={setContact}
            error={errors.contact}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            <ThemedText style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Request'}</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181A20',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
    marginTop: 18,
    color: '#181A20',
  },
  dropdownBox: {
    backgroundColor: '#F5F6F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 4,
    overflow: 'hidden',
  },
  input: {
    backgroundColor: '#F5F6F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#181A20',
    marginBottom: 4,
  },
  uploadBox: {
    backgroundColor: '#F5F6F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    marginBottom: 4,
    flexDirection: 'column',
    alignSelf: 'flex-start',
  },
  submitBtn: {
    backgroundColor: '#181A20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 30,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
