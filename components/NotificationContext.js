import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';

export const NotificationContext = createContext({
  notifModalVisible: false,
  setNotifModalVisible: () => {},
  notifications: [],
  setNotifications: () => {},
  notificationCount: 0,
  setNotificationCount: () => {},
  handleNotificationClick: () => {},
  refreshNotifications: () => Promise.resolve(),
});

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export function NotificationProvider({ children }) {
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  // Helper to generate a unique key for a notification
  const getNotifKey = (notif) => `${notif.booking_id || ''}_${notif.service_type || ''}`;

  const refreshNotifications = useCallback(async (isInitial = false) => {
    if (!isInitial && !notifModalVisible) return;
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('access');
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch('https://mobile.wemakesoftwares.com/api/user/notifications/', { headers });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      let notificationsArray = data;
      if (data && typeof data === 'object' && Array.isArray(data.data)) {
        notificationsArray = data.data;
      }
      if (!notificationsArray || !Array.isArray(notificationsArray)) {
        setNotifications([]);
        setNotificationCount(0);
        setError(null);
        return;
      }
      // Get seen notifications from AsyncStorage (by booking_id + service_type)
      let seenNotifs = [];
      let storedSeen = await AsyncStorage.getItem('seenNotificationPairs');
      if (storedSeen) {
        try {
          seenNotifs = JSON.parse(storedSeen);
        } catch {}
      }
      // Helper to check if a notification is seen
      const isSeen = (notif) => seenNotifs.some(s => s.booking_id === notif.booking_id && s.service_type === notif.service_type);
      // Mark all as new by default, except those in seenNotifs
      const markedData = notificationsArray.map(notif => ({
        ...notif,
        is_new: !isSeen(notif)
      }));
      // Count new notifications
      const newCount = markedData.filter(n => n.is_new).length;
      setNotifications(markedData);
      setNotificationCount(newCount);
      setError(null);
    } catch (err) {
      console.error('Error refreshing notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [notifModalVisible]);

  const handleNotificationClick = async (notifOrIndex) => {
    let index;
    let notif;
    if (typeof notifOrIndex === 'number') {
      index = notifOrIndex;
      notif = notifications[index];
    } else {
      notif = notifOrIndex;
      index = notifications.findIndex(n => n.booking_id === notif.booking_id && n.service_type === notif.service_type);
    }
    if (index === -1 || !notif) return;
    try {
      let currentNotifications = [...notifications];
      if (!currentNotifications[index]) return;
      if (currentNotifications[index].is_new) {
        // Add this notification's booking_id + service_type to the seen set in AsyncStorage
        let storedSeen = await AsyncStorage.getItem('seenNotificationPairs');
        let seenNotifs = storedSeen ? JSON.parse(storedSeen) : [];
        // Only add if not already present
        if (!seenNotifs.some(s => s.booking_id === notif.booking_id && s.service_type === notif.service_type)) {
          seenNotifs.push({ booking_id: notif.booking_id, service_type: notif.service_type });
          await AsyncStorage.setItem('seenNotificationPairs', JSON.stringify(seenNotifs));
        }
        // Remove the 'NEW' label only from the clicked notification
        currentNotifications[index] = {
          ...currentNotifications[index],
          is_new: false,
        };
        setNotifications(currentNotifications);
        setNotificationCount(prev => (prev > 0 ? prev - 1 : 0));
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  // Initial load of notifications and count
  useEffect(() => {
    // Only initialize once, don't set counter to 1 by default
    let initialized = false;
    const initializeNotifications = async () => {
      if (initialized) return;
      initialized = true;
      await refreshNotifications(true);
    };
    initializeNotifications();
    // eslint-disable-next-line
  }, []);

  // Refresh notifications only when modal is opened (not on every render)
  useEffect(() => {
    if (notifModalVisible) {
      refreshNotifications(false);
    }
    // Do not call refreshNotifications on close
    // eslint-disable-next-line
  }, [notifModalVisible]);

  // Handle login state
  useEffect(() => {
    const checkLoginState = async () => {
      try {
        const justLoggedIn = await AsyncStorage.getItem('justLoggedIn');
        if (justLoggedIn === 'true') {
          await refreshNotifications(true);
          setNotifModalVisible(true);
          await AsyncStorage.removeItem('justLoggedIn');
        }
      } catch (err) {
        console.error('Error checking login state:', err);
      }
    };
    checkLoginState();
  }, [refreshNotifications]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifModalVisible, 
        setNotifModalVisible, 
        notifications, 
        loading, 
        error, 
        setNotifications,
        handleNotificationClick,
        notificationCount,
        setNotificationCount,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

const styles = {
  card: {
    // ...existing styles...
  },
  cardNew: {
    // ...existing styles...
  },
  // Add any other styles used in the component
};

const NotificationCard = ({ notif }) => {
  const { handleNotificationClick } = useNotification();

  // Determine if the notification is for a paid cesspool service or a completed complaint
  const isCesspoolPaid = notif.payment_status ;
  console.log('NotificationCard:', isCesspoolPaid);
  const isComplaintCompleted = notif.service_type === 'complaints' && notif.category === 'booking' && notif.status === 'completed';
  const isApproved = notif.status && notif.status.toLowerCase() === 'approved';
  let cardBorder = {};
  if (isCesspoolPaid || isComplaintCompleted) {
    cardBorder = {  borderWidth: 2 };
  } else if (isApproved) {
    cardBorder = { borderWidth: 2 };
  }
  const cardStyle = [
    styles.card,
    cardBorder,
    notif.is_new ? styles.cardNew : null
  ];

  return (
    <TouchableOpacity 
      style={cardStyle} 
      onPress={() => handleNotificationClick(notif)}
    >
      {/* Render notification content */}
    </TouchableOpacity>
  );
};
