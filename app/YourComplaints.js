import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { API_BASE_URL } from '../constants/api';

const STATUS_PENDING = ['Submitted', 'Under Review', 'In Progress'];
const STATUS_RESOLVED = ['Resolved'];

export default function YourComplaints() {
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const token = await AsyncStorage.getItem('access');
        const res = await fetch(`${API_BASE_URL}/api/complaints/user/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.status === 200) {
          setComplaints(data);
        } else {
          setError(data.message || 'Failed to fetch complaints');
        }
      } catch (e) {
        setError('Network error');
      }
      setLoading(false);
    })();
  }, []);

  const pending = complaints.filter(c => STATUS_PENDING.includes(c.status));
  const resolved = complaints.filter(c => STATUS_RESOLVED.includes(c.status));

  const ComplaintCard = ({ complaint }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/ComplaintDetails', params: { id: complaint.id } })}
      activeOpacity={0.85}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Ionicons name="alert-circle-outline" size={22} color="#E87A1D" style={{ marginRight: 8 }} />
        <ThemedText style={{ fontWeight: 'bold', fontSize: 15, color: '#181A20' }}>{complaint.category_name}</ThemedText>
      </View>
      <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>Submitted: {new Date(complaint.created_at).toLocaleDateString()}</ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
        <ThemedText style={{ color: complaint.status === 'Resolved' ? '#43A047' : '#E87A1D', fontWeight: 'bold', fontSize: 13 }}>{complaint.status}</ThemedText>
        <View style={{ flex: 1 }} />
        <ThemedText style={{ color: '#6C63FF', fontWeight: 'bold', fontSize: 13 }}>View Details →</ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={26} color="#181A20" />
        </TouchableOpacity>
        <ThemedText style={styles.header}>Your Complaints</ThemedText>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : error ? (
        <ThemedText style={{ color: '#E53935', textAlign: 'center', marginTop: 30 }}>{error}</ThemedText>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 30 }}>
          <ThemedText style={styles.sectionTitle}>Pending Complaints</ThemedText>
          {pending.length === 0 ? (
            <ThemedText style={{ color: '#888', marginBottom: 18 }}>No pending complaints.</ThemedText>
          ) : (
            pending.map(c => <ComplaintCard key={c.id} complaint={c} />)
          )}
          <ThemedText style={styles.sectionTitle}>Resolved Complaints</ThemedText>
          {resolved.length === 0 ? (
            <ThemedText style={{ color: '#888' }}>No resolved complaints.</ThemedText>
          ) : (
            resolved.map(c => <ComplaintCard key={c.id} complaint={c} />)
          )}
        </ScrollView>
      )}
    </ThemedView>
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
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 18,
    marginBottom: 8,
    color: '#181A20',
  },
  card: {
    backgroundColor: '#F5F6F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
});
