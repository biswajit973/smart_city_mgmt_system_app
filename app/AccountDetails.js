import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotification } from '../components/NotificationContext';
import { showToast } from '../components/toastHelper';
import MaterialTextInput from '../components/ui/MaterialTextInput';

export default function AccountDetailsScreen() {
  const router = useRouter();
  const { setNotifModalVisible } = useNotification();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [editState, setEditState] = useState({
    first_name: '',
    last_name: '',
    email: '',
    dob: '',
    address: '',
    pincode: '',
  });
  const [changed, setChanged] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('access');
      if (!token) {
        router.replace('/BookingServices');
        showToast('success', 'Logged out', 'You have been logged out successfully.');
        setCheckingAuth(false);
        return;
      }
      // Fetch user details from API
      try {
        const res = await fetch('https://mobile.wemakesoftwares.com/api/account-details/?status=approved', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });
        const data = await res.json();
        if (res.status === 200 && data.userDetails) {
          setEditState({
            first_name: data.userDetails.first_name || '',
            last_name: data.userDetails.last_name || '',
            email: data.userDetails.email || '',
            dob: data.userDetails.dob || '',
            address: data.userDetails.address || '',
            pincode: data.userDetails.pincode || '',
          });
        }
      } catch (_e) {
        // do nothing
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const handleChange = (field, value) => {
    setEditState(prev => {
      const updated = { ...prev, [field]: value };
      setChanged(true);
      return updated;
    });
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('access');
      const res = await fetch('https://mobile.wemakesoftwares.com/api/updateaccount-details/', {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editState),
      });
      console.log('Update response:', res);
      if (res.status === 200) {
        showToast('success', 'Profile Updated', 'Your profile has been updated.');
        setChanged(false);
      } else {
        showToast('error', 'Update Failed', 'Could not update profile.');
      }
    } catch (_e) {
      showToast('error', 'Update Failed', 'Could not update profile.');
    }
    setUpdating(false);
  };

  // Add logout handler
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access');
      showToast('success', 'Logged out', 'You have been logged out successfully.');
      setTimeout(() => {
        router.replace('/BookingServices');
      }, 1);
    } catch (_e) {
      showToast('error', 'Logout failed', 'An error occurred while logging out.');
    }
  };

  if (checkingAuth) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={styles.headerRow}>
        <Text style={styles.header}>Your Profile</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => setNotifModalVisible(true)} style={{ position: 'relative' }}>
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
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={styles.profileBg}>
          <View style={styles.profileCard}>
            {/* Avatar with edit icon */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {`${editState.first_name?.[0] || ''}${editState.last_name?.[0] || ''}`.toUpperCase()}
                </Text>
                <Pressable style={styles.avatarEditBtn} onPress={() => showToast('info', 'Avatar', 'Avatar editing coming soon!')}>
                  <Ionicons name="pencil" size={16} color="#181A20" />
                </Pressable>
              </View>
            </View>
            {/* Material style input fields */}
            <View style={[styles.inputGroup, { marginBottom: 8 }]}> 
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <MaterialTextInput
                    label="First Name"
                    value={editState.first_name}
                    onChangeText={v => handleChange('first_name', v)}
                    style={{}}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <MaterialTextInput
                    label="Last Name"
                    value={editState.last_name}
                    onChangeText={v => handleChange('last_name', v)}
                    style={{}}
                  />
                </View>
              </View>
            </View>
            <View style={[styles.inputGroup, { marginBottom: 8 }]}> 
              <MaterialTextInput
                label="Email"
                value={editState.email}
                editable={false}
                style={{ color: '#888' }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={[styles.inputGroup, { marginBottom: 8 }]}> 
              <Pressable onPress={() => setShowDatePicker(true)}>
                <MaterialTextInput
                  label="Date of birth"
                  value={editState.dob}
                  editable={false}
                  style={{}}
                  placeholder="YYYY-MM-DD"
                  pointerEvents="none"
                />
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={editState.dob ? new Date(editState.dob) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) handleChange('dob', date.toISOString().slice(0, 10));
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>
            <View style={[styles.inputGroup, { marginBottom: 8 }]}> 
              <MaterialTextInput
                label="Address"
                value={editState.address}
                onChangeText={v => handleChange('address', v)}
              />
            </View>
            <View style={[styles.inputGroup, { marginBottom: 8 }]}> 
              <MaterialTextInput
                label="Pincode"
                value={editState.pincode}
                onChangeText={v => handleChange('pincode', v)}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            <TouchableOpacity
              style={[styles.updateBtn, { opacity: changed && !updating ? 1 : 0.6 }]}
              onPress={handleUpdate}
              disabled={!changed || updating}
              activeOpacity={0.85}
            >
              <Text style={styles.updateBtnText}>{updating ? 'Updating...' : 'Update profile'}</Text>
            </TouchableOpacity>
            {/* Horizontal rule */}
            <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 22, width: '100%' }} />
            {/* Logout button */}
            <TouchableOpacity
              style={[styles.updateBtn, { backgroundColor: '#D32F2F', marginTop: 0 }]}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <Text style={[styles.updateBtnText, { color: '#fff' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  profileBg: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',

    padding: 0,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    margin: 18,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    // Remove shadow
    // shadowColor: '#000',
    // shadowOpacity: 0.08,
    // shadowRadius: 12,
    // elevation: 4,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#407BFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 38,
    letterSpacing: 1,
  },
  avatarEditBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F5F6F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: '#181818',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 0,
  },
  updateBtn: {
    backgroundColor: '#181A20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  updateBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
