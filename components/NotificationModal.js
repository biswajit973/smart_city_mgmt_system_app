import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { useNotification } from './NotificationContext';

const { height } = Dimensions.get('window');

export default function NotificationModal() {
  const { notifModalVisible, setNotifModalVisible, notifications } = useNotification();

  return (
    <Modal
      isVisible={notifModalVisible}
      onBackdropPress={() => setNotifModalVisible(false)}
      onSwipeComplete={() => setNotifModalVisible(false)}
      swipeDirection={["down"]}
      style={{ justifyContent: 'flex-end', margin: 0 }}
      backdropTransitionOutTiming={0}
      propagateSwipe
    >
      <View style={styles.sheet}>
        <View style={styles.dragIndicator} />
        <View style={styles.headerRow}>
          <Text style={styles.header}>Notifications</Text>
        </View>

        <Text style={styles.previously}>Previously</Text>
        <View style={styles.divider} />
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📬</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyDesc}>Your notification will appear here once you&apos;ve received them.</Text>
            <TouchableOpacity>
              <Text style={styles.link}>Go to historical notifications.</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item.id.toString()}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{item.title[0]}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMsg}>{item.message}</Text>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
        <View style={styles.bottomCloseRow}>
          <TouchableOpacity style={styles.bottomCloseBtn} onPress={() => setNotifModalVisible(false)}>
            <Ionicons name="close-circle-outline" size={40} color="#bbb" />
          </TouchableOpacity>
        </View>
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
    alignItems: 'flex-start',
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#111',
    marginBottom: 2,
  },
  cardMsg: {
    color: '#333',
    fontSize: 13,
  },
  bottomCloseRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,

  },
  bottomCloseBtn: {
    width: 56,
    height: 56,
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
});
