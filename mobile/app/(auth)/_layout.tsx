import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#F5F5F5',
        headerTitleStyle: { fontWeight: '300', letterSpacing: 1 },
        contentStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Create Account', headerShown: false }} />
    </Stack>
  );
}
