import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, ScrollView } from 'react-native';


import * as Location from 'expo-location';

export default function WastePickupBookingScreen() {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [description, setDescription] = useState('');

  const pickImage = async () => {
    if (images.length >= 5) return;
    let result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: false,
      exif: true,
    });
    if (!result.cancelled) {
      setImages([...images, { uri: result.uri, timestamp: new Date().toISOString() }]);
    }
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Waste Pickup Booking</Text>
      <Button title="Capture Photo" onPress={pickImage} disabled={images.length >= 5} />
      <View style={styles.imageRow}>
        {images.map((img, idx) => (
          <View key={idx} style={styles.imgBox}>
            <Image source={{ uri: img.uri }} style={styles.img} />
            <Text style={styles.timestamp}>{img.timestamp.split('T')[0]}</Text>
          </View>
        ))}
      </View>
      <Button title="Get Current Location" onPress={getLocation} />
      {location && (
        <Text style={styles.locationText}>
          Lat: {location.latitude}, Lng: {location.longitude}
        </Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Description (max 300 words)"
        value={description}
        onChangeText={text => text.length <= 300 * 6 ? setDescription(text) : null}
        multiline
        numberOfLines={4}
        maxLength={1800}
      />
      <Button title="Submit Booking" onPress={() => alert('Booking submitted!')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  imageRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  imgBox: {
    alignItems: 'center',
    marginRight: 8,
  },
  img: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
  },
  locationText: {
    marginVertical: 8,
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    minHeight: 60,
  },
});
