import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function NewComplaintForm() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [otherSubcategory, setOtherSubcategory] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [description, setDescription] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    category: '',
    subcategory: '',
    otherSubcategory: '',
    manualAddress: '',
    description: '',
  });
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    // Fetch complaint categories from new API with Authorization header
    (async () => {
      try {
        const token = await AsyncStorage.getItem('access');
        const res = await fetch('https://mobile.wemakesoftwares.com/api/complaint_mgmt/categories/', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setCategories(data);
      } catch {
        setCategories([]);
      }
    })();
    // Get location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        let geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (geo && geo.length > 0) {
          setLocation(`${geo[0].name || ''} ${geo[0].street || ''}, ${geo[0].city || geo[0].district || ''}`);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      // Set subcategories from selected category
      setSubcategories([...(selectedCategory.subcategories || []), { id: 'other', name: 'Other' }]);
    } else {
      setSubcategories([]);
    }
    setSelectedSubcategory(null);
    setOtherSubcategory('');
  }, [selectedCategory]);

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
    let newErrors = {
      category: '',
      subcategory: '',
      otherSubcategory: '',
      manualAddress: '',
      description: '',
    };
    let hasError = false;
    setImageError('');
    if (!selectedCategory) {
      newErrors.category = 'Please select a complaint category';
      hasError = true;
    }
    // Only validate subcategory if not 'Other' category
    if (!selectedCategory || !(selectedCategory.name && selectedCategory.name.toLowerCase() === 'other')) {
      if (!selectedSubcategory) {
        newErrors.subcategory = 'Please select a subcategory';
        hasError = true;
      }
      if (selectedSubcategory && selectedSubcategory.id === 'other' && !otherSubcategory.trim()) {
        newErrors.otherSubcategory = 'Please specify the subcategory';
        hasError = true;
      }
    }
    if (!manualAddress.trim()) {
      newErrors.manualAddress = 'Please enter the address';
      hasError = true;
    }
    if (!description.trim()) {
      newErrors.description = 'Please enter the complaint description';
      hasError = true;
    }
    // Image validation (at least one required)
    if (images.length === 0) {
      setImageError('Please upload at least one photo');
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      // If 'Other' is selected as complaint category, pass id 49 for subcategory
      if (selectedCategory && selectedCategory.name && selectedCategory.name.toLowerCase() === 'other') {
        formData.append('category', selectedCategory.id); // Pass id for 'Other'
        formData.append('subcategory', 49); // Always pass id 49 for 'Other' subcategory
        // Remove custom_subcategory, as backend does not accept it
        // Instead, pass the textarea value in subcategory_other (if needed by backend)
        formData.append('subcategory_other', otherSubcategory);
      } else {
        formData.append('category', selectedCategory.id);
        formData.append('subcategory', selectedSubcategory && selectedSubcategory.id === 'other' ? '' : selectedSubcategory.id);
        if (selectedSubcategory && selectedSubcategory.id === 'other') {
          formData.append('subcategory_other', otherSubcategory);
        }
      }
      formData.append('location', location);
      formData.append('address', manualAddress);
      formData.append('description', description);
      images.forEach((uri, idx) => {
        let name = uri.split('/').pop();
        let type = 'image/jpeg';
        if (name && name.endsWith('.png')) type = 'image/png';
        formData.append('complaint_images', {
          uri,
          name: name || `photo_${idx}.jpg`,
          type,
        });
      });
      console.log('Submitting complaint with data:', formData);
      const token = await AsyncStorage.getItem('access');
      const res = await fetch('https://mobile.wemakesoftwares.com/api/complaint_mgmt/create/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // Do NOT set Content-Type for FormData, let fetch set it
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      let data;
      let text = await res.text();
      try {
        data = JSON.parse(text);
        console.log('Complaint submission data:', data);
      } catch (_e) {
        showToast('error', 'Server error', 'Invalid server response: ' + text);
        console.error('Error parsing response:', _e, text);
        setSubmitting(false);
        return;
      }
      console.log('Complaint submission response:', data);
      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
        router.replace('/(tabs)/Bookings');
      }, 3000); // Animation duration
    } catch (err) {
      showToast('error', 'Network error', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

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
          <ThemedText style={styles.header}>New Complaint</ThemedText>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          bounces={false}
        >
          <ThemedText style={styles.label}>Complaint Category</ThemedText>
          <View style={styles.dropdownBox}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 10 }}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={{ flex: 1, color: '#181A20', fontSize: 15 }}>{selectedCategory ? selectedCategory.name : '---Select---'}</Text>
              <Ionicons name="chevron-down" size={20} color="#888" />
            </TouchableOpacity>
            <Modal
              isVisible={!!showCategoryModal}
              transparent
              animationType="fade"
              onBackdropPress={() => setShowCategoryModal(false)}
              onSwipeComplete={() => setShowCategoryModal(false)}
              swipeDirection={["down"]}
              style={{ margin: 0, justifyContent: 'flex-end' }}
            >
              <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} onPress={() => setShowCategoryModal(false)}>
                <View style={{ position: 'absolute', top: 120, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 10, elevation: 5, padding: 10 }}>
                  <TouchableOpacity key="default" onPress={() => { setSelectedCategory(null); setShowCategoryModal(false); }} style={{ paddingVertical: 10 }}>
                    <Text style={{ color: '#888', fontSize: 15 }}>---Select---</Text>
                  </TouchableOpacity>
                  {Array.isArray(categories) && categories.length > 0 && categories.map(option => (
                    <TouchableOpacity key={option.id} onPress={() => { setSelectedCategory(option); setShowCategoryModal(false); }} style={{ paddingVertical: 10 }}>
                      <Text style={{ color: '#181A20', fontSize: 15 }}>{option.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
          {errors.category ? (
            <Text style={{ color: 'red', marginBottom: 4, marginLeft: 2 }}>{errors.category}</Text>
          ) : null}
          {/* If selectedCategory is 'Other', show textarea immediately */}
          {selectedCategory && selectedCategory.name && selectedCategory.name.toLowerCase() === 'other' ? (
            <FloatingLabelInput
              label="Please specify complaint category"
              value={otherSubcategory}
              onChangeText={setOtherSubcategory}
              error={errors.otherSubcategory}
              multiline
              style={{ minHeight: 60, maxHeight: 200, textAlignVertical: 'top' }}
            />
          ) : (
            <View>
              <ThemedText style={styles.label}>Sub Category</ThemedText>
              {/* Only show dropdown if 'Other' is NOT selected as subcategory */}
              {(!selectedSubcategory || selectedSubcategory.id !== 'other') && (
                <View style={styles.dropdownBox}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 10 }}
                    onPress={() => setShowSubcategoryModal(true)}
                    disabled={!selectedCategory}
                  >
                    <Text style={{ flex: 1, color: '#181A20', fontSize: 15 }}>{selectedSubcategory ? selectedSubcategory.name : '---Select---'}</Text>
                    <Ionicons name="chevron-down" size={20} color="#888" />
                  </TouchableOpacity>
                  <Modal
                    isVisible={!!showSubcategoryModal}
                    transparent
                    animationType="fade"
                    onBackdropPress={() => setShowSubcategoryModal(false)}
                    onSwipeComplete={() => setShowSubcategoryModal(false)}
                    swipeDirection={["down"]}
                    style={{ margin: 0, justifyContent: 'flex-end' }}
                  >
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} onPress={() => setShowSubcategoryModal(false)}>
                      <View style={{ position: 'absolute', top: 180, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 10, elevation: 5, padding: 10 }}>
                        <TouchableOpacity key="default" onPress={() => { setSelectedSubcategory(null); setShowSubcategoryModal(false); }} style={{ paddingVertical: 10 }}>
                          <Text style={{ color: '#888', fontSize: 15 }}>---Select---</Text>
                        </TouchableOpacity>
                        {subcategories.map(option => (
                          <TouchableOpacity key={option.id} onPress={() => { setSelectedSubcategory(option); setShowSubcategoryModal(false); }} style={{ paddingVertical: 10 }}>
                            <Text style={{ color: '#181A20', fontSize: 15 }}>{option.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </TouchableOpacity>
                  </Modal>
                </View>
              )}
              {errors.subcategory && (!selectedSubcategory || selectedSubcategory.id !== 'other') ? (
                <Text style={{ color: 'red', marginBottom: 4, marginLeft: 2 }}>{errors.subcategory}</Text>
              ) : null}
              {/* Show textarea if 'Other' is selected as subcategory */}
              {selectedSubcategory && selectedSubcategory.id === 'other' && (
                <FloatingLabelInput
                  label="Please specify subcategory"
                  value={otherSubcategory}
                  onChangeText={setOtherSubcategory}
                  error={errors.otherSubcategory}
                  multiline
                  style={{ minHeight: 60, maxHeight: 200, textAlignVertical: 'top' }}
                />
              )}
            </View>
          )}
          <ThemedText style={styles.label}>Upload Photos (Optional, max 5)</ThemedText>
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
          <ThemedText style={styles.label}>Auto-detected Location</ThemedText>
          <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee' }]}> 
            <Ionicons name="location-outline" size={20} color="#E87A1D" style={{ marginRight: 8 }} />
            <Text style={{ color: '#181A20', fontSize: 15, flex: 1 }}>{location || 'Detecting location...'}</Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <View style={{ marginTop: 12 }}>
              <FloatingLabelInput
                label="Enter address details"
                value={manualAddress}
                onChangeText={setManualAddress}
                error={errors.manualAddress}
                multiline
                style={{ minHeight: 60, maxHeight: 200, textAlignVertical: 'top' }}
              />
            </View>
            <View style={{ marginTop: 12 }}>
              <FloatingLabelInput
                label="Describe your complaint"
                value={description}
                onChangeText={setDescription}
                error={errors.description}
                multiline
                style={{ minHeight: 80, maxHeight: 200, textAlignVertical: 'top' }}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            <ThemedText style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Complaint'}</ThemedText>
          </TouchableOpacity>
          {showSuccessAnimation && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#fff', // solid white background
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
              <Text style={{ marginTop: 24, fontSize: 18, color: '#1ABC9C', fontWeight: 'bold' }}>Complaint Submitted!</Text>
            </View>
          )}
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
    marginTop: 35,
    marginBottom: 30,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
