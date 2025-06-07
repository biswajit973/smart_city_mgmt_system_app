import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const ORANGE = '#E87A1D';

export default function ServiceBookingScreen() {
  const router = useRouter();
  const { title } = useLocalSearchParams();
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState([]); // { uri, timestamp }
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  const pickImage = async () => {
    if (images.length >= 5) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery was denied. Please enable it in your device settings.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Try to enable multi-pick
      selectionLimit: 5 - images.length, // Limit to max 5
      quality: 0.5,
      base64: false,
      exif: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Add all selected images (multi or single)
      const newImages = result.assets.slice(0, 5 - images.length).map(asset => ({
        uri: asset.uri,
        timestamp: new Date().toISOString(),
      }));
      setImages([...images, ...newImages]);
    }
  };

  const captureImage = async () => {
    if (images.length >= 5) return;
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: false,
      exif: true,
    });
    if (!result.cancelled && result.assets && result.assets.length > 0) {
      setImages([
        ...images,
        {
          uri: result.assets[0].uri,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>{title || 'Service Booking'}</Text>
      </View>
      <Text style={styles.label}>Capture Photo (max 5)</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {images.length < 5 && (
          <>
            <TouchableOpacity style={[styles.imgBox, styles.addImgBox, { borderColor: ORANGE }]} onPress={captureImage}>
              <Ionicons name="camera" size={32} color={ORANGE} />
              <Text style={[styles.addImgText, { color: ORANGE }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.imgBox, styles.addImgBox, { borderColor: ORANGE }]} onPress={pickImage}>
              <Ionicons name="image" size={32} color={ORANGE} />
              <Text style={[styles.addImgText, { color: ORANGE }]}>Gallery</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      {images.length > 0 && (
        <View style={styles.imageGrid}>
          {images.map((img, i) => (
            <View key={i} style={styles.imgBox}>
              <Image source={{ uri: img.uri }} style={styles.img} />
              <Text style={styles.timestamp}>{formatTimestamp(img.timestamp)}</Text>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                <Ionicons name="close-circle" size={20} color="#E53935" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.label}>Current Location</Text>
      {locationPermission && location ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            region={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation={true}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={location} />
          </MapView>
          <Text style={styles.locationText}>
            Lat: {location.latitude.toFixed(5)}, Lng: {location.longitude.toFixed(5)}
          </Text>
        </View>
      ) : (
        <View style={{alignItems:'center', marginBottom: 8}}>
          <Text style={styles.locationText}>Location not available or permission denied.</Text>
          <TouchableOpacity style={styles.gpsBtn} onPress={async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
            if (status === 'granted') {
              let loc = await Location.getCurrentPositionAsync({});
              setLocation(loc.coords);
            }
          }}>
            <Ionicons name="location" size={22} color="#1976ED" />
            <Text style={styles.gpsBtnText}>Give Permission</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.label}>Description (max 300 words)</Text>
      <TextInput
        style={styles.descInput}
        placeholder="Please provide a brief description of the items you would like to have collected."
        value={desc}
        onChangeText={text => text.split(/\s+/).length <= 300 ? setDesc(text) : null}
        multiline
        numberOfLines={8}
        maxLength={1800}
      />
      <TouchableOpacity style={[styles.submitBtn, { backgroundColor: ORANGE, borderRadius: 16 }]}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F7FF',
    padding: 20,
    borderRadius: 18,
    margin: 10,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    color: '#222',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  imgBox: {
    width: 90,
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: {
    width: 90,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 1,
    zIndex: 2,
  },
  addImgBox: {
    backgroundColor: '#F6F7FF',
    borderWidth: 1,
    borderColor: ORANGE,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  addImgText: {
    color: ORANGE,
    fontSize: 12,
    marginTop: 2,
  },
  mapContainer: {
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    marginTop: 4,
  },
  map: {
    width: '100%',
    height: 120,
  },
  locationText: {
    color: '#333',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 6,
    alignSelf: 'center',
  },
  gpsBtnText: {
    color: '#1976ED',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  descInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#444',
    marginBottom: 16,
    minHeight: 120, // increased height
    borderWidth: 1, // add border
    borderColor: ORANGE, // orange border
  },
  submitBtn: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
