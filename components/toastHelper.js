import { Keyboard, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

// A helper to show toast from anywhere
export const showToast = (type, title, message) => {
  // Check if keyboard is visible
  if (Platform.OS === 'android') {
    Keyboard.dismiss(); // On Android, dismiss keyboard to show toast
  }
  
  // Add color mapping for toast types
  const toastColors = {
    success: '#4CAF50', // Green for success
    error: '#F44336',  // Red for error
    info: '#2196F3',   // Blue for info
    warning: '#FFC107' // Yellow for warning
  };

  // Modify Toast.show to include backgroundColor based on type
  Toast.show({
    type: type,
    text1: title,
    text2: message,
    position: 'bottom',
    bottomOffset: 60,
    onShow: () => {
      // If keyboard is shown, hide the toast
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          Toast.hide();
        }
      );

      // Clean up listener after toast is hidden
      setTimeout(() => {
        keyboardDidShowListener.remove();
      }, 4000);
    },
    visibilityTime: 4000,
    props: {
      backgroundColor: toastColors[type] || '#000', // Default to black if type is unknown
    },
  });
};
