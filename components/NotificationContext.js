import React, { createContext, useContext, useState } from 'react';

export const NotificationContext = createContext({
  notifModalVisible: false,
  setNotifModalVisible: () => {},
  notifications: [],
});

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  // Demo notifications
  const [notifications] = useState([
    { id: 1, title: 'Booking Confirmed', message: 'Your Kalyan Mandap booking is confirmed.' },
    { id: 2, title: 'Waste Pickup', message: 'Your waste pickup request is scheduled for tomorrow.' },
    { id: 3, title: 'Complaint Update', message: 'Your complaint has been resolved.' },
  ]);
  return (
    <NotificationContext.Provider value={{ notifModalVisible, setNotifModalVisible, notifications }}>
      {children}
    </NotificationContext.Provider>
  );
}
