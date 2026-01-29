/**
 * Index route - redirects based on auth state.
 * 
 * 🎓 INTERVIEW: This is the "entry point" routing logic.
 * Based on authentication state, redirect to:
 * - Login screen (if not authenticated)
 * - Main app (if authenticated)
 */

import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }
  
  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});
