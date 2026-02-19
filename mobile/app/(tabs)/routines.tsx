import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoutines } from '@/hooks/useRoutines';
import { RoutineListItem, DayOfWeek } from '@/types';

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export default function RoutinesScreen() {
  const { data: routines, isLoading, error, refetch } = useRoutines();

  const renderRoutineCard = ({ item }: { item: RoutineListItem }) => (
    <TouchableOpacity style={styles.routineCard} onPress={() => {}}>
      <View style={styles.routineHeader}>
        <Text style={styles.routineName}>{item.name}</Text>
        {item.day_of_week && (
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>
              {DAY_LABELS[item.day_of_week]}
            </Text>
          </View>
        )}
      </View>

      {item.description && (
        <Text style={styles.routineDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.routineFooter}>
        <View style={styles.exerciseCount}>
          <Ionicons name="barbell-outline" size={16} color="#8A8A8A" />
          <Text style={styles.exerciseCountText}>
            {item.exercise_count} exercises
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8A8A8A" />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A6FA5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load routines</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={routines}
        renderItem={renderRoutineCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color="#2A2A2A" />
            <Text style={styles.emptyTitle}>No routines yet</Text>
            <Text style={styles.emptyText}>
              Create your first workout routine to get started
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => {}}>
        <Ionicons name="add" size={28} color="#F5F5F5" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  routineCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routineName: {
    fontSize: 17,
    fontWeight: '400',
    color: '#F5F5F5',
    flex: 1,
    letterSpacing: 0.5,
  },
  dayBadge: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    marginLeft: 8,
  },
  dayBadgeText: {
    color: '#F5F5F5',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  routineDescription: {
    fontSize: 14,
    color: '#8A8A8A',
    marginBottom: 12,
    lineHeight: 20,
  },
  routineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseCountText: {
    fontSize: 13,
    color: '#8A8A8A',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#F5F5F5',
    marginTop: 16,
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#8A8A8A',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A6FA5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  retryText: {
    color: '#F5F5F5',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
