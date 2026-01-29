/**
 * Login Screen.
 * 
 * 🎓 INTERVIEW CONCEPT: Form Handling in React Native
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * This demonstrates:
 * 1. Controlled inputs with useState
 * 2. Form validation
 * 3. Loading states during submission
 * 4. Error handling and display
 * 5. Navigation after successful login
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser } from '@/api/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useAuthStore();
  
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      // Fetch user profile after successful login
      const user = await getCurrentUser();
      setUser(user);
      router.replace('/(tabs)');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      Alert.alert('Login Failed', message);
    },
  });
  
  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter email and password');
      return;
    }
    
    loginMutation.mutate({ email, password });
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo/Title */}
        <View style={styles.header}>
          <Text style={styles.logo}>💪</Text>
          <Text style={styles.title}>repFIT</Text>
          <Text style={styles.subtitle}>Track your gains</Text>
        </View>
        
        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          
          <TouchableOpacity
            style={[styles.button, loginMutation.isPending && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Register link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#252542',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#3d3d5c',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  linkText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
});
