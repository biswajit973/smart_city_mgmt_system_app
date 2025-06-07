import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Platform, ScrollView as RNScrollView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function KalyanMandapBooking() {
  const router = useRouter();
  const [mandaps, setMandaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgIdxs, setImgIdxs] = useState([]);
  const scrollRefs = useRef([]);

  useEffect(() => {
    const fetchMandaps = async () => {
      try {
        const token = await AsyncStorage.getItem('access');
        const res = await fetch('https://mobile.wemakesoftwares.com/api/event_klm/mandaps/', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setMandaps(Array.isArray(data) ? data : []);
      } catch (_) {
        setMandaps([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMandaps();
  }, []);

  useEffect(() => {
    setImgIdxs(Array.isArray(mandaps) ? mandaps.map(() => 0) : []);
  }, [mandaps]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#888' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#181A20" />
        </TouchableOpacity>
        <Text style={styles.header}>Kalyan Mandap Booking</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
        {mandaps.map((item, index) => (
          <View key={item.id} style={styles.card}>
            <View style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', backgroundColor: '#eee', marginRight: 16, position: 'relative' }}>
              {item.mandap_images && item.mandap_images.length > 0 && (
                <>
                  <RNScrollView
                    ref={el => (scrollRefs.current[index] = el)}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={{ width: 120, height: 120 }}
                    onMomentumScrollEnd={e => {
                      const idx = Math.round(e.nativeEvent.contentOffset.x / 120);
                      setImgIdxs(prev => prev.map((v, i) => i === index ? idx : v));
                    }}
                  >
                    {item.mandap_images.map((img, imgIdx) => (
                      <Image
                        key={imgIdx}
                        source={{ uri: `https://mobile.wemakesoftwares.com${img}` }}
                        style={{ width: 120, height: 120 }}
                        resizeMode="cover"
                      />
                    ))}
                  </RNScrollView>
                  {/* Left arrow */}
                  {imgIdxs[index] > 0 && (
                    <TouchableOpacity
                      style={{ position: 'absolute', left: 2, top: '50%', marginTop: -18, zIndex: 2, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 16, padding: 2 }}
                      onPress={() => {
                        const newIdx = imgIdxs[index] - 1;
                        setImgIdxs(prev => prev.map((v, i) => i === index ? newIdx : v));
                        scrollRefs.current[index]?.scrollTo({ x: newIdx * 120, animated: true });
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {/* Right arrow */}
                  {imgIdxs[index] < item.mandap_images.length - 1 && (
                    <TouchableOpacity
                      style={{ position: 'absolute', right: 2, top: '50%', marginTop: -18, zIndex: 2, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 16, padding: 2 }}
                      onPress={() => {
                        const newIdx = imgIdxs[index] + 1;
                        setImgIdxs(prev => prev.map((v, i) => i === index ? newIdx : v));
                        scrollRefs.current[index]?.scrollTo({ x: newIdx * 120, animated: true });
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {/* Bullets */}
                  <View style={{ position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    {item.mandap_images.map((_, bIdx) => (
                      <View
                        key={bIdx}
                        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: imgIdxs[index] === bIdx ? '#fff' : 'rgba(255,255,255,0.5)', margin: 2 }}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#181A20', marginBottom: 4 }}>{item.mandap_name}</Text>
              <Text style={{ color: '#666', fontSize: 14, marginBottom: 6 }}>{item.mandap_description}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#E87A1D" style={{ marginRight: 4 }} />
                <Text style={{ color: '#444', fontSize: 13 }}>{item.mandap_address}</Text>
              </View>
              <TouchableOpacity
                style={styles.viewBtn}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/KalyanMandapBooking/mandap-details', params: { mandapId: item.id } })}
              >
                <Text style={styles.viewBtnText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
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
  card: {
    flexDirection: 'row',
    backgroundColor: '#F5F6F7',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  viewBtn: {
    backgroundColor: '#181A20',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
