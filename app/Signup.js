import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showToast } from '../components/toastHelper';

const ORANGE = '#E87A1D';

const FloatingLabelInput = forwardRef(({ label, error, style, onChangeText, value, ...props }, ref) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Always float label if value is present
  useEffect(() => {
    if (value) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 0,
        useNativeDriver: false
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false
      }).start();
    }
  }, [value, animatedValue]);

  const handleFocus = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false
    }).start();
  };

  const handleBlur = () => {
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false
      }).start();
    }
  };

  const labelStyle = {
    position: 'absolute',
    left: 12,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -8]
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

  return (
    <View style={styles.floatingInputContainer}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        ref={ref}
        style={[
          styles.floatingInput,
          error && styles.inputError,
          style
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChangeText={onChangeText}
        value={value}
        {...props}
      />
    </View>
  );
});

FloatingLabelInput.displayName = 'FloatingLabelInput';

const PasswordRequirement = ({ isMet, text }) => (
  <View style={styles.requirementRow}>
    <Ionicons 
      name={isMet ? 'checkmark-circle' : 'close-circle'} 
      size={16} 
      color={isMet ? '#4CAF50' : '#ff3333'} 
      style={styles.requirementIcon}
    />
    <Text style={[styles.requirementText, { color: isMet ? '#4CAF50' : '#ff3333' }]}>
      {text}
    </Text>
  </View>
);

PasswordRequirement.displayName = 'PasswordRequirement';

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: details
  const [secretKey, setSecretKey] = useState('');
  const [resendTimeout, setResendTimeout] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  // Add validation states
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    address: '',
    pincode: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false,
    hasLength: false
  });
  const router = useRouter();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    let timer;
    if (resendTimeout > 0) {
      timer = setTimeout(() => setResendTimeout(resendTimeout - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimeout]);

  const validateForm = () => {
    const newErrors = {
      firstName: !firstName ? 'First name is required' : '',
      lastName: !lastName ? 'Last name is required' : '',
      dob: !dob ? 'Date of birth is required' : '',
      address: !address ? 'Address is required' : '',
      pincode: !pincode ? 'Pincode is required' : '',
      email: !email ? 'Email is required' : '',
      password: '',
      confirmPassword: ''
    };

    // Email validation
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const allRequirementsMet = Object.values(passwordRequirements).every(req => req);
      if (!allRequirementsMet) {
        newErrors.password = 'Please meet all password requirements';
      }
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const checkPasswordRequirements = (text) => {
    setPassword(text);
    setErrors(prev => ({ ...prev, password: '' }));
    
    const reqs = {
      hasLower: /[a-z]/.test(text),
      hasUpper: /[A-Z]/.test(text),
      hasNumber: /\d/.test(text),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(text),
      hasLength: text.length >= 8
    };
    setPasswordRequirements(reqs);
  };

  // Format date for API (YYYY-MM-DD)
  const formatApiDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const pad = n => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  // Format date for display (date only)
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }
    if (!otpVerified) {
      setErrors(prev => ({ ...prev, otp: 'Please verify OTP before registering' }));
      return;
    }
    if (!secretKey) {
      setErrors(prev => ({ ...prev, email: 'Please request OTP first' }));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://mobile.wemakesoftwares.com/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          dob: formatApiDate(dob),
          address,
          pincode,
          password,
          confirmpassword: confirmPassword,
          secret_key: secretKey,
          otpValue: otpDigits.join('')
        }),
      });
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log('Signup non-JSON response:', text);
        showToast('error', 'Unexpected server response. Please try again later.');
        setLoading(false);
        return;
      }
      console.log('Signup response:', response);
      console.log('Signup response data:', data);
      if (response.ok) {
        showToast('success', 'Registration successful!');
        // Save email and password for quick login (commented out, since AsyncStorage is not used for dob)
        // await AsyncStorage.setItem('lastRegisteredEmail', email);
        // await AsyncStorage.setItem('lastRegisteredPassword', password);
        setTimeout(() => {
          router.replace('/Login');
        }, 1000);
      } else {
        // Show all error messages from backend using toast
        if (typeof data === 'object' && data !== null) {
          Object.entries(data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => showToast('error', `${field}: ${msg}`));
            } else {
              showToast('error', `${field}: ${messages}`);
            }
          });
        } else {
          showToast('error', data?.detail || 'Registration failed.');
        }
      }
    } catch (_e) {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://mobile.wemakesoftwares.com/api/auth/send-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok && data.secret_key) {
        setSecretKey(data.secret_key);
        setResendTimeout(30);
        setStep(2);
        setOtpDigits(['', '', '', '', '', '']);
        showToast('success', 'OTP sent to email');
      } else {
        showToast('error', data.message || 'Failed to send OTP');
      }
    } catch (_e) {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://mobile.wemakesoftwares.com/api/auth/resend-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secret_key: secretKey })
      });
      const data = await response.json();
      if (response.ok) {
        setResendTimeout(30);
        setOtpDigits(['', '', '', '', '', '']);
        showToast('success', 'OTP resent to email');
      } else {
        showToast('error', data.message || 'Failed to resend OTP');
      }
    } catch (_e) {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpValue = otpDigits.join('');
    if (otpValue.length !== 6) {
      setErrors(prev => ({ ...prev, otp: 'Please enter the 6-digit OTP' }));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://mobile.wemakesoftwares.com/api/auth/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secret_key: secretKey, otpValue })
      });
      const data = await response.json();
      if (response.ok && data.message === 'OTP verified successfully') {
        setOtpVerified(true);
        setStep(3);
        showToast('success', 'OTP verified!');
      } else {
        setOtpVerified(false);
        showToast('error', data.message || 'OTP verification failed');
      }
    } catch (_e) {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      enabled
    >
      <ScrollView 
        contentContainerStyle={[styles.container, { justifyContent: 'flex-start' }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        bounces={false}
      >
        <Text style={styles.title}>Create Your Joda municipality Account</Text>
        <Text style={styles.subtitle}>Register to book cleaning, waste pickup, and raise grievances for a better Joda.</Text>
        {/* Stepper UI */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <View style={[styles.stepCircle, step >= 1 && styles.stepActive]}><Text style={styles.stepText}>1</Text></View>
          <View style={styles.stepLine} />
          <View style={[styles.stepCircle, step >= 2 && styles.stepActive]}><Text style={styles.stepText}>2</Text></View>
          <View style={styles.stepLine} />
          <View style={[styles.stepCircle, step === 3 && styles.stepActive]}><Text style={styles.stepText}>3</Text></View>
        </View>
        {/* Step 1: Email */}
        {step === 1 && (
          <View style={styles.inputWrapper}>
            <FloatingLabelInput
              label="Email Address"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setErrors(prev => ({ ...prev, email: '' }));
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            <TouchableOpacity style={styles.signUpBtn} onPress={handleSendOtp} disabled={loading || !email}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signUpText}>Send OTP</Text>}
            </TouchableOpacity>
          </View>
        )}
        {/* Step 2: OTP */}
        {step === 2 && (
          <View style={styles.inputWrapper}>
            <Text style={{ textAlign: 'center', marginBottom: 12 }}>
              Please check your email ({email}) for the OTP.
            </Text>
            <View style={styles.otpRow}>
              {otpDigits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={otpInputs[idx]}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={val => {
                    if (/^\d?$/.test(val)) {
                      const newDigits = [...otpDigits];
                      newDigits[idx] = val;
                      setOtpDigits(newDigits);
                      setErrors(prev => ({ ...prev, otp: '' }));
                      if (val && idx < 5) {
                        otpInputs[idx + 1].current.focus();
                      }
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      if (otpDigits[idx] === '' && idx > 0) {
                        const newDigits = [...otpDigits];
                        newDigits[idx - 1] = '';
                        setOtpDigits(newDigits);
                        otpInputs[idx - 1].current.focus();
                      }
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  returnKeyType="next"
                  textAlign="center"
                  autoFocus={idx === 0}
                  underlineColorAndroid="transparent"
                />
              ))}
            </View>
            {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
            <TouchableOpacity style={styles.signUpBtn} onPress={handleVerifyOtp} disabled={loading || otpDigits.join('').length !== 6}>
              <Text style={styles.signUpText}>Verify OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResendOtp} style={{ marginTop: 12 }} disabled={loading || resendTimeout > 0}>
              <Text style={{ color: ORANGE, textAlign: 'center', textDecorationLine: 'underline' }}>{resendTimeout > 0 ? `Resend OTP (${resendTimeout})` : 'Resend OTP'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Step 3: Details */}
        {step === 3 && (
          <>
            <View style={styles.inputWrapper}>
              <FloatingLabelInput
                label="First Name"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  setErrors(prev => ({ ...prev, firstName: '' }));
                }}
                error={errors.firstName}
              />
              {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
            </View>
            <View style={styles.inputWrapper}>
              <FloatingLabelInput
                label="Last Name"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  setErrors(prev => ({ ...prev, lastName: '' }));
                }}
                error={errors.lastName}
              />
              {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
            </View>
            <View style={styles.inputWrapper}>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <FloatingLabelInput
                  label="Date of Birth"
                  value={dob ? formatDisplayDate(dob) : ''}
                  editable={false}
                  error={errors.dob}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dob ? new Date(dob) : new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (event.type === 'set' && selectedDate) {
                      // Only set date part, zero out time
                      selectedDate.setHours(0, 0, 0, 0);
                      setDob(selectedDate.toISOString());
                      setErrors(prev => ({ ...prev, dob: '' }));
                    }
                  }}
                />
              )}
              {errors.dob ? <Text style={styles.errorText}>{errors.dob}</Text> : null}
            </View>
            <View style={styles.inputWrapper}>
              <FloatingLabelInput
                label="Complete Address"
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  setErrors(prev => ({ ...prev, address: '' }));
                }}
                error={errors.address}
                multiline
              />
              {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
            </View>
            <View style={styles.inputWrapper}>
              <FloatingLabelInput
                label="Pincode"
                value={pincode}
                onChangeText={(text) => {
                  setPincode(text);
                  setErrors(prev => ({ ...prev, pincode: '' }));
                }}
                error={errors.pincode}
                keyboardType="numeric"
              />
              {errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}
            </View>
            <View style={styles.inputWrapper}>
              <FloatingLabelInput
                label="Password"
                value={password}
                onChangeText={checkPasswordRequirements}
                error={errors.password}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
              </TouchableOpacity>
              
              <View style={styles.passwordRequirements}>
                <PasswordRequirement 
                  isMet={passwordRequirements.hasLower} 
                  text="At least one lowercase letter"
                />
                <PasswordRequirement 
                  isMet={passwordRequirements.hasUpper} 
                  text="At least one uppercase letter"
                />
                <PasswordRequirement 
                  isMet={passwordRequirements.hasNumber} 
                  text="At least one number"
                />
                <PasswordRequirement 
                  isMet={passwordRequirements.hasSpecial} 
                  text="At least one special character"
                />
                <PasswordRequirement 
                  isMet={passwordRequirements.hasLength} 
                  text="Minimum 8 characters"
                />
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>
            <View style={styles.inputWrapper}>
              <FloatingLabelInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                error={errors.confirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
              >
                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
              </TouchableOpacity>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>
            <TouchableOpacity style={styles.signUpBtn} onPress={handleSignup} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpText}>Register</Text>
              )}
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.bottomText}>
          Already have an account?{' '}
          <Text style={styles.loginText} onPress={() => router.push('/Login')}>Sign In</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingBottom: 120, // Increased bottom padding
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#181A20',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 18,
    color: '#181A20',
    marginBottom: 24,
    fontWeight: '500',
  },
  floatingInputContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  floatingInput: {
    height: 56,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#181A20',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 12,
    top: 16,
    zIndex: 1,
  },
  signUpBtn: {
    backgroundColor: '#181A20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
    shadowColor: ORANGE,
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  signUpText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  bottomText: {
    textAlign: 'center',
    color: '#181A20',
    fontSize: 14,
    marginTop: 8,
  },
  loginText: {
    color: ORANGE,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#ff3333',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: '#ff3333',
  },
  passwordRequirements: {
    marginTop: 8,
    paddingLeft: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementIcon: {
    marginRight: 8,
  },
  requirementText: {
    fontSize: 12,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  stepActive: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },
  stepText: {
    color: '#181A20',
    fontWeight: 'bold',
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: '#ccc',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  otpInput: {
    width: 40,
    height: 48,
    borderBottomWidth: 2,
    borderColor: '#ccc',
    fontSize: 24,
    textAlign: 'center',
    marginHorizontal: 4,
    color: '#181A20',
    backgroundColor: 'transparent',
  },
});
