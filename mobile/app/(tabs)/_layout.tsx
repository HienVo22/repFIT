/**
 * Tab Navigator Layout.
 * 
 * 🎓 INTERVIEW CONCEPT: Tab Navigation UX
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Tab navigation is the standard pattern for mobile apps because:
 * 1. Easy thumb access at bottom of screen
 * 2. Persistent navigation state
 * 3. Clear indication of current location
 * 4. Quick switching between main sections
 * 
 * The center "Record" tab is larger - a common pattern for
 * the primary action (like Instagram's post button).
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#252542',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.recordButton, focused && styles.recordButtonActive]}>
              <Ionicons 
                name="add" 
                size={32} 
                color={focused ? '#fff' : '#6366f1'} 
              />
            </View>
          ),
          tabBarLabel: () => null, // Hide label for center button
        }}
      />
      
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="nutrition-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#252542',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  recordButtonActive: {
    backgroundColor: '#6366f1',
  },
});
