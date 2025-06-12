import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const getCategoryIcon = (category) => {
  switch (category) {
    case 'payment':
      return '💳';
    case 'booking':
      return '📅';
    case 'promo':
      return '🎉';
    case 'complaints':
      return '📝';
    default:
      return '🔔';
  }
};

export default function AllNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  // Use array of { booking_id, service_type } for seen notifications
  const [seenPairs, setSeenPairs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    fetchSeenPairs();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch('https://mobile.wemakesoftwares.com/api/user/notifications/', { headers });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      // Support API response with { data: [...] }
      let notificationsArray = data;
      if (data && typeof data === 'object' && Array.isArray(data.data)) {
        notificationsArray = data.data;
      }
      setNotifications(notificationsArray);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch seen notification pairs from AsyncStorage
  const fetchSeenPairs = async () => {
    try {
      const seen = await AsyncStorage.getItem('seenNotificationPairs');
      if (seen) {
        setSeenPairs(JSON.parse(seen));
      } else {
        setSeenPairs([]);
      }
    } catch (_) {
      setSeenPairs([]);
    }
  };

  // Helper to check if a notification is seen
  const isSeen = (notif) => seenPairs.some(s => s.booking_id === notif.booking_id && s.service_type === notif.service_type);

  // Fetch notification details and mark as seen
  const fetchNotificationDetails = async (notif) => {
    setDetailsLoading(true);
    setDetailsError(null);
    setSelectedNotification(null);
    try {
      // Mark as seen in AsyncStorage
      let storedSeen = await AsyncStorage.getItem('seenNotificationPairs');
      let seenArr = storedSeen ? JSON.parse(storedSeen) : [];
      if (!seenArr.some(s => s.booking_id === notif.booking_id && s.service_type === notif.service_type)) {
        seenArr.push({ booking_id: notif.booking_id, service_type: notif.service_type });
        await AsyncStorage.setItem('seenNotificationPairs', JSON.stringify(seenArr));
        setSeenPairs(seenArr);
      }
      // ...existing code for fetching details...
      const url = `https://mobile.wemakesoftwares.com/api/user/notification-details/?booking_id=${notif.booking_id || notif.id}&service_type=${notif.service_type || ''}`;
      const token = await AsyncStorage.getItem('access');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
      setSelectedNotification(data);
    } catch (_e) {
      setDetailsError('Could not load details.');
    }
    setDetailsLoading(false);
  };

  // Helper to filter notifications by category
  const filterNotificationsByCategory = (category) => {
    if (category === 'all') return notifications;
    return notifications.filter(n => n.category === category);
  };

  // Use filtered notifications for display
  const filteredNotifications = filterNotificationsByCategory(activeCategory);
  const newNotifications = filteredNotifications.filter(n => !isSeen(n));
  const oldNotifications = filteredNotifications.filter(n => isSeen(n));

  // Helper to render section labels inline in FlatList
  const renderFlatListWithLabels = () => {
    let items = [];
    if (newNotifications.length > 0) {
      items.push({ type: 'label', label: 'New', key: 'label-new' });
      items = items.concat(newNotifications.map(n => ({ ...n, type: 'notif', key: `notif-${n.id}` })));
    }
    if (oldNotifications.length > 0) {
      items.push({ type: 'label', label: 'Previously', key: 'label-previously' });
      items = items.concat(oldNotifications.map(n => ({ ...n, type: 'notif', key: `notif-${n.id}` })));
    }
    return (
      <FlatList
        data={items}
        keyExtractor={item => item.key}
        renderItem={({ item }) => {
          if (item.type === 'label') {
            return <Text style={styles.sectionLabel}>{item.label}</Text>;
          }
          return renderNotificationCard({ item });
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  // Add details modal
  const renderDetailsModal = () => (
    <Modal
      visible={!!selectedNotification}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setSelectedNotification(null);
        setShowRejectReason(false);
        setRejectReason('');
        setActionSuccess('');
      }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 24, minWidth: 320, maxWidth: 360, alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 }}>
          {detailsLoading ? (
            <ActivityIndicator size="large" color="#E87A1D" style={{ margin: 24 }} />
          ) : detailsError ? (
            <Text style={{ color: 'red', marginBottom: 12 }}>{detailsError}</Text>
          ) : selectedNotification && selectedNotification.data ? (
            <>
              <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 8, color: '#181A20' }}>
                {selectedNotification.data.category_name || selectedNotification.data.service_type}
              </Text>
              <Text style={{ color: '#888', marginBottom: 8, fontWeight: 'bold', fontSize: 15 }}>
                {typeof selectedNotification.data.status === 'string' && selectedNotification.data.status.length > 0
                  ? selectedNotification.data.status.charAt(0).toUpperCase() + selectedNotification.data.status.slice(1)
                  : ''}
              </Text>
              <Text style={{ marginBottom: 8, color: '#222', fontSize: 16 }}>{selectedNotification.data.description}</Text>
              {selectedNotification.data.subcategory_name && (
                <Text style={{ marginBottom: 8, color: '#444', fontSize: 15 }}>Subcategory: <Text style={{ fontWeight: 'bold' }}>{selectedNotification.data.subcategory_name}</Text></Text>
              )}
              {selectedNotification.data.location && (
                <Text style={{ marginBottom: 8, color: '#444', fontSize: 15 }}>Location: <Text style={{ fontWeight: 'bold' }}>{selectedNotification.data.location}</Text></Text>
              )}
              {selectedNotification.data.address && (
                <Text style={{ marginBottom: 8, color: '#444', fontSize: 15 }}>Address: <Text style={{ fontWeight: 'bold' }}>{selectedNotification.data.address}</Text></Text>
              )}
              {selectedNotification.data.complaint_images && selectedNotification.data.complaint_images.length > 0 && (
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  {selectedNotification.data.complaint_images.map((img, idx) => (
                    <View key={idx} style={{ marginRight: 8 }}>
                      <Image source={{ uri: `https://mobile.wemakesoftwares.com${img.image}` }} style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#eee' }} />
                    </View>
                  ))}
                </View>
              )}
              {actionSuccess ? (
                <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 16, marginVertical: 12, alignSelf: 'center' }}>{actionSuccess}</Text>
              ) : showRejectReason ? (
                <>
                  <Text style={{ marginTop: 12, marginBottom: 4, fontWeight: 'bold', color: '#181A20' }}>Reason for rejection:</Text>
                  <View style={{ width: 260, marginBottom: 8 }}>
                    <View style={{
                      borderWidth: 1,
                      borderColor: '#181A20',
                      borderRadius: 10,
                      backgroundColor: '#fff',
                      padding: 0,
                      overflow: 'hidden',
                    }}>
                      <TextInput
                        value={rejectReason}
                        onChangeText={setRejectReason}
                        placeholder="Enter reason..."
                        placeholderTextColor="#888"
                        multiline
                        numberOfLines={4}
                        style={{
                          minHeight: 80,
                          fontSize: 16,
                          color: '#181A20',
                          padding: 12,
                          textAlignVertical: 'top',
                          fontFamily: 'System',
                        }}
                        underlineColorAndroid="transparent"
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: '#181A20', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 36, alignSelf: 'center', marginTop: 4 }}
                    onPress={async () => {
                      try {
                        setDetailsLoading(true);
                        const token = await AsyncStorage.getItem('access');
                        const headers = {
                          'Authorization': token ? `Bearer ${token}` : '',
                        };
                        const formData = new FormData();
                        formData.append('booking_id', selectedNotification.data.booking_id);
                        formData.append('service_type', selectedNotification.data.service_type);
                        formData.append('reason_for_rejection', rejectReason);
                        const url = 'https://mobile.wemakesoftwares.com/api/user/update-payment-reject/';
                        const res = await fetch(url, {
                          method: 'PUT',
                          headers,
                          body: formData,
                        });
                        const json = await res.json();
                        if (json.status_code === 200 && json.status === true) {
                          setActionSuccess('Rejection submitted!');
                          setShowRejectReason(false);
                          setRejectReason('');
                          await fetchNotifications();
                        } else {
                          setActionSuccess(json.message || 'Rejection failed!');
                        }
                      } catch (_e) {
                        setActionSuccess('Rejection failed!');
                      } finally {
                        setDetailsLoading(false);
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Submit</Text>
                  </TouchableOpacity>
                </>
              ) : (
                selectedNotification.data.status !== 'completed' && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 16, gap: 12 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: '#181A20', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 36 }}
                      onPress={async () => {
                        try {
                          setDetailsLoading(true);
                          const token = await AsyncStorage.getItem('access');
                          const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                          const url = `https://mobile.wemakesoftwares.com/api/user/update-payment-success/?booking_id=${selectedNotification.data.booking_id}&service_type=${selectedNotification.data.service_type}`;
                          const res = await fetch(url, { method: 'PUT', headers });
                          const json = await res.json();
                          console.log('Payment response:', json);
                          if (json.status_code === 200 && json.status === true) {
                            setActionSuccess('Payment successful!');
                            await fetchNotifications();
                          } else {
                            setActionSuccess((json && json.message) ? json.message : `Payment failed! [${res.status}]`);
                          }
                        } catch (e) {
                          setActionSuccess('Payment failed!');
                        } finally {
                          setDetailsLoading(false);
                        }
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Pay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: '#bbb', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 36 }}
                      onPress={() => setShowRejectReason(true)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </>
          ) : null}
          <TouchableOpacity onPress={() => {
            setSelectedNotification(null);
            setShowRejectReason(false);
            setRejectReason('');
            setActionSuccess('');
          }} style={{ marginTop: 18, alignSelf: 'center' }}>
            <Text style={{ color: '#E87A1D', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Update renderNotificationCard to show 'Paid'/'Completed' notifications as non-clickable
  const renderNotificationCard = ({ item }) => {
    const isNew = !isSeen(item);
    const isPaid = item.payment_status && item.payment_status.toLowerCase() === 'completed';
    const isRejected = item.payment_status && item.payment_status.toLowerCase() === 'rejected';
    const isComplaintCompleted = item.service_type === 'complaints' && item.category === 'booking' && item.status === 'completed';
    // If payment status is completed, show 'Paid' and do not open modal, and do not make card clickable
    if (isPaid || isComplaintCompleted) {
      return (
        <View
          style={[styles.card, { borderColor: '#4CAF50', borderWidth: 2 }]}
        >
          <View style={{ flex: 1, position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.iconCircleBox}>
              <Text style={styles.iconCircle}>{getCategoryIcon(item.category)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              {item.message && <Text style={styles.cardMsg}>{item.message}</Text>}
              <View style={styles.detailsRowModern}>
                <View style={styles.paidLabel}>
                  <Text style={styles.paidLabelText}>{isPaid ? 'PAID' : 'COMPLETED'}</Text>
                </View>
                <Text style={styles.cardDateModern}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
    if (isRejected) {
      return (
        <View style={[styles.card, { borderColor: '#FF3B30', borderWidth: 2 }]}> 
          <View style={{ flex: 1, position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.iconCircleBox}>
              <Text style={styles.iconCircle}>{getCategoryIcon(item.category)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              {item.message && <Text style={styles.cardMsg}>{item.message}</Text>}
              <View style={styles.detailsRowModern}>
                <View style={[styles.paidLabel, { backgroundColor: '#FF3B30' }]}> 
                  <Text style={styles.paidLabelText}>REJECTED</Text>
                </View>
                <Text style={styles.cardDateModern}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
    return (
      <TouchableOpacity
        onPress={() => {
          if (isPaid || isComplaintCompleted) {
            // Do not open modal
            return;
          }
          setSelectedNotification(item);
          setDetailsLoading(true);
          fetchNotificationDetails(item);
        }}
        style={[styles.card, isNew ? styles.cardNew : null]}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1, position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.iconCircleBox}>
            <Text style={styles.iconCircle}>{getCategoryIcon(item.category)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {isNew && (
                <View style={styles.newLabelModern}>
                  <Text style={styles.newLabelTextModern}>NEW</Text>
                </View>
              )}
            </View>
            {item.message && <Text style={styles.cardMsg}>{item.message}</Text>}
            <View style={styles.detailsRowModern}>
              {item.status && (
                <View style={[
                  styles.statusPillModern,
                  {
                    backgroundColor:
                      item.status.toLowerCase() === 'completed'
                        ? '#4CAF50'
                        : item.status.toLowerCase() === 'approved'
                        ? '#FFA000'
                        : '#888',
                  },
                ]}>
                  <Text style={styles.statusPillTextModern}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
                </View>
              )}
              <Text style={styles.cardDateModern}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Add filter buttons UI
  const renderCategoryFilters = () => (
    <View style={{ flexDirection: 'row', marginBottom: 12, marginLeft: 12, gap: 8 }}>
      <TouchableOpacity onPress={() => setActiveCategory('all')} style={[styles.filterBtn, activeCategory === 'all' && styles.filterBtnActive]}>
        <Text style={[styles.filterText, activeCategory === 'all' && styles.filterTextActive]}>All</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveCategory('payment')} style={[styles.filterBtn, activeCategory === 'payment' && styles.filterBtnActive]}>
        <Text style={[styles.filterText, activeCategory === 'payment' && styles.filterTextActive]}>Payments</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveCategory('booking')} style={[styles.filterBtn, activeCategory === 'booking' && styles.filterBtnActive]}>
        <Text style={[styles.filterText, activeCategory === 'booking' && styles.filterTextActive]}>Bookings</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveCategory('promo')} style={[styles.filterBtn, activeCategory === 'promo' && styles.filterBtnActive]}>
        <Text style={[styles.filterText, activeCategory === 'promo' && styles.filterTextActive]}>Promos</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveCategory('promotion')} style={[styles.filterBtn, activeCategory === 'promotion' && styles.filterBtnActive]}>
        <Text style={[styles.filterText, activeCategory === 'promotion' && styles.filterTextActive]}>Promotion</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={26} color="#181A20" />
        </TouchableOpacity>
        <Text style={styles.header}>All Notifications</Text>
      </View>
      {renderCategoryFilters()}
      {loading ? (
        <ActivityIndicator size="large" color="#181A20" style={{ marginTop: 40 }} />
      ) : (
        (newNotifications.length > 0 || oldNotifications.length > 0) ? (
          renderFlatListWithLabels()
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📬</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyDesc}>Your notification will appear here once you&apos;ve received them.</Text>
          </View>
        )
      )}
      {renderDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginHorizontal: 12,
  },
  cardNew: {
    borderColor: '#FFA000',
    shadowColor: '#FFA000',
    shadowOpacity: 0.12,
    elevation: 4,
  },
  iconCircleBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 0,
    shadowColor: '#E87A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    fontSize: 24,
    color: '#E87A1D',
    textAlign: 'center',
  },
  newLabelModern: {
   backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: -40,
    marginTop: -10,
    alignSelf: 'center',
  },
  newLabelTextModern: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  cardTitle: {
      marginLeft: -40,
    paddingHorizontal: 40,


  },
  cardMsg: {
    color: '#333',
    fontSize: 13,
  },
  detailsRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  statusPillModern: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginRight: 10,
    alignSelf: 'center',
  },
  statusPillTextModern: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cardDateModern: {
    color: '#888',
    fontSize: 13,
    marginLeft: 0,
  },
  listContent: {
    paddingBottom: 32,
    paddingTop: 8,
    paddingHorizontal: 0, // remove horizontal padding from the list
  },  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'grey',
    marginBottom: 10,
    marginTop: 0,
    marginLeft: 24, // match card's marginHorizontal (12) + card's paddingHorizontal (14) - iconCircleBox width offset
    letterSpacing: 0.5,
    paddingLeft: 0,
    alignSelf: 'flex-start',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Notification filter bar styles (to match screenshot)
  filterBtn: {
    paddingVertical: 0,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F5F6F7',
    marginRight: 8,
    height: 34,
    justifyContent: 'center',
    marginBottom: 8,
    minWidth: 34,
    alignItems: 'center',
    shadowColor: 'transparent',
  },
  filterBtnActive: {
    backgroundColor: '#000',
  },
  filterText: {
    color: '#444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paidLabel: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginLeft: 8,
    alignSelf: 'center',
  },
  paidLabelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
