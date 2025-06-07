import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { showToast } from '../components/toastHelper';
import FloatingLabelInput from '../components/ui/FloatingLabelInput';
import { API_BASE_URL } from '../constants/api';

const ORANGE = '#E87A1D';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateForm = () => {
    let valid = true;
    let newErrors = { email: '', password: '' };
    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    if (!email || !password) {
      showToast('error', 'Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      console.log('Login response:', response);
      console.log('Login response data:', data);
      if (response.ok) {
        // Store all authentication and user data in AsyncStorage
        for (const [key, value] of Object.entries(data)) {
          await AsyncStorage.setItem(key, String(value));
        }
        showToast('success', 'Login Successful!', 'Welcome back!');
        setTimeout(() => {
          setLoading(false);
          router.replace('/(tabs)');
        }, 1000);
      } else {
        setLoading(false);
        if (typeof data === 'object' && data !== null) {
          Object.entries(data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => showToast('error', `${field}: ${msg}`));
            } else {
              showToast('error', `${field}: ${messages}`);
            }
          });
        } else {
          showToast('error', data?.detail || 'Login failed.');
        }
      }
    } catch (e) {
      setLoading(false);
      console.log('Login error:', e);
      showToast('error', 'Network error', 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={[styles.title, { lineHeight: 40 }]}>Sign In to Joda municipality</ThemedText>
        <ThemedText style={styles.subtitle}>Access city cleaning, waste pickup, and grievance redressal for a better Joda.</ThemedText>
        <ThemedText style={styles.subtitle2}>Welcome back! Let&#39;s keep our city clean together.</ThemedText>
        
        <FloatingLabelInput
          label="Email Address"
          value={email}
          onChangeText={text => {
            setEmail(text);
            setErrors(prev => ({ ...prev, email: '' }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: 4 }}
          error={errors.email}
        />
        <FloatingLabelInput
          label="Password"
          value={password}
          onChangeText={text => {
            setPassword(text);
            setErrors(prev => ({ ...prev, password: '' }));
          }}
          secureTextEntry={!showPassword}
          style={{ marginBottom: 1 }}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          }
          error={errors.password}
        />

        <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/ForgotPassword')}>
          <ThemedText style={styles.forgotText}>Forgot Password ?</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signInBtn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.signInText}>Sign In</ThemedText>
          )}
        </TouchableOpacity>

        <View style={styles.orRow}>
          <View style={styles.line} />
          <ThemedText style={styles.orText}>or</ThemedText>
          <View style={styles.line} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <Image source={require('../assets/images/icons8-google-48.png')} style={styles.socialIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="logo-facebook" size={28} color="#1877F3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="logo-apple" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.bottomText}>
          Don’t have an account?{' '}
          <ThemedText style={styles.registerText} onPress={() => router.push('/Signup')}>Register Now</ThemedText>
        </ThemedText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#181A20',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
    color: '#181A20',
  },
  subtitle2: {
    fontSize: 16,
    marginBottom: 24,
    color: '#181A20',
  },
  inputBox: {
    backgroundColor: '#F5F6F7',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    marginBottom: 14,
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
  eyeIcon: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 13,
    color: ORANGE,
  },
  signInBtn: {
    backgroundColor: '#181A20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: ORANGE,
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  signInText: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#fff',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  orText: {
    marginHorizontal: 8,
    fontSize: 15,
    color: '#181A20',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 18,
  },
  socialBtn: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    backgroundColor: '#fff',
  },
  socialIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  bottomText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    color: '#181A20',
  },
  registerText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: ORANGE,
  },
});
