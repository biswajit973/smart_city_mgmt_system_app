import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { NotificationProvider } from '../components/NotificationContext';
import NotificationModal from '../components/NotificationModal';
import AccountDetailsScreen from './AccountDetails';
import BookingsScreen from './Bookings';
import BookingServicesScreen from './BookingServices';
import SearchScreen from './Search';

const Tab = createBottomTabNavigator();

function MainTabsInner() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Services') {
            return <Ionicons name="home" size={size} color={color} />;
          } else if (route.name === 'Search') {
            return <Ionicons name="search" size={size} color={color} />;
          } else if (route.name === 'Bookings') {
            return <MaterialCommunityIcons name="file-document-outline" size={size} color={color} />;
          } else if (route.name === 'Account') {
            return <Ionicons name="person-circle-outline" size={size} color={color} />;
          }
        },
        headerShown: false,
        tabBarActiveTintColor: '#181A20', // black for active tab
        tabBarInactiveTintColor: '#888', // optional: gray for inactive
      })}
    >
      <Tab.Screen name="Services" component={BookingServicesScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Account" component={AccountDetailsScreen} />
    </Tab.Navigator>
  );
}

export default function MainTabs() {
  return (
    <NotificationProvider>
      <NotificationModal />
      <MainTabsInner />
    </NotificationProvider>
  );
}
