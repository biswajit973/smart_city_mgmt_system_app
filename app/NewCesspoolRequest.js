import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import FloatingLabelInput from '../components/ui/FloatingLabelInput';

export default function NewCesspoolRequest() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    location: '',
    address: '',
    description: '',
    waste_tank_type: '',
    capacity: '',
    urgency_level: '',
    preferred_datetime: '',
    accessibility_note: '',
    cesspool_images: [],
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showUrgencyModal, setShowUrgencyModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const URGENCY_OPTIONS = ['High', 'Medium', 'Low'];

  // Auto-detect location (like NewComplaintForm)
  useState(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        let geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (geo && geo.length > 0) {
          setFormData(f => ({ ...f, location: `${geo[0].name || ''} ${geo[0].street || ''}, ${geo[0].city || geo[0].district || ''}` }));
        }
      }
    })();
  }, []);

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - formData.cesspool_images.length,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData({
        ...formData,
        cesspool_images: [...formData.cesspool_images, ...result.assets.map(a => a.uri)],
      });
    }
  };

  const removeImage = idx => {
    setFormData({
      ...formData,
      cesspool_images: formData.cesspool_images.filter((_, i) => i !== idx),
    });
  };

  const handleSubmit = async () => {
    let newErrors = {};
    let hasError = false;
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name';
      hasError = true;
    }
    // Contact number validation (10 digits)
    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Please enter contact number';
      hasError = true;
    } else if (!/^\d{10}$/.test(formData.contact_number.trim())) {
      newErrors.contact_number = 'Contact number must be 10 digits';
      hasError = true;
    }
    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
      hasError = true;
    }
    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Please enter address';
      hasError = true;
    }
    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Please enter description';
      hasError = true;
    }
    // Waste tank type validation
    if (!formData.waste_tank_type.trim()) {
      newErrors.waste_tank_type = 'Please enter waste tank type';
      hasError = true;
    }
    // Capacity validation (positive number)
    if (!formData.capacity.trim()) {
      newErrors.capacity = 'Please enter capacity';
      hasError = true;
    } else if (isNaN(formData.capacity) || Number(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
      hasError = true;
    }
    // Urgency level validation
    if (!formData.urgency_level.trim()) {
      newErrors.urgency_level = 'Please select urgency level';
      hasError = true;
    }
    // Preferred datetime validation
    if (!formData.preferred_datetime) {
      newErrors.preferred_datetime = 'Please select preferred date and time';
      hasError = true;
    }
    // At least one image validation
    if (!formData.cesspool_images || formData.cesspool_images.length === 0) {
      newErrors.cesspool_images = 'Please upload at least one photo';
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'cesspool_images') {
          formData.cesspool_images.forEach((uri, idx) => {
            let name = uri.split('/').pop();
            let type = 'image/jpeg';
            if (name && name.endsWith('.png')) type = 'image/png';
            data.append('cesspool_images', {
              uri,
              name: name || `photo_${idx}.jpg`,
              type,
            });
          });
        } else if (key === 'preferred_datetime' && formData.preferred_datetime) {
          // Try to parse the date string, fallback to tempDate if needed
          let dateObj;
          if (typeof formData.preferred_datetime === 'string' && !isNaN(Date.parse(formData.preferred_datetime))) {
            dateObj = new Date(formData.preferred_datetime);
          } else if (tempDate instanceof Date) {
            dateObj = tempDate;
          } else {
            dateObj = new Date();
          }
          // Format as YYYY-MM-DDTHH:mm:ss
          const pad = n => n.toString().padStart(2, '0');
          const iso = `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
          data.append('preferred_datetime', iso);
        } else {
          data.append(key, formData[key]);
        }
      });
      const token = await AsyncStorage.getItem('access');
      const res = await fetch('https://mobile.wemakesoftwares.com/api/cesspool_mgmt/create/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: data,
      });

        setShowSuccessAnimation(true);
        setTimeout(() => {
          setShowSuccessAnimation(false);
          router.replace('/(tabs)/Bookings');
        }, 3000);
    
    } catch (err) {
      console.log('Submission error:', err);
      setErrors({ apiError: 'Network error. Please try again later.' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let localSound;
    if (showSuccessAnimation) {
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
  }, [showSuccessAnimation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      enabled
    >
      <ThemedView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={26} color="#181A20" />
          </TouchableOpacity>
          <ThemedText style={styles.header}>New Cesspool Request</ThemedText>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          bounces={false}
        >
          {/* Name */}
          <ThemedText style={styles.label}>Name</ThemedText>
          <FloatingLabelInput
            label="Enter your name"
            value={formData.name}
            onChangeText={v => setFormData({ ...formData, name: v })}
            error={errors.name}
          />
          {/* Contact Number */}
          <ThemedText style={styles.label}>Contact Number</ThemedText>
          <FloatingLabelInput
            label="Enter contact number"
            value={formData.contact_number}
            onChangeText={v => setFormData({ ...formData, contact_number: v })}
            error={errors.contact_number}
            keyboardType="phone-pad"
          />
          {/* Upload Photos - moved here */}
          <ThemedText style={styles.label}>Upload Photos (Optional, max 5)</ThemedText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            {formData.cesspool_images.length < 5 && (
              <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
                <Ionicons name="camera-outline" size={36} color="#aaa" />
                <ThemedText style={{ color: '#888', marginTop: 6 }}>Choose Photos</ThemedText>
              </TouchableOpacity>
            )}
            {formData.cesspool_images.map((img, idx) => (
              <View key={idx} style={{ position: 'relative', marginRight: 8, marginBottom: 8 }}>
                <Image source={{ uri: img }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                <TouchableOpacity onPress={() => removeImage(idx)} style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12, padding: 2, elevation: 2 }}>
                  <Ionicons name="close-circle" size={20} color="#E53935" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {/* Image error display */}
          {errors.cesspool_images ? (
            <Text style={{ color: 'red', marginBottom: 4, marginLeft: 2 }}>{errors.cesspool_images}</Text>
          ) : null}
          {/* Auto-detected Location */}
          <ThemedText style={styles.label}>Auto-detected Location</ThemedText>
          <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee' }]}> 
            <Ionicons name="location-outline" size={20} color="#E87A1D" style={{ marginRight: 8 }} />
            <Text style={{ color: '#181A20', fontSize: 15, flex: 1 }}>{formData.location || 'Detecting location...'}</Text>
          </View>
          {/* Location error display */}
          {errors.location ? (
            <Text style={{ color: 'red', marginBottom: 4, marginLeft: 2 }}>{errors.location}</Text>
          ) : null}
          {/* Address */}
          <ThemedText style={styles.label}>Address</ThemedText>
          <FloatingLabelInput
            label="Enter address details"
            value={formData.address}
            onChangeText={v => setFormData({ ...formData, address: v })}
            error={errors.address}
            multiline
            style={{ minHeight: 60, maxHeight: 200, textAlignVertical: 'top' }}
          />
          {/* Description */}
          <ThemedText style={styles.label}>Description</ThemedText>
          <FloatingLabelInput
            label="Describe your request"
            value={formData.description}
            onChangeText={v => setFormData({ ...formData, description: v })}
            error={errors.description}
            multiline
            style={{ minHeight: 80, maxHeight: 200, textAlignVertical: 'top' }}
          />
          {/* Waste Tank Type */}
          <ThemedText style={styles.label}>Waste Tank Type</ThemedText>
          <FloatingLabelInput
            label="Type of waste tank"
            value={formData.waste_tank_type}
            onChangeText={v => setFormData({ ...formData, waste_tank_type: v })}
            error={errors.waste_tank_type}
          />
          {/* Capacity */}
          <ThemedText style={styles.label}>Capacity</ThemedText>
          <FloatingLabelInput
            label="Capacity (in liters)"
            value={formData.capacity}
            onChangeText={v => setFormData({ ...formData, capacity: v })}
            error={errors.capacity}
            keyboardType="numeric"
          />
          {/* Urgency Level */}
          <ThemedText style={styles.label}>Urgency Level</ThemedText>
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => setShowUrgencyModal(true)}
          >
            <Text style={{ color: formData.urgency_level ? '#181A20' : '#888', fontSize: 15 }}>
              {formData.urgency_level || '---Select---'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
          <Modal
            isVisible={showUrgencyModal}
            transparent
            animationType="fade"
            onBackdropPress={() => setShowUrgencyModal(false)}
            onSwipeComplete={() => setShowUrgencyModal(false)}
            swipeDirection={["down"]}
            style={{ margin: 0, justifyContent: 'flex-end' }}
          >
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} onPress={() => setShowUrgencyModal(false)}>
              <View style={{ position: 'absolute', top: 180, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 10, elevation: 5, padding: 10 }}>
                <TouchableOpacity key="default" onPress={() => { setFormData({ ...formData, urgency_level: '' }); setShowUrgencyModal(false); }} style={{ paddingVertical: 10 }}>
                  <Text style={{ color: '#888', fontSize: 15 }}>---Select---</Text>
                </TouchableOpacity>
                {URGENCY_OPTIONS.map(option => (
                  <TouchableOpacity key={option} onPress={() => { setFormData({ ...formData, urgency_level: option }); setShowUrgencyModal(false); }} style={{ paddingVertical: 10 }}>
                    <Text style={{ color: '#181A20', fontSize: 15 }}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
          {/* Urgency level error display */}
          {errors.urgency_level ? (
            <Text style={{ color: 'red', marginBottom: 4, marginLeft: 2 }}>{errors.urgency_level}</Text>
          ) : null}
          {/* Preferred Date & Time Picker */}
          <ThemedText style={styles.label}>Preferred Date & Time</ThemedText>
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: formData.preferred_datetime ? '#181A20' : '#888', fontSize: 15 }}>
              {formData.preferred_datetime || 'Select date and time'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#888" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (event.type === 'set' && selectedDate) {
                  setTempDate(selectedDate);
                  setShowDatePicker(false);
                  setShowTimePicker(true);
                } else {
                  setShowDatePicker(false);
                }
              }}
              minimumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={tempDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                if (event.type === 'set' && selectedTime) {
                  const date = new Date(tempDate);
                  date.setHours(selectedTime.getHours());
                  date.setMinutes(selectedTime.getMinutes());
                  setFormData({ ...formData, preferred_datetime: date.toLocaleString() });
                }
                setShowTimePicker(false);
              }}
            />
          )}
          {/* Preferred datetime error display */}
          {errors.preferred_datetime ? (
            <Text style={{ color: 'red', marginBottom: 4, marginLeft: 2 }}>{errors.preferred_datetime}</Text>
          ) : null}
          {/* Accessibility Note */}
          <ThemedText style={styles.label}>Accessibility Note</ThemedText>
          <FloatingLabelInput
            label="Accessibility notes (optional)"
            value={formData.accessibility_note}
            onChangeText={v => setFormData({ ...formData, accessibility_note: v })}
            error={errors.accessibility_note}
            multiline
            style={{ minHeight: 60, maxHeight: 200, textAlignVertical: 'top' }}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            <ThemedText style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Request'}</ThemedText>
          </TouchableOpacity>
        </ScrollView>
        {showSuccessAnimation && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
            <LottieView
              source={require('../assets/Animation - 1747848194852.json')}
              autoPlay
              loop={false}
              style={{ width: 180, height: 180 }}
              resizeMode="cover"
            />
            <Text style={{
              position: 'absolute',
              bottom: '20%',
              fontSize: 18,
              fontWeight: 'bold',
              color: '#19e38a',
            }}>
              Request Submitted!
            </Text>
          </View>
        )}
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
    marginTop: 35,
    marginBottom: 30,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
