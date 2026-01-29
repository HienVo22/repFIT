/**
 * Record Screen - Start a workout session.
 * 
 * 🎓 INTERVIEW CONCEPT: State-Driven UI
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * This screen has two states:
 * 1. Selection mode: Choose which routine to start
 * 2. Active workout: Show sets to complete with timer
 * 
 * The UI completely changes based on workout state.
 * This is a common pattern - conditionally render
 * entirely different components based on state.
 */

import { useEffect, useState } from 'react';
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
import { Routine, RoutineListItem } from '@/types';
import { getRoutine } from '@/api/routines';

// Format seconds as MM:SS
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
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(tick, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, tick]);
  
  const handleSelectRoutine = async (item: RoutineListItem) => {
    try {
      // Fetch full routine with exercises
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
          onPress: () => {
            const result = endWorkout();
            Alert.alert(
              'Workout Complete! 🎉',
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
        {/* Header with timer */}
        <View style={styles.workoutHeader}>
          <Text style={styles.workoutTitle}>{routine.name}</Text>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={24} color="#6366f1" />
            <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
          </View>
        </View>
        
        {/* Sets list */}
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
                    Set {item.setNumber} • {item.targetReps} reps
                    {item.targetWeight ? ` @ ${item.targetWeight}kg` : ''}
                  </Text>
                </View>
                
                <View style={[
                  styles.setBubble,
                  item.status === 'completed' && styles.setBubbleCompleted,
                ]}>
                  {item.status === 'completed' ? (
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  ) : (
                    <Text style={styles.setBubbleText}>{item.setNumber}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
        
        {/* End workout button */}
        <View style={styles.workoutFooter}>
          <TouchableOpacity 
            style={styles.endButton}
            onPress={handleEndWorkout}
          >
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
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.selectionHeader}>
        <Text style={styles.selectionTitle}>Start a Workout</Text>
        <Text style={styles.selectionSubtitle}>
          Choose a routine to begin
        </Text>
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
            <Ionicons name="play-circle" size={40} color="#6366f1" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color="#444" />
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
    backgroundColor: '#1a1a2e',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  // Selection view styles
  selectionHeader: {
    padding: 24,
    alignItems: 'center',
  },
  selectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectionSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  routineOption: {
    backgroundColor: '#252542',
    borderRadius: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  routineOptionDetails: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  // Active workout styles
  workoutHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#252542',
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#252542',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  setsList: {
    padding: 16,
    paddingBottom: 100,
  },
  setCard: {
    backgroundColor: '#252542',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setActive: {
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  setCompleted: {
    opacity: 0.6,
  },
  setSkipped: {
    opacity: 0.4,
  },
  setInfo: {
    flex: 1,
  },
  setExercise: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  setDetails: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  setBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3d3d5c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setBubbleCompleted: {
    backgroundColor: '#22c55e',
  },
  setBubbleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
  },
  workoutFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#252542',
  },
  endButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
