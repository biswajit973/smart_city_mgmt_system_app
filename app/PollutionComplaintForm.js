import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { showToast } from '../components/toastHelper';
import FloatingLabelInput from '../components/ui/FloatingLabelInput';

export default function PollutionComplaintForm() {
  const [pollutionTypes, setPollutionTypes] = useState([]); // fetched types
  const [pollutionType, setPollutionType] = useState('');
  const [pollutionCause, setPollutionCause] = useState('');
  const [otherCause, setOtherCause] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({
    pollutionType: '',
    pollutionCause: '',
    otherCause: '',
    manualAddress: '',
    description: '',
  });
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoadingTypes(true);
      setFetchError('');
      try {
        const token = await AsyncStorage.getItem('access');
        const res = await fetch('https://mobile.wemakesoftwares.com/api/pollution_mgmt/categories/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setPollutionTypes(data);
      } catch (_e) {
        setFetchError('Could not load pollution types');
      }
      setLoadingTypes(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('Permission denied');
        setLoadingLocation(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      let geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo && geo.length > 0) {
        setLocation(`${geo[0].name || ''} ${geo[0].street || ''}, ${geo[0].city || geo[0].district || ''}`);
      } else {
        setLocation('Location not found');
      }
      setLoadingLocation(false);
    })();
  }, []);

  const pickImages = async () => {
    if (images.length >= 5) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.7,
    });
    if (!result.canceled) {
      let newImages = result.assets ? result.assets.map(a => a.uri) : [result.uri];
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    // Validation
    let newErrors = {
      pollutionType: '',
      pollutionCause: '',
      otherCause: '',
      manualAddress: '',
      description: '',
    };
    let hasError = false;
    if (!pollutionType) {
      newErrors.pollutionType = 'Pollution type is required';
      hasError = true;
    }
    if (!pollutionCause) {
      newErrors.pollutionCause = 'Pollution cause is required';
      hasError = true;
    }
    if ((pollutionTypes.find(t => t.id === pollutionType)?.subcategories.find(s => s.id === pollutionCause)?.name === 'Other') && !otherCause.trim()) {
      newErrors.otherCause = 'Please specify the other cause';
      hasError = true;
    }
    if (!manualAddress.trim()) {
      newErrors.manualAddress = 'Address is required';
      hasError = true;
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
      hasError = true;
    }
    if (!images.length) {
      showToast('error', 'Please upload at least one photo');
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', pollutionType);
      formData.append('cause', pollutionCause);
      if ((pollutionTypes.find(t => t.id === pollutionType)?.subcategories.find(s => s.id === pollutionCause)?.name === 'Other')) {
        formData.append('other_cause', otherCause);
      }
      formData.append('address', manualAddress);
      formData.append('description', description);
      formData.append('location', location);
      images.forEach((uri, idx) => {
        let name = uri.split('/').pop();
        let type = 'image/jpeg';
        if (name && name.endsWith('.png')) type = 'image/png';
        formData.append('pollution_images', {
          uri,
          name: name || `photo_${idx}.jpg`,
          type,
        });
      });
      const token = await AsyncStorage.getItem('access');
      const res = await fetch('https://mobile.wemakesoftwares.com/api/pollution_mgmt/create/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const data = await res.json();
      const isSuccess =
        res.status === 201 ||
        (typeof data?.message === 'string' && data.message.toLowerCase().includes('success'));
      if (isSuccess) {
        setShowSuccess(true);
      } else {
        showToast('error', 'Submission failed', data?.message || 'Something went wrong');
      }
    } catch (err) {
      showToast('error', 'Network error', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    setTimeout(() => {
      router.replace('/(tabs)/Bookings');
    }, 2000);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <LottieView
          source={require('../assets/Animation - 1747848194852.json')}
          autoPlay
          loop={false}
          style={{ width: 180, height: 180 }}
          resizeMode="cover"
        />
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#19e38a', marginTop: 18 }}>Request Submitted!</Text>
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
      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        bounces={false}
      >
        {/* Header with Back Button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={26} color="#181A20" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#181A20' }}>New Pollution Complaint</Text>
        </View>
        {/* Pollution Type Dropdown */}
        <Text style={styles.label}>Pollution Type</Text>
        {loadingTypes ? (
          <Text style={{ color: '#888', marginBottom: 16 }}>Loading types...</Text>
        ) : fetchError ? (
          <Text style={{ color: 'red', marginBottom: 16 }}>{fetchError}</Text>
        ) : (
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={String(pollutionType)}
              onValueChange={(itemValue) => {
                setPollutionType(itemValue);
                setPollutionCause('');
                setOtherCause('');
              }}
              style={styles.picker}
            >
              <Picker.Item label="--- Select ---" value="" style={{paddingVertical:5}} color="#181A20" />
              {pollutionTypes.map((type) => (
                <Picker.Item key={String(type.id)} label={type.name} value={String(type.id)} color="#181A20" />
              ))}
            </Picker>
          </View>
        )}
        {errors.pollutionType ? (
          <Text style={{ color: 'red', marginBottom: 4, marginLeft: 2 }}>{errors.pollutionType}</Text>
        ) : null}
        {/* Pollution Caused By Dropdown */}
        {pollutionType ? (
          <>
            <Text style={styles.label}>Pollution Caused By</Text>
            <View style={styles.pickerBox}>
              <Picker
                selectedValue={String(pollutionCause)}
                onValueChange={(itemValue) => {
                  setPollutionCause(itemValue);
                  setOtherCause('');
                }}
                style={styles.picker}
              >
                <Picker.Item label="---Select---" value="" color="#181A20" />
                {(pollutionTypes.find(t => String(t.id) === String(pollutionType))?.subcategories || []).map((cause) => {
                  return (
                    <Picker.Item key={String(cause.id)} label={cause.name} value={String(cause.id)} color="#181A20" />
                  );
                })}
              </Picker>
            </View>
            {errors.pollutionCause ? (
              <Text style={{ color: 'red', marginBottom: 4, marginLeft: 2 }}>{errors.pollutionCause}</Text>
            ) : null}
          </>
        ) : null}
        {/* Other Cause Input */}
        {pollutionType && pollutionCause && (pollutionTypes.find(t => t.id === pollutionType)?.subcategories.find(s => s.id === pollutionCause)?.name === 'Other') && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Specify Other Cause *</Text>
            <FloatingLabelInput
              label="Enter cause"
              value={otherCause}
              onChangeText={setOtherCause}
              error={errors.otherCause}
            />
          </View>
        )}
        {/* Images */}
        <Text style={styles.label}>Images (optional, up to 5)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-start' }}>
          {images.length < 5 && (
            <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
              <Ionicons name="camera-outline" size={36} color="#aaa" />
              <Text style={{ color: '#888', marginTop: 6 }}>Choose Photos</Text>
            </TouchableOpacity>
          )}
          {images.map((uri, idx) => (
            <View key={idx} style={styles.imageThumb}>
              <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 ,marginLeft:10}} />
              <TouchableOpacity style={styles.removeImgBtn} onPress={() => setImages(images.filter((_, i) => i !== idx))}>
                <Ionicons name="close-circle" size={20} color="#E53935" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        {/* Location */}
        <Text style={styles.label}>Current Location (auto)</Text>
        <View style={styles.readonlyBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="location-outline" size={18} color="#E87A1D" style={{ marginRight: 8 }} />
            <Text style={{ color: '#181A20' }}>{loadingLocation ? 'Detecting location...' : location}</Text>
          </View>
        </View>        {/* Manual Address */}
        <View style={{ marginTop: 12 }}>
        <View style={{ marginTop: 12 }}>
          <FloatingLabelInput
            label="Enter address"
            value={manualAddress}
            onChangeText={setManualAddress}
            error={errors.manualAddress}
          />
        </View>

        {/* Description */}
        <View style={{ marginTop: 16 }}>
          <FloatingLabelInput
            label="Describe the issue"
            value={description}
            onChangeText={setDescription}
            error={errors.description}
            multiline
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>
</View>
        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, color: '#181A20', textAlign: 'center' },
  label: { fontWeight: 'bold', fontSize: 15, marginBottom: 6, color: '#181A20' },
  pickerBox: { backgroundColor: '#F5F6F7', borderRadius: 10, marginBottom: 16, paddingHorizontal: 4 },
  picker: { height: 52, color: '#181A20', backgroundColor: 'transparent' },
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
  readonlyBox: { backgroundColor: '#F5F6F7', borderRadius: 10, padding: 12, marginBottom: 16 },
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
  imageThumb: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 0,
    overflow: 'visible', // allow close button to overflow
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImgBtn: {
    position: 'absolute',
    top: -16,
    right: -16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    zIndex: 10,
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
});
