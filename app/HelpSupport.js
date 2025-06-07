import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';

export default function HelpSupport() {
  const router = useRouter();

  // Demo data
  const helpdeskEmail = 'helpdesk@municipality.gov.in';
  const phoneNumbers = ['+91 80000 12345', '+91 80000 54321'];
  const workingHours = 'Mon-Sat: 9:00 AM - 6:00 PM';
  const whatsappLink = 'https://wa.me/918000012345';

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={26} color="#181A20" />
        </TouchableOpacity>
        <ThemedText style={styles.header}>Help & Support</ThemedText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={styles.infoBox}>
          <Ionicons name="mail-outline" size={22} color="#6C63FF" style={{ marginRight: 12 }} />
          <View>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${helpdeskEmail}`)}>
              <Text style={styles.value}>{helpdeskEmail}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.infoBox}>
          <Ionicons name="call-outline" size={22} color="#43A047" style={{ marginRight: 12 }} />
          <View>
            <ThemedText style={styles.label}>Phone</ThemedText>
            {phoneNumbers.map((num, idx) => (
              <TouchableOpacity key={idx} onPress={() => Linking.openURL(`tel:${num.replace(/\s+/g, '')}`)}>
                <Text style={styles.value}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={22} color="#E87A1D" style={{ marginRight: 12 }} />
          <View>
            <ThemedText style={styles.label}>Working Hours</ThemedText>
            <Text style={styles.value}>{workingHours}</Text>
          </View>
        </View>
        <View style={styles.infoBox}>
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" style={{ marginRight: 12 }} />
          <View>
            <ThemedText style={styles.label}>WhatsApp Support</ThemedText>
            <TouchableOpacity onPress={() => Linking.openURL(whatsappLink)}>
              <Text style={[styles.value, { color: '#25D366' }]}>Chat on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#181A20',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: '#181A20',
    marginBottom: 2,
  },
});
