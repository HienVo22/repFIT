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
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { register, login, getCurrentUser } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { setUser } = useAuthStore();

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: async () => {
      try {
        await login({ email, password });
        const user = await getCurrentUser();
        setUser(user);
        router.replace('/(tabs)');
      } catch {
        Alert.alert('Success', 'Account created! Please login.');
        router.replace('/(auth)/login');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    },
  });

  const handleRegister = () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters');
      return;
    }
    registerMutation.mutate({ username, email, password });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your fitness journey</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#8A8A8A"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#8A8A8A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min 8 characters)"
              placeholderTextColor="#8A8A8A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#8A8A8A"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            <TouchableOpacity
              style={[styles.button, registerMutation.isPending && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={registerMutation.isPending}
            >
              <Text style={styles.buttonText}>
                {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#F5F5F5',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A8A8A',
    letterSpacing: 1,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    fontSize: 16,
    color: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  button: {
    backgroundColor: '#4A6FA5',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#8A8A8A',
    fontSize: 14,
  },
  linkText: {
    color: '#4A6FA5',
    fontSize: 14,
    fontWeight: '500',
  },
});
