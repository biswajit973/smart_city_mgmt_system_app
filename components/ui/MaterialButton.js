import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

const MaterialButton = ({ 
  onPress, 
  title, 
  variant = 'contained', // contained, outlined, text
  color = '#181A20',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props 
}) => {
  const getButtonStyle = () => {
    if (disabled) {
      return variant === 'contained' 
        ? styles.disabledButton 
        : styles.disabledOutlinedButton;
    }
    
    switch (variant) {
      case 'outlined':
        return [styles.outlinedButton, { borderColor: color }];
      case 'text':
        return styles.textButton;
      default:
        return [styles.containedButton, { backgroundColor: color }];
    }
  };

  const getTextStyle = () => {
    if (disabled) {
      return styles.disabledText;
    }
    
    switch (variant) {
      case 'contained':
        return styles.containedText;
      case 'outlined':
      case 'text':
        return [styles.outlinedText, { color }];
      default:
        return styles.containedText;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'contained' ? '#fff' : color} 
          size="small" 
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={variant === 'contained' ? '#fff' : color}
              style={styles.icon}
            />
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
  },
  containedButton: {
    backgroundColor: '#181A20',
    elevation: 2,
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledOutlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  containedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlinedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#666',
  },
  icon: {
    marginRight: 8,
  },
});

export default MaterialButton;
