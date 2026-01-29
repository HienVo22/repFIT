/**
 * Profile Screen - User settings and logout.
 */

import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };
  
  const MenuItem = ({ 
    icon, 
    label, 
    onPress,
    destructive = false,
  }: { 
    icon: keyof typeof Ionicons.glyphMap; 
    label: string; 
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={destructive ? '#ef4444' : '#888'} 
        />
        <Text style={[styles.menuItemLabel, destructive && styles.destructiveText]}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#444" />
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      
      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <MenuItem 
          icon="person-outline" 
          label="Edit Profile" 
          onPress={() => {}} 
        />
        <MenuItem 
          icon="notifications-outline" 
          label="Notifications" 
          onPress={() => {}} 
        />
        <MenuItem 
          icon="barbell-outline" 
          label="Workout Preferences" 
          onPress={() => {}} 
        />
        <MenuItem 
          icon="nutrition-outline" 
          label="Nutrition Goals" 
          onPress={() => {}} 
        />
      </View>
      
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>App</Text>
        
        <MenuItem 
          icon="moon-outline" 
          label="Dark Mode" 
          onPress={() => {}} 
        />
        <MenuItem 
          icon="help-circle-outline" 
          label="Help & Support" 
          onPress={() => {}} 
        />
        <MenuItem 
          icon="document-text-outline" 
          label="Terms & Privacy" 
          onPress={() => {}} 
        />
      </View>
      
      <View style={styles.menuSection}>
        <MenuItem 
          icon="log-out-outline" 
          label="Logout" 
          onPress={handleLogout}
          destructive
        />
      </View>
      
      {/* Version */}
      <Text style={styles.version}>repFIT v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  userSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#252542',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  menuSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: '#252542',
    marginBottom: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#fff',
  },
  destructiveText: {
    color: '#ef4444',
  },
  version: {
    textAlign: 'center',
    color: '#444',
    fontSize: 12,
    marginTop: 'auto',
    paddingBottom: 24,
  },
});
