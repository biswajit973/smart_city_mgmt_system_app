import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import ImageView from 'react-native-image-viewing';
import { showToast } from '../../components/toastHelper';
import FloatingLabelInput from '../../components/ui/FloatingLabelInput';

const pad = n => n < 10 ? `0${n}` : n;
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const getRandomFutureDates = (count = 5) => {
  const today = new Date();
  const dates = {};
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i * 2 + Math.floor(Math.random() * 3));
    const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    dates[str] = { selected: true, selectedColor: '#E87A1D' };
  }
  return dates;
};

export default function MandapDetails() {
  const router = useRouter();
  const { mandapId } = useLocalSearchParams();
  const [mandap, setMandap] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [selectedDates, setSelectedDates] = useState(getRandomFutureDates());
  const [carouselWidth, setCarouselWidth] = useState(Dimensions.get('window').width);
  const [occasion, setOccasion] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [duration, setDuration] = useState('');
  const [additionalRequests, setAdditionalRequests] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({
    occasion: '',
    numberOfPeople: '',
    startDatetime: '',
    endDatetime: '',
    duration: '',
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const todayStr = getTodayStr();

  // Helper to format date and time to 'YYYY-MM-DDTHH:mm:ss'
  const formatDateTime = (dateObj, timeObj) => {
    if (!dateObj || !timeObj) return '';
    const year = dateObj.getFullYear();
    const month = pad(dateObj.getMonth() + 1);
    const day = pad(dateObj.getDate());
    const hour = pad(timeObj.getHours());
    const min = pad(timeObj.getMinutes());
    return `${year}-${month}-${day}T${hour}:${min}:00`;
  };

  // Helper to format date and time for display (e.g., 15 June 2025, 6:00 PM)
  const formatDisplayDateTime = (dateObj, timeObj) => {
    if (!dateObj || !timeObj) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = dateObj.toLocaleDateString(undefined, options);
    let hours = timeObj.getHours();
    const minutes = pad(timeObj.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${dateStr}, ${hours}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    setStartDatetime(formatDateTime(startDate, startTime));
  }, [startDate, startTime]);
  useEffect(() => {
    setEndDatetime(formatDateTime(endDate, endTime));
  }, [endDate, endTime]);

  useEffect(() => {
    const fetchMandap = async () => {
      try {
        const token = await AsyncStorage.getItem('access');
        const res = await fetch(`https://mobile.wemakesoftwares.com/api/event_klm/mandaps/${mandapId}/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setMandap(data);
      } catch (_) {
        setMandap(null);
      } finally {
        setLoading(false);
      }
    };
    if (mandapId) fetchMandap();
  }, [mandapId]);

  const handleBookNow = async () => {
    // Validation
    let newErrors = {
      occasion: '',
      numberOfPeople: '',
      startDatetime: '',
      endDatetime: '',
      duration: '',
    };
    let hasError = false;
    if (!occasion.trim()) {
      newErrors.occasion = 'Occasion is required';
      hasError = true;
    }
    if (!numberOfPeople.trim() || isNaN(Number(numberOfPeople)) || Number(numberOfPeople) <= 0) {
      newErrors.numberOfPeople = 'Enter a valid number of people';
      hasError = true;
    }
    if (!startDatetime.trim()) {
      newErrors.startDatetime = 'Start date & time is required';
      hasError = true;
    }
    if (!endDatetime.trim()) {
      newErrors.endDatetime = 'End date & time is required';
      hasError = true;
    }
    if (!duration.trim() || isNaN(Number(duration)) || Number(duration) <= 0) {
      newErrors.duration = 'Enter a valid duration (in hours)';
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;
    try {
      const token = await AsyncStorage.getItem('access');
      const res = await fetch('https://mobile.wemakesoftwares.com/api/event_klm/book/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          kalyanmandap: mandapId, // Use 'kalyanmandap' as required by API
          occasion,
          number_of_people: numberOfPeople,
          start_datetime: startDatetime,
          end_datetime: endDatetime,
          duration,
          additional_requests: additionalRequests,
          payment_method: 'Online', // Default value for API
        }),
      });
      const data = await res.json();
      
      if (res.status === 201 || res.status === 200) {
        setShowSuccess(true);
        // showToast('success', 'Booking successful!', 'Your booking has been submitted successfully.');
        setTimeout(() => {
          setShowSuccess(false);
          router.replace('/(tabs)/Bookings');
        }, 3000);
        return;
      } else {
        // Show user-friendly toast for API errors
        if (data && typeof data === 'object') {
          console.log('Booking error data:', data);
          
          let errorMsgs = [];
          if (data.start_datetime || data.end_datetime) {
            errorMsgs.push('Please enter date and time in the format YYYY-MM-DDTHH:mm:ss (e.g. 2025-05-22T14:30:00).');
          }
          if (data.kalyanmandap || data.mandap) {
            // Do not show this error, as mandap is always selected in this flow
          }
          // Add other field errors in a user-friendly way
          Object.entries(data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => {
                if (msg && !errorMsgs.includes(msg) && typeof msg === 'string') {
                  if (!msg.toLowerCase().includes('format')) errorMsgs.push(msg);
                }
              });
            } else if (typeof messages === 'string') {
              if (!messages.toLowerCase().includes('format')) errorMsgs.push(messages);
            }
          });
          if (errorMsgs.length === 0) errorMsgs.push('Please check your input and try again.');
          showToast('error', 'Booking failed', errorMsgs.join('\n'));
        } else {
          showToast('error', 'Booking failed', 'Something went wrong. Please try again.');
        }
      }
    } catch (_) {
      showToast('error', 'Network Error', 'Network error. Please try again later.');
    }
  };

  useEffect(() => {
    let localSound;
    if (showSuccess) {
      (async () => {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/success.mp3')
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#888' }}>Loading...</Text>
      </View>
    );
  }
  if (!mandap) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#E53935' }}>Mandap not found.</Text>
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <LottieView
          source={require('../../assets/Animation - 1747848194852.json')}
          autoPlay
          loop={false}
          style={{ width: 180, height: 180 }}
          resizeMode="cover"
        />
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#19e38a', marginTop: 18 }}>Booking Submitted!</Text>
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
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingBottom: 10, paddingHorizontal: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 6, marginRight: 8 }}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#181A20" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', marginRight: 36 }}>{mandap.mandap_name}</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          bounces={false}
        >
          {/* Main Image Carousel */}
          <View
            style={{ width: '100%', aspectRatio: 1.4, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center', marginTop: 0 }}
            onLayout={e => setCarouselWidth(e.nativeEvent.layout.width)}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const containerWidth = e.nativeEvent.layoutMeasurement.width;
                const idx = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
                setImgIdx(idx);
              }}
              style={{ width: '100%', height: '100%' }}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {mandap.mandap_images && mandap.mandap_images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  onPress={() => {
                    setImageViewerImages(mandap.mandap_images.map(i => ({ uri: `https://mobile.wemakesoftwares.com${i}` })));
                    setImageViewerIndex(idx);
                    setImageViewerVisible(true);
                  }}
                  style={{ width: carouselWidth, height: '100%' }}
                >
                  <Image source={{ uri: `https://mobile.wemakesoftwares.com${img}` }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Dots */}
            <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' }}>
              {mandap.mandap_images && mandap.mandap_images.map((_, idx) => (
                <TouchableOpacity key={idx} onPress={() => {
                  setImgIdx(idx);
                }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: imgIdx === idx ? '#E87A1D' : '#fff', margin: 3, borderWidth: 1, borderColor: '#E87A1D' }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Location with icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 18, marginBottom: 2 }}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#E87A1D" style={{ marginRight: 5 }} />
            <Text style={{ color: '#444', fontSize: 15, fontWeight: '500' }}>{mandap.mandap_address}</Text>
          </View>
          {/* Description */}
          <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Description</Text>
            <Text style={{ color: '#222', fontSize: 14, marginBottom: 18 }}>{mandap.mandap_description}</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Amenities</Text>
            <Text style={{ color: '#222', fontSize: 14, marginBottom: 18 }}>{mandap.mandap_amenities}</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Capacity</Text>
            <Text style={{ color: '#222', fontSize: 14, marginBottom: 18 }}>{mandap.mandap_capacity}</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Contact Number</Text>
            <Text style={{ color: '#222', fontSize: 14, marginBottom: 18 }}>{mandap.mandap_contact_number}</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Minimum Booking Unit</Text>
            <Text style={{ color: '#222', fontSize: 14, marginBottom: 18 }}>{mandap.mandap_minimum_booking_unit}</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Price Range</Text>
            <Text style={{ color: '#222', fontSize: 14, marginBottom: 18 }}>{mandap.mandap_price_range}</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Price Note</Text>
            <Text style={{ color: '#222', fontSize: 14, marginBottom: 18 }}>{mandap.mandap_price_note}</Text>
            {/* Images grid */}
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Images</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
              {mandap.mandap_images && mandap.mandap_images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  onPress={() => {
                    setImageViewerImages(mandap.mandap_images.map(i => ({ uri: `https://mobile.wemakesoftwares.com${i}` })));
                    setImageViewerIndex(idx);
                    setImageViewerVisible(true);
                  }}
                >
                  <Image source={{ uri: `https://mobile.wemakesoftwares.com${img}` }} style={{ width: 110, height: 70, borderRadius: 8, marginRight: 10, marginBottom: 10 }} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
            {/* Availability Calendar */}
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6, color: '#181A20' }}>Availability</Text>
            <View style={{ marginTop: 10, marginBottom: 18, backgroundColor: '#fff', borderRadius: 12, padding: 10, shadowColor: '#E87A1D', shadowOpacity: 0.08, shadowRadius: 8 }}>
              <Calendar
                theme={{
                  selectedDayBackgroundColor: '#E87A1D',
                  todayTextColor: '#E87A1D',
                  arrowColor: '#E87A1D',
                  dotColor: '#E87A1D',
                  textSectionTitleColor: '#E87A1D',
                  monthTextColor: '#E87A1D',
                  indicatorColor: '#E87A1D',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: 'bold',
                }}
                markedDates={selectedDates}
                minDate={todayStr}
                onDayPress={day => {
                  setSelectedDates(prev => ({ ...prev, [day.dateString]: { selected: true, selectedColor: '#E87A1D' } }));
                }}
                style={{ borderRadius: 10 }}
              />
            </View>
            {/* Event Details */}
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6, color: '#181A20' }}>Event Details</Text>
            <View style={{ marginBottom: 18 }}>
              <FloatingLabelInput
                label="Enter occasion (e.g. Wedding)"
                value={occasion}
                onChangeText={setOccasion}
                error={errors.occasion}
                style={{ marginBottom: 10 }}
              />
              <FloatingLabelInput
                label="Number of people"
                value={numberOfPeople}
                onChangeText={setNumberOfPeople}
                error={errors.numberOfPeople}
                keyboardType="numeric"
                style={{ marginBottom: 10 }}
              />
              <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={{ marginBottom: 10 }}>
                <FloatingLabelInput
                  label="Start Date & Time"
                  
                  value={startDate && startTime ? formatDisplayDateTime(startDate, startTime) : ''}
                  editable={false}
                  error={errors.startDatetime}
                  pointerEvents="none"
                />
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      setStartDate(selectedDate);
                      setShowStartTimePicker(true);
                    }
                  }}
                />
              )}
              {showStartTimePicker && (
                <DateTimePicker
                  value={startTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowStartTimePicker(false);
                    if (selectedTime) setStartTime(selectedTime);
                  }}
                />
              )}
              <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={{ marginBottom: 10 }}>
                <FloatingLabelInput
                  label="End Date & Time"
                  value={endDate && endTime ? formatDisplayDateTime(endDate, endTime) : ''}
                  editable={false}
                  error={errors.endDatetime}
                  pointerEvents="none"
                />
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={startDate || new Date()}
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) {
                      setEndDate(selectedDate);
                      setShowEndTimePicker(true);
                    }
                  }}
                />
              )}
              {showEndTimePicker && (
                <DateTimePicker
                  value={endTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowEndTimePicker(false);
                    if (selectedTime) setEndTime(selectedTime);
                  }}
                />
              )}
              <FloatingLabelInput
                label="e.g. 8 hours"
                value={duration}
                onChangeText={setDuration}
                error={errors.duration}
                style={{ marginBottom: 10 }}
              />
              <FloatingLabelInput
                label="Any additional requests (optional)"
                value={additionalRequests}
                onChangeText={setAdditionalRequests}
                style={{ marginBottom: 10, minHeight: 80, textAlignVertical: 'top' }}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity
                onPress={handleBookNow}
                style={{ backgroundColor: '#181A20', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 30 }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {/* Image Viewer Modal */}
        <ImageView
          images={imageViewerImages}
          imageIndex={imageViewerIndex}
          visible={imageViewerVisible}
          onRequestClose={() => setImageViewerVisible(false)}
          swipeToCloseEnabled
          doubleTapToZoomEnabled
          backgroundColor="#181A20"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
