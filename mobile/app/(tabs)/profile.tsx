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
          size={22}
          color={destructive ? '#ef4444' : '#8A8A8A'}
        />
        <Text style={[styles.menuItemLabel, destructive && styles.destructiveText]}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#2A2A2A" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        <MenuItem icon="person-outline" label="Edit Profile" onPress={() => {}} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
        <MenuItem icon="barbell-outline" label="Workout Preferences" onPress={() => {}} />
        <MenuItem icon="nutrition-outline" label="Nutrition Goals" onPress={() => {}} />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>App</Text>
        <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
        <MenuItem icon="document-text-outline" label="Terms & Privacy" onPress={() => {}} />
      </View>

      <View style={styles.menuSection}>
        <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} destructive />
      </View>

      <Text style={styles.version}>repFIT v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  userSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A6FA5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#F5F5F5',
  },
  username: {
    fontSize: 24,
    fontWeight: '300',
    color: '#F5F5F5',
    letterSpacing: 1,
  },
  email: {
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  menuSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1E1E1E',
    marginBottom: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 15,
    color: '#F5F5F5',
  },
  destructiveText: {
    color: '#ef4444',
  },
  version: {
    textAlign: 'center',
    color: '#2A2A2A',
    fontSize: 12,
    marginTop: 'auto',
    paddingBottom: 24,
    letterSpacing: 1,
  },
});
