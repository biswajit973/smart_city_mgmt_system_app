import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { useNotification } from './NotificationContext';

const { height } = Dimensions.get('window');

export default function NotificationModal() {
  const { notifModalVisible, setNotifModalVisible, notifications, loading, refreshNotifications } = useNotification();
  const router = useRouter();
  const [modalLoading, setModalLoading] = React.useState(false);
  const [selectedNotification, setSelectedNotification] = React.useState(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [detailsError, setDetailsError] = React.useState(null);
  const [showRejectReason, setShowRejectReason] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [actionSuccess, setActionSuccess] = React.useState('');

  React.useEffect(() => {
    if (notifModalVisible) {
      setModalLoading(true);
      refreshNotifications().then(() => setModalLoading(false));
    } else {
      setModalLoading(false);
    }
    // eslint-disable-next-line
  }, [notifModalVisible]);

  const handleViewAll = () => {
    setNotifModalVisible(false);
    router.push('/AllNotifications');
  };

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

  // Fetch notification details (API call)
  const fetchNotificationDetails = async (notif) => {
    setDetailsLoading(true);
    setDetailsError(null);
    setSelectedNotification(null);
    try {
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

  // Update renderNotificationCard to show correct border/label for paid, completed, approved, rejected
  const renderNotificationCard = ({ item, index }) => {
    const isPaid = item.payment_status && item.payment_status.toLowerCase() === 'completed';
    const isRejected = item.payment_status && item.payment_status.toLowerCase() === 'rejected';
    const isComplaintCompleted = item.service_type === 'complaints' && item.category === 'booking' && item.status === 'completed';
    const isApproved = item.status && item.status.toLowerCase() === 'approved';
    let cardBorder = {};
    let label = null;
    if (isPaid || isComplaintCompleted) {
      cardBorder = { borderColor: '#4CAF50', borderWidth: 2 };
      label = <View style={styles.paidLabel}><Text style={styles.paidLabelText}>{isPaid ? 'PAID' : 'COMPLETED'}</Text></View>;
    } else if (isRejected) {
      cardBorder = { borderColor: '#FF3B30', borderWidth: 2 };
      label = <View style={[styles.paidLabel, { backgroundColor: '#FF3B30' }]}><Text style={styles.paidLabelText}>REJECTED</Text></View>;
    } else if (isApproved) {
      cardBorder = { borderColor: '#FFA000', borderWidth: 2 };
    }
    // Non-clickable for paid/completed/rejected
    if (isPaid || isComplaintCompleted || isRejected) {
      return (
        <View style={[styles.card, cardBorder, item.is_new ? styles.cardNew : null]}>
          <View style={{ flex: 1, position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.iconCircleBox}>
              <Text style={styles.iconCircle}>{getCategoryIcon(item.category)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.is_new && (
                  <View style={styles.newLabelModern}>
                    <Text style={styles.newLabelTextModern}>NEW</Text>
                  </View>
                )}
              </View>
              {item.message && <Text style={styles.cardMsg}>{item.message}</Text>}
              <View style={styles.detailsRowModern}>
                {label}
                <Text style={styles.cardDateModern}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
    // Clickable for all others: open details modal and fetch details
    return (
      <TouchableOpacity
        style={[styles.card, cardBorder, item.is_new ? styles.cardNew : null]}
        onPress={() => {
          setSelectedNotification(item);
          setDetailsLoading(true);
          fetchNotificationDetails(item);
        }}
      >
        <View style={{ flex: 1, position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.iconCircleBox}>
            <Text style={styles.iconCircle}>{getCategoryIcon(item.category)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.is_new && (
                <View style={styles.newLabelModern}>
                  <Text style={styles.newLabelTextModern}>NEW</Text>
                </View>
              )}
            </View>
            {item.message && <Text style={styles.cardMsg}>{item.message}</Text>}
            <View style={styles.detailsRowModern}>
              {label}
              {item.status && !isPaid && !isComplaintCompleted && !isRejected && (
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

  // Separate new and old notifications
  const newNotifications = notifications.filter(n => n.is_new);
  const oldNotifications = notifications.filter(n => !n.is_new);

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
        renderItem={({ item, index }) => {
          if (item.type === 'label') {
            return (<Text style={styles.sectionLabel}>{item.label}</Text>);
          } else {
            return renderNotificationCard({ item, index });
          }
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      />
    );
  };

  // Details modal (copied and adapted from AllNotifications.js)
  const handlePay = async () => {
    if (!selectedNotification || !selectedNotification.data) return;
    if (!selectedNotification.data.booking_id || !selectedNotification.data.service_type) {
      setDetailsError('Missing booking_id or service_type!');
      return;
    }
    setDetailsLoading(true);
    setActionSuccess("");
    setDetailsError("");
    try {
      // Build URL with query parameters as backend expects
      const url = `https://mobile.wemakesoftwares.com/api/user/update-payment-success/?booking_id=${encodeURIComponent(selectedNotification.data.booking_id)}&service_type=${encodeURIComponent(selectedNotification.data.service_type)}`;
      const token = await AsyncStorage.getItem('access');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      // No body needed, backend expects params in query string
      const res = await fetch(url, { method: 'PUT', headers });
      const result = await res.json();
      console.log('Payment update result:', result);
      if (!res.ok || result.status === false) {
        setDetailsError(result.message || 'Payment update failed');
        setDetailsLoading(false);
        return;
      }
      setActionSuccess('Payment successful!');
      await refreshNotifications();
      await fetchNotificationDetails(selectedNotification.data);
    } catch (_e) {
      setDetailsError('Payment failed. Please try again.');
    }
    setDetailsLoading(false);
  };

  const handleReject = async () => {
    if (!selectedNotification || !selectedNotification.data) return;
    if (!selectedNotification.data.booking_id || !selectedNotification.data.service_type) {
      setDetailsError('Missing booking_id or service_type!');
      return;
    }
    if (!rejectReason.trim()) {
      setDetailsError('Please enter a reason for rejection.');
      return;
    }
    setDetailsLoading(true);
    setActionSuccess("");
    setDetailsError("");
    try {
      const url = `https://mobile.wemakesoftwares.com/api/user/update-payment-reject/`;
      const token = await AsyncStorage.getItem('access');
      const formData = new FormData();
      formData.append('booking_id', selectedNotification.data.booking_id);
      formData.append('service_type', selectedNotification.data.service_type);
      formData.append('reason', rejectReason);
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      const res = await fetch(url, { method: 'PUT', headers, body: formData });
      const result = await res.json();
      if (!res.ok || result.status === false) {
        throw new Error(result.message || 'Rejection failed');
      }
      setActionSuccess('Rejection submitted!');
      setShowRejectReason(false);
      setRejectReason('');
      await refreshNotifications();
      await fetchNotificationDetails(selectedNotification.data);
    } catch (_e) {
      setDetailsError('Rejection failed. Please try again.');
    }
    setDetailsLoading(false);
  };

  const renderDetailsModal = () => (
    <Modal
      isVisible={!!selectedNotification}
      onBackdropPress={() => {
        setSelectedNotification(null);
        setShowRejectReason(false);
        setRejectReason('');
        setActionSuccess('');
        setDetailsError('');
      }}
      onSwipeComplete={() => {
        setSelectedNotification(null);
        setShowRejectReason(false);
        setRejectReason('');
        setActionSuccess('');
        setDetailsError('');
      }}
      swipeDirection={["down"]}
      style={{ justifyContent: 'center', alignItems: 'center', margin: 0 }}
      backdropTransitionOutTiming={0}
      propagateSwipe
      animationIn="slideInUp"
      animationOut="slideOutDown"
      swipeThreshold={100}
      transparent
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
                    onPress={handleReject}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Submit</Text>
                  </TouchableOpacity>
                </>
              ) : (
                selectedNotification.data.status !== 'completed' && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 16, gap: 12 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: '#181A20', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 36 }}
                      onPress={handlePay}
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
            setDetailsError('');
          }} style={{ marginTop: 18, alignSelf: 'center' }}>
            <Text style={{ color: '#E87A1D', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      isVisible={notifModalVisible}
      onBackdropPress={() => setNotifModalVisible(false)}
      onSwipeComplete={() => setNotifModalVisible(false)}
      swipeDirection={["down"]}
      style={{ justifyContent: 'flex-end', margin: 0 }}
      backdropTransitionOutTiming={0}
      propagateSwipe
      animationIn="slideInUp"
      animationOut="slideOutDown"
      swipeThreshold={100}
    >
      <View style={styles.sheet}>
        <View style={styles.dragIndicator} />
        <View style={styles.headerRow}>
          <Text style={styles.header}>Notifications</Text>
        </View>
        {modalLoading || loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
            <ActivityIndicator size="large" color="#888" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {(newNotifications.length > 0 || oldNotifications.length > 0) ? (
              renderFlatListWithLabels()
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📬</Text>
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptyDesc}>Your notification will appear here once you&apos;ve received them.</Text>
              </View>
            )}
          </View>
        )}
        {!loading && notifications.length > 0 && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={handleViewAll}
          >
            <Text style={styles.viewAllText}>View All Notifications</Text>
          </TouchableOpacity>
        )}
        <View style={styles.bottomCloseRow}>
          <TouchableOpacity 
            style={styles.bottomCloseBtn} 
            onPress={() => setNotifModalVisible(false)}
          >
            <Ionicons name="close-circle-outline" size={40} color="#bbb" />
          </TouchableOpacity>
        </View>
        {renderDetailsModal()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: height * 0.55,
    maxHeight: height * 0.85,
  },
  dragIndicator: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },
  cardTitle: {
    marginLeft: -25,
    paddingHorizontal: 30,

  
  }, 
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
  },
  pillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 8,
    marginTop: 18,
    marginLeft: 2,
    letterSpacing: 0.5,
  },
  previously: {
    color: '#888',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardNew: {
    borderColor: '#E87A1D',
    shadowColor: '#E87A1D',
    shadowOpacity: 0.10,
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
  bottomCloseRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 1,
    backgroundColor: 'transparent',
  },
  bottomCloseBtn: {
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',

  },
  bottomCloseIcon: { display: 'none' },
  emptyState: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111',
    marginBottom: 4,
  },
  emptyDesc: {
    color: '#444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  link: {
    color: '#007aff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 60, // Space for the close button
  },
  viewAllText: {
    color: '#E87A1D',
    fontSize: 16,
    fontWeight: '600',
  },
  newLabel: {
    position: 'absolute',
    top: -14,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 2,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#fff',
  },
  newLabelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  categoryIconBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E87A1D',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#E87A1D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIcon: {
    fontSize: 16,
    color: '#E87A1D',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  iconDateCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCalendarBox: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#E87A1D',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
    shadowColor: '#E87A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  iconCalendarMonth: {
    color: '#E87A1D',
    fontWeight: 'bold',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: -2,
  },
  iconCalendarDay: {
    color: '#181A20',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: -2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  cardDate: {
    color: '#888',
    fontSize: 12,
    marginRight: 10,
  },
  paidLabel: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
    alignSelf: 'center',
  },
  paidLabelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
