import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showToast } from '../components/toastHelper';
import FloatingLabelInput from '../components/ui/FloatingLabelInput';

const ORANGE = '#E87A1D';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [loading, setLoading] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [resendTimeout, setResendTimeout] = useState(0);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [otpVerified, setOtpVerified] = useState(false);
  const [errors, setErrors] = useState({ email: '', otp: '', password: '', confirmPassword: '' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false,
    hasLength: false
  });
  const router = useRouter();

  useEffect(() => {
    let timer;
    if (resendTimeout > 0) {
      timer = setTimeout(() => setResendTimeout(resendTimeout - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimeout]);

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

  const validatePasswordForm = () => {
    const newErrors = { password: '', confirmPassword: '' };
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const allRequirementsMet = Object.values(passwordRequirements).every(req => req);
      if (!allRequirementsMet) {
        newErrors.password = 'Please meet all password requirements';
      }
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://mobile.wemakesoftwares.com/api/auth/send-password-reset-otp/', {
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

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://mobile.wemakesoftwares.com/api/auth/resend-password-reset-otp/', {
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

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const otpValue = otpDigits.join('');
    if (otpValue.length !== 6) {
      setErrors(prev => ({ ...prev, otp: 'Please enter the 6-digit OTP' }));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://mobile.wemakesoftwares.com/api/auth/verify-password-reset-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret_key: secretKey, otpValue })
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

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!validatePasswordForm()) return;
    if (!otpVerified) {
      setErrors(prev => ({ ...prev, otp: 'Please verify OTP before resetting password' }));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://mobile.wemakesoftwares.com/api/auth/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: password })
      });
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        data = await response.json();
      } else {
        showToast('error', 'Unexpected server response. Please try again later.');
        setLoading(false);
        return;
      }
      if (response.ok) {
        showToast('success', 'Password reset successful!');
        setTimeout(() => {
          router.replace('/Login');
        }, 1000);
      } else {
        if (typeof data === 'object' && data !== null) {
          Object.entries(data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => showToast('error', msg));
            } else {
              showToast('error', messages);
            }
          });
        } else {
          showToast('error', data?.detail || 'Password reset failed.');
        }
      }
    } catch (_e) {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password requirement UI
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
        <Text style={styles.title}>Forgot Password for Joda municipality</Text>
        <Text style={styles.subtitle}>Enter your registered email to receive a password reset link for your municipality account.</Text>
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
          <>
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
            </View>
            <TouchableOpacity style={styles.signUpBtn} onPress={handleSendOtp} disabled={loading || !email}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signUpText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        )}
        {/* Step 2: OTP */}
        {step === 2 && (
          <>
            <View style={styles.inputWrapper}>
              <Text style={{ textAlign: 'center', marginBottom: 12 }}>
                Please check your email ({email}) for the OTP.
              </Text>
              <View style={styles.otpRowDashed}>
                {otpDigits.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={otpInputs[idx]}
                    style={styles.otpInputDashed}
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
            </View>
            <TouchableOpacity style={styles.signUpBtn} onPress={handleVerifyOtp} disabled={loading || otpDigits.join('').length !== 6}>
              <Text style={styles.signUpText}>Verify OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResendOtp} style={{ marginTop: 12 }} disabled={loading || resendTimeout > 0}>
              <Text style={{ color: ORANGE, textAlign: 'center', textDecorationLine: 'underline' }}>{resendTimeout > 0 ? `Resend OTP (${resendTimeout})` : 'Resend OTP'}</Text>
            </TouchableOpacity>
          </>
        )}
        {/* Step 3: Reset Password */}
        {step === 3 && (
          <>
            <View style={styles.inputWrapper}>
              <FloatingLabelInput
                label="New Password"
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
              {/* Remove duplicate error: only show error in FloatingLabelInput */}
            </View>
            <View style={[styles.inputWrapper, { marginTop: -8 }]}> 
              <FloatingLabelInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={text => {
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
              {/* Remove duplicate error: only show error in FloatingLabelInput */}
            </View>
            <View style={styles.passwordRequirementsBox}>
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
            <TouchableOpacity style={styles.signUpBtn} onPress={handleResetPassword} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.bottomText}>
          Remember your password?{' '}
          <Text style={styles.loginText} onPress={() => router.push('/Login')}>Sign In</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#181A20',
  },
  subtitle: {
    fontSize: 16,
    color: '#181A20',
    marginBottom: 24,
    fontWeight: '500',
  },
  inputBox: {
    backgroundColor: '#F5F6F7',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    marginBottom: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  input: {
    backgroundColor: '#F5F6F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#181A20',
    flex: 1,
    marginBottom: 4,
  },
  resetBtn: {
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
  resetText: {
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
  eyeIconContainer: {
    position: 'absolute',
    right: 12,
    top: 16,
    zIndex: 1,
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
  errorText: {
    color: '#ff3333',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  // Add/adjust styles to match Signup
  inputWrapper: {
    marginBottom: 16,
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
  // Add/adjust OTP input box style to match Signup
  otpRowSignup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  otpInputSignup: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 24,
    textAlign: 'center',
    marginHorizontal: 4,
    color: '#181A20',
    padding: 0,
  },
  // Add/adjust styles for password requirements box to match Signup
  passwordRequirementsBox: {
    backgroundColor: '#F5F6F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#eee',
  },
  // Add/adjust styles for floating label input to match Signup
  floatingInputContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    marginBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 56,
    justifyContent: 'center',
  },
  floatingLabel: {
    position: 'absolute',
    left: 12,
    top: 8,
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  // Add/adjust styles for dashed OTP input
  otpRowDashed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 24,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  otpInputDashed: {
    width: 48,
    height: 56,
    borderBottomWidth: 3,
    borderColor: '#ccc',
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    fontSize: 32,
    textAlign: 'center',
    marginHorizontal: 0,
    color: '#181A20',
    padding: 0,
  },
});
