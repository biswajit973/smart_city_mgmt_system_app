import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PollutionCategorySelect() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('https://mobile.wemakesoftwares.com/api/pollution_mgmt/categories/')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load categories');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red' }}>{String(error)}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Select Pollution Category</Text>
      {categories.map((cat) => (
        <View key={String(cat.id)} style={styles.categoryBox}>
          <Text style={styles.categoryTitle}>{cat.name}</Text>
          <View style={styles.subcatRow}>
            {cat.subcategories.map((sub) => (
              <TouchableOpacity
                key={String(sub.id)}
                style={styles.subcatBtn}
                onPress={() => router.push({ pathname: '/NewComplaintForm', query: { type: 'pollution', category: String(cat.id), subcategory: String(sub.id) } })}
                activeOpacity={0.85}
              >
                <Ionicons name="chevron-forward-circle-outline" size={22} color="#6C63FF" style={{ marginRight: 6 }} />
                <Text style={styles.subcatText}>{sub.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, color: '#181A20', textAlign: 'center' },
  categoryBox: { marginBottom: 28, backgroundColor: '#F5F6F7', borderRadius: 14, padding: 16 },
  categoryTitle: { fontSize: 17, fontWeight: 'bold', color: '#181A20', marginBottom: 10 },
  subcatRow: { flexDirection: 'row', flexWrap: 'wrap' },
  subcatBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8EAFE', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginRight: 10, marginBottom: 10 },
  subcatText: { fontSize: 14, color: '#181A20' },
});
