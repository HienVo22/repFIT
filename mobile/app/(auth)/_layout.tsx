/**
 * Auth Stack Layout - Login and Register screens.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: '#1a1a2e',
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Create Account',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
