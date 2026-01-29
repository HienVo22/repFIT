/**
 * Root Layout - App-wide providers and navigation structure.
 * 
 * 🎓 INTERVIEW CONCEPT: Provider Pattern
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providers wrap the app to make context/state available everywhere:
 * - QueryClientProvider: TanStack Query cache
 * - SafeAreaProvider: Screen safe area insets
 * - ThemeProvider: (if using) UI theming
 * 
 * The order matters! Inner providers can access outer providers.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';

// Create a QueryClient instance
// 🎓 INTERVIEW: This should be created outside the component
// to avoid recreating on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Retry failed requests twice
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
  },
});

export default function RootLayout() {
  const { initialize, isLoading } = useAuthStore();
  
  // Initialize auth on app start
  useEffect(() => {
    initialize();
  }, []);
  
  // You could show a splash screen while loading
  // For now, we let the Stack handle it
  
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
