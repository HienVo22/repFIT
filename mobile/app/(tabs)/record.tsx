import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoutines } from '@/hooks/useRoutines';
import { useWorkoutStore } from '@/store/workoutStore';
import { RoutineListItem } from '@/types';
import { getRoutine } from '@/api/routines';
import { saveWorkoutSession } from '@/api/workouts';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function RecordScreen() {
  const { data: routines, isLoading } = useRoutines();
  const {
    isActive,
    routine,
    sets,
    elapsedSeconds,
    currentSetIndex,
    startWorkout,
    endWorkout,
    completeSet,
    tick,
  } = useWorkoutStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(tick, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, tick]);

  const handleSelectRoutine = async (item: RoutineListItem) => {
    try {
      const fullRoutine = await getRoutine(item.id);
      startWorkout(fullRoutine);
    } catch (error) {
      Alert.alert('Error', 'Failed to load routine');
    }
  };

  const handleEndWorkout = () => {
    Alert.alert(
      'End Workout?',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            const result = endWorkout();

            try {
              if (result.routine && result.startTime) {
                await saveWorkoutSession({
                  routine_id: result.routine.id,
                  routine_name: result.routine.name,
                  started_at: result.startTime.toISOString(),
                  ended_at: new Date().toISOString(),
                  duration_seconds: result.duration,
                  completed_sets: result.completedSets.map(s => ({
                    exercise_name: result.routine!.exercises[s.exerciseIndex].exercise_name,
                    set_number: s.setNumber,
                    reps_completed: s.actualReps ?? s.targetReps,
                    weight_used: s.actualWeight ?? s.targetWeight,
                    is_completed: true,
                  })),
                });
              }
            } catch {
              // Save failed but workout is already ended locally
            }

            Alert.alert(
              'Workout Complete',
              `Duration: ${formatTime(result.duration)}\nSets completed: ${result.completedSets.length}`
            );
          },
        },
      ]
    );
  };

  // Active workout view
  if (isActive && routine) {
    return (
      <View style={styles.container}>
        <View style={styles.workoutHeader}>
          <Text style={styles.workoutTitle}>{routine.name}</Text>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={24} color="#4A6FA5" />
            <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
          </View>
        </View>

        <FlatList
          data={sets}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.setsList}
          renderItem={({ item, index }) => {
            const exercise = routine.exercises[item.exerciseIndex];
            const isCurrentSet = index === currentSetIndex;

            return (
              <TouchableOpacity
                style={[
                  styles.setCard,
                  item.status === 'completed' && styles.setCompleted,
                  item.status === 'skipped' && styles.setSkipped,
                  isCurrentSet && styles.setActive,
                ]}
                onPress={() => {
                  if (item.status === 'pending') {
                    completeSet(index);
                  }
                }}
                disabled={item.status !== 'pending'}
              >
                <View style={styles.setInfo}>
                  <Text style={styles.setExercise}>{exercise.exercise_name}</Text>
                  <Text style={styles.setDetails}>
                    Set {item.setNumber} · {item.targetReps} reps
                    {item.targetWeight ? ` @ ${item.targetWeight}kg` : ''}
                  </Text>
                </View>

                <View style={[
                  styles.setBubble,
                  item.status === 'completed' && styles.setBubbleCompleted,
                ]}>
                  {item.status === 'completed' ? (
                    <Ionicons name="checkmark" size={24} color="#F5F5F5" />
                  ) : (
                    <Text style={styles.setBubbleText}>{item.setNumber}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.workoutFooter}>
          <TouchableOpacity style={styles.endButton} onPress={handleEndWorkout}>
            <Text style={styles.endButtonText}>Finish Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Routine selection view
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A6FA5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.selectionHeader}>
        <Text style={styles.selectionTitle}>Start a Workout</Text>
        <Text style={styles.selectionSubtitle}>Choose a routine to begin</Text>
      </View>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.routineOption}
            onPress={() => handleSelectRoutine(item)}
          >
            <View style={styles.routineOptionInfo}>
              <Text style={styles.routineOptionName}>{item.name}</Text>
              <Text style={styles.routineOptionDetails}>
                {item.exercise_count} exercises
              </Text>
            </View>
            <Ionicons name="play-circle" size={40} color="#4A6FA5" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color="#2A2A2A" />
            <Text style={styles.emptyTitle}>No routines available</Text>
            <Text style={styles.emptyText}>
              Create a routine first in the Routines tab
            </Text>
          </View>
        }
      />
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
  selectionHeader: {
    padding: 24,
    alignItems: 'center',
  },
  selectionTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#F5F5F5',
    letterSpacing: 1,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#8A8A8A',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
  },
  routineOption: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routineOptionInfo: {
    flex: 1,
  },
  routineOptionName: {
    fontSize: 17,
    fontWeight: '400',
    color: '#F5F5F5',
    letterSpacing: 0.5,
  },
  routineOptionDetails: {
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
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
  workoutHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#F5F5F5',
    letterSpacing: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#F5F5F5',
    fontVariant: ['tabular-nums'],
  },
  setsList: {
    padding: 16,
    paddingBottom: 100,
  },
  setCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setActive: {
    borderWidth: 1,
    borderColor: '#4A6FA5',
  },
  setCompleted: {
    opacity: 0.5,
  },
  setSkipped: {
    opacity: 0.3,
  },
  setInfo: {
    flex: 1,
  },
  setExercise: {
    fontSize: 16,
    fontWeight: '400',
    color: '#F5F5F5',
  },
  setDetails: {
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 4,
  },
  setBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setBubbleCompleted: {
    backgroundColor: '#4A6FA5',
  },
  setBubbleText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#8A8A8A',
  },
  workoutFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  endButton: {
    backgroundColor: '#ef4444',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
