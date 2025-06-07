import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';

const FloatingLabelInput = forwardRef(({ label, error, style, onChangeText, value, placeholder, rightIcon, ...props }, ref) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  const animate = useCallback((toValue) => {
    Animated.timing(animatedValue, {
      toValue,
      duration: 200,
      useNativeDriver: false
    }).start();
  }, [animatedValue]);

  const handleFocus = useCallback(() => {
    animate(1);
  }, [animate]);

  const handleBlur = useCallback(() => {
    if (!value || value.length === 0) {
      animate(0);
    }
  }, [animate, value]);

  useEffect(() => {
    if (value && value.length > 0) {
      animate(1);
    } else {
      animate(0);
    }
  }, [value, animate]);
  const inputStyle = [
    styles.floatingInput,
    error && styles.inputError,
    props.multiline && styles.multilineInput,
    style
  ];

  const labelStyle = {
    position: 'absolute',
    left: 12,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [props.multiline ? 14 : 14, -8]
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12]
    }),
    color: error ? '#ff3333' : '#666',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    zIndex: 1
  };

  const isFloating = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <View style={styles.floatingInputContainer}>
      <Animated.Text style={labelStyle}>
        {label || ''}
      </Animated.Text>
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          ref={ref}
          style={[...inputStyle, rightIcon ? { paddingRight: 40 } : {}]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={onChangeText}
          value={typeof value === 'string' ? value : ''}
          placeholder={isFloating.__getValue() === 1 ? '' : (placeholder || '')}
          placeholderTextColor="#666"
          textAlignVertical={props.multiline ? 'top' : 'center'}
          {...props}
        />
        {rightIcon && (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>
          {typeof error === 'string' ? error : ''}
        </Text>
      ) : null}
    </View>
  );
});

FloatingLabelInput.defaultProps = {
  placeholder: '',
  label: '',
  value: '',
  error: '',
};

FloatingLabelInput.displayName = 'FloatingLabelInput';

const styles = StyleSheet.create({
  floatingInputContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  floatingInput: {
    height: 56,
    paddingHorizontal: 12,
    paddingTop: 8,
    fontSize: 16,
    color: '#181A20',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#ff3333',
  },
  errorText: {
    color: '#ff3333',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    zIndex: 2,
  },
});

export default FloatingLabelInput;
