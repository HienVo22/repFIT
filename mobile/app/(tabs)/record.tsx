import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoutines } from '@/hooks/useRoutines';
import { useWorkoutStore } from '@/store/workoutStore';
import { RoutineListItem } from '@/types';
import { getRoutine } from '@/api/routines';
import { saveWorkoutSession, getWorkoutSummary } from '@/api/workouts';
import { showAlert } from '@/utils/alert';

const PICKER_ITEM_HEIGHT = 48;
const PICKER_VISIBLE_COUNT = 5;
const PICKER_HEIGHT = PICKER_ITEM_HEIGHT * PICKER_VISIBLE_COUNT;
const REPS_VALUES = Array.from({ length: 101 }, (_, i) => i);
const WEIGHT_VALUES = Array.from({ length: 101 }, (_, i) => i * 5);

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatStopwatch = (ms: number): string => {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
};

interface WheelPickerProps {
  values: number[];
  initialValue: number;
  onValueChange: (value: number) => void;
  label: string;
}

function WheelPicker({ values, initialValue, onValueChange, label }: WheelPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const padding = Math.floor(PICKER_VISIBLE_COUNT / 2);

  useEffect(() => {
    let idx = values.indexOf(initialValue);
    if (idx < 0) {
      idx = values.reduce((best, v, i) =>
        Math.abs(v - initialValue) < Math.abs(values[best] - initialValue) ? i : best, 0);
    }
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_HEIGHT, animated: false });
    }, 50);
  }, [initialValue, values]);

  const handleScrollEnd = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / PICKER_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    onValueChange(values[clamped]);
  }, [values, onValueChange]);

  return (
    <View style={wheelStyles.container}>
      <Text style={wheelStyles.label}>{label}</Text>
      <View style={wheelStyles.track}>
        <View style={[wheelStyles.band, { top: padding * PICKER_ITEM_HEIGHT }]} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={PICKER_ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          contentContainerStyle={{
            paddingTop: padding * PICKER_ITEM_HEIGHT,
            paddingBottom: padding * PICKER_ITEM_HEIGHT,
          }}
        >
          {values.map((v, i) => (
            <View key={i} style={wheelStyles.item}>
              <Text style={wheelStyles.itemText}>{v}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1 },
  label: { fontSize: 12, color: '#8A8A8A', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  track: { height: PICKER_HEIGHT, overflow: 'hidden', width: 100, position: 'relative' },
  band: {
    position: 'absolute', left: 4, right: 4, height: PICKER_ITEM_HEIGHT,
    backgroundColor: 'rgba(74,111,165,0.15)', borderRadius: 8, zIndex: 1,
  },
  item: { height: PICKER_ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 24, fontWeight: '300', color: '#F5F5F5', fontVariant: ['tabular-nums'] },
});

interface WorkoutResult {
  duration: number;
  completedSets: any[];
  routineName: string;
}

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

  const [workoutResult, setWorkoutResult] = useState<WorkoutResult | null>(null);
  const [aiSummary, setAiSummary] = useState<{ summary: string; tips: string[] } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalSetIndex, setModalSetIndex] = useState<number | null>(null);
  const [restMs, setRestMs] = useState(0);
  const restStartRef = useRef<number>(0);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedReps, setSelectedReps] = useState(0);
  const [selectedWeight, setSelectedWeight] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive) {
      interval = setInterval(tick, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, tick]);

  useEffect(() => {
    if (modalVisible) {
      restStartRef.current = Date.now();
      setRestMs(0);
      restIntervalRef.current = setInterval(() => {
        setRestMs(Date.now() - restStartRef.current);
      }, 10);
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      setRestMs(0);
    }
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    };
  }, [modalVisible]);

  const handleTapSet = useCallback((index: number) => {
    const current = sets[index];
    setSelectedReps(current.targetReps);

    const prevForExercise = sets
      .slice(0, index)
      .filter((s) => s.exerciseIndex === current.exerciseIndex && s.status === 'completed')
      .pop();

    const defaultWeight = prevForExercise
      ? (prevForExercise.actualWeight ?? prevForExercise.targetWeight ?? 0)
      : (current.targetWeight ?? 0);
    setSelectedWeight(Math.round(defaultWeight / 5) * 5);

    setModalSetIndex(index);
    setModalVisible(true);
  }, [sets]);

  const handleResume = useCallback(() => {
    if (modalSetIndex !== null) {
      completeSet(modalSetIndex, selectedReps, selectedWeight);
    }
    setModalVisible(false);
    setModalSetIndex(null);
  }, [modalSetIndex, selectedReps, selectedWeight, completeSet]);

  const handleSelectRoutine = async (item: RoutineListItem) => {
    try {
      const fullRoutine = await getRoutine(item.id);
      startWorkout(fullRoutine);
      setWorkoutResult(null);
      setAiSummary(null);
    } catch {
      showAlert('Error', 'Failed to load routine');
    }
  };

  const handleEndWorkout = () => {
    setModalVisible(false);
    setModalSetIndex(null);

    const result = endWorkout();

    const completedSets = result.completedSets.map((s: any) => ({
      exercise_name: result.routine!.exercises[s.exerciseIndex].exercise_name,
      set_number: s.setNumber,
      reps_completed: s.actualReps ?? s.targetReps,
      weight_used: s.actualWeight ?? s.targetWeight,
      is_completed: true,
    }));

    setWorkoutResult({
      duration: result.duration,
      completedSets,
      routineName: result.routine?.name || 'Workout',
    });

    if (result.routine && result.startTime) {
      saveWorkoutSession({
        routine_id: result.routine.id,
        routine_name: result.routine.name,
        started_at: result.startTime.toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: result.duration,
        completed_sets: completedSets,
      }).catch(() => {});
    }

    setLoadingSummary(true);
    getWorkoutSummary({
      routine_name: result.routine?.name || 'Workout',
      duration_seconds: result.duration,
      completed_sets: completedSets,
    })
      .then(setAiSummary)
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
  };

  if (workoutResult) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.summaryContent}>
        <View style={styles.completeBanner}>
          <Ionicons name="checkmark-circle" size={64} color="#4A6FA5" />
          <Text style={styles.completeTitle}>Workout Complete</Text>
          <Text style={styles.completeRoutineName}>{workoutResult.routineName}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(workoutResult.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{workoutResult.completedSets.length}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
        </View>

        {loadingSummary && (
          <View style={styles.aiLoadingCard}>
            <ActivityIndicator size="small" color="#4A6FA5" />
            <Text style={styles.aiLoadingText}>Generating AI summary...</Text>
          </View>
        )}

        {aiSummary && (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={18} color="#4A6FA5" />
              <Text style={styles.aiHeaderText}>Coach's Analysis</Text>
            </View>
            <Text style={styles.aiSummaryText}>{aiSummary.summary}</Text>
            {aiSummary.tips.length > 0 && (
              <View style={styles.aiTipsContainer}>
                {aiSummary.tips.map((tip, i) => (
                  <View key={i} style={styles.aiTipRow}>
                    <Text style={styles.aiTipBullet}>{i + 1}</Text>
                    <Text style={styles.aiTipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.newWorkoutButton}
          onPress={() => setWorkoutResult(null)}
        >
          <Text style={styles.newWorkoutText}>Start New Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

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
            const done = item.status === 'completed';

            return (
              <TouchableOpacity
                style={[
                  styles.setCard,
                  done && styles.setCompleted,
                  item.status === 'skipped' && styles.setSkipped,
                  isCurrentSet && styles.setActive,
                ]}
                onPress={() => {
                  if (item.status === 'pending') handleTapSet(index);
                }}
                disabled={item.status !== 'pending'}
              >
                <View style={styles.setInfo}>
                  <Text style={styles.setExercise}>{exercise.exercise_name}</Text>
                  <Text style={styles.setDetails}>
                    {done
                      ? `Set ${item.setNumber} · ${item.actualReps ?? item.targetReps} reps${(item.actualWeight != null && item.actualWeight > 0) ? ` @ ${item.actualWeight} lbs` : ''}`
                      : `Set ${item.setNumber} · ${item.targetReps} reps${item.targetWeight ? ` @ ${item.targetWeight} lbs` : ''}`}
                  </Text>
                </View>

                <View style={[styles.setBubble, done && styles.setBubbleCompleted]}>
                  {done ? (
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

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.restOverlay}>
            {modalVisible && modalSetIndex !== null && (
              <View style={styles.combinedModal}>
                <Text style={styles.modalExercise}>
                  {routine.exercises[sets[modalSetIndex].exerciseIndex].exercise_name}
                </Text>
                <Text style={styles.modalSetLabel}>Set {sets[modalSetIndex].setNumber}</Text>

                <View style={styles.stopwatchRing}>
                  <Text style={styles.stopwatchText}>{formatStopwatch(restMs)}</Text>
                </View>

                <View style={styles.pickersRow}>
                  <WheelPicker
                    key={`r-${modalSetIndex}`}
                    values={REPS_VALUES}
                    initialValue={selectedReps}
                    onValueChange={setSelectedReps}
                    label="reps"
                  />
                  <WheelPicker
                    key={`w-${modalSetIndex}`}
                    values={WEIGHT_VALUES}
                    initialValue={selectedWeight}
                    onValueChange={setSelectedWeight}
                    label="lbs"
                  />
                </View>

                <TouchableOpacity style={styles.resumeCircle} onPress={handleResume}>
                  <Text style={styles.resumeCircleText}>Resume</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
      </View>
    );
  }

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
  container: { flex: 1, backgroundColor: '#121212' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },

  selectionHeader: { padding: 24, alignItems: 'center' },
  selectionTitle: { fontSize: 28, fontWeight: '300', color: '#F5F5F5', letterSpacing: 1 },
  selectionSubtitle: { fontSize: 14, color: '#8A8A8A', marginTop: 8, letterSpacing: 0.5 },
  listContent: { padding: 16 },
  routineOption: {
    backgroundColor: '#1E1E1E', borderRadius: 4, padding: 20, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  routineOptionInfo: { flex: 1 },
  routineOptionName: { fontSize: 17, fontWeight: '400', color: '#F5F5F5', letterSpacing: 0.5 },
  routineOptionDetails: { fontSize: 13, color: '#8A8A8A', marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '300', color: '#F5F5F5', marginTop: 16, letterSpacing: 1 },
  emptyText: { fontSize: 14, color: '#8A8A8A', marginTop: 8, textAlign: 'center' },

  workoutHeader: {
    padding: 24, borderBottomWidth: 1, borderBottomColor: '#2A2A2A', alignItems: 'center',
  },
  workoutTitle: { fontSize: 24, fontWeight: '300', color: '#F5F5F5', letterSpacing: 1 },
  timerContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4,
  },
  timerText: { fontSize: 24, fontWeight: '300', color: '#F5F5F5', fontVariant: ['tabular-nums'] },
  setsList: { padding: 16, paddingBottom: 100 },
  setCard: {
    backgroundColor: '#1E1E1E', borderRadius: 4, padding: 16, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  setActive: { borderWidth: 1, borderColor: '#4A6FA5' },
  setCompleted: { opacity: 0.5 },
  setSkipped: { opacity: 0.3 },
  setInfo: { flex: 1 },
  setExercise: { fontSize: 16, fontWeight: '400', color: '#F5F5F5' },
  setDetails: { fontSize: 13, color: '#8A8A8A', marginTop: 4 },
  setBubble: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#2A2A2A',
    justifyContent: 'center', alignItems: 'center',
  },
  setBubbleCompleted: { backgroundColor: '#4A6FA5' },
  setBubbleText: { fontSize: 18, fontWeight: '400', color: '#8A8A8A' },
  workoutFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16,
    backgroundColor: '#121212', borderTopWidth: 1, borderTopColor: '#2A2A2A',
  },
  endButton: { backgroundColor: '#ef4444', borderRadius: 4, padding: 16, alignItems: 'center' },
  endButtonText: { color: '#F5F5F5', fontSize: 16, fontWeight: '500', letterSpacing: 0.5 },

  restOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  combinedModal: {
    backgroundColor: '#1E1E1E', borderRadius: 16, paddingVertical: 28, paddingHorizontal: 24,
    alignItems: 'center', width: 310, borderWidth: 1, borderColor: '#2A2A2A',
  },
  modalExercise: {
    fontSize: 16, fontWeight: '400', color: '#F5F5F5', letterSpacing: 0.5, textAlign: 'center',
  },
  modalSetLabel: {
    fontSize: 13, color: '#8A8A8A', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase',
  },
  stopwatchRing: {
    width: 180, height: 180, borderRadius: 90, borderWidth: 3, borderColor: '#4A6FA5',
    justifyContent: 'center', alignItems: 'center', marginVertical: 20,
  },
  stopwatchText: {
    fontSize: 32, fontWeight: '200', color: '#F5F5F5', fontVariant: ['tabular-nums'], letterSpacing: 1,
  },
  pickersRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  resumeCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#4A6FA5',
    justifyContent: 'center', alignItems: 'center',
  },
  resumeCircleText: { color: '#F5F5F5', fontSize: 14, fontWeight: '500', letterSpacing: 0.5 },

  summaryContent: { padding: 24, paddingBottom: 60 },
  completeBanner: { alignItems: 'center', marginBottom: 32 },
  completeTitle: {
    fontSize: 28, fontWeight: '300', color: '#F5F5F5', letterSpacing: 1, marginTop: 16,
  },
  completeRoutineName: { fontSize: 15, color: '#8A8A8A', marginTop: 8, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#1E1E1E', borderRadius: 4, padding: 20, alignItems: 'center',
  },
  statValue: {
    fontSize: 28, fontWeight: '300', color: '#F5F5F5', fontVariant: ['tabular-nums'], marginBottom: 4,
  },
  statLabel: { fontSize: 13, color: '#8A8A8A', letterSpacing: 1, textTransform: 'uppercase' },
  aiLoadingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1E1E1E', borderRadius: 4, padding: 16, marginBottom: 20,
  },
  aiLoadingText: { fontSize: 14, color: '#8A8A8A' },
  aiCard: {
    backgroundColor: '#1E1E1E', borderRadius: 4, padding: 20, marginBottom: 20,
    borderLeftWidth: 3, borderLeftColor: '#4A6FA5',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiHeaderText: { fontSize: 15, fontWeight: '500', color: '#4A6FA5', letterSpacing: 0.5 },
  aiSummaryText: { fontSize: 14, color: '#F5F5F5', lineHeight: 22, marginBottom: 16 },
  aiTipsContainer: { gap: 10 },
  aiTipRow: { flexDirection: 'row', gap: 10 },
  aiTipBullet: {
    fontSize: 13, color: '#4A6FA5', fontWeight: '600', width: 16, fontVariant: ['tabular-nums'],
  },
  aiTipText: { flex: 1, fontSize: 14, color: '#F5F5F5', lineHeight: 20 },
  newWorkoutButton: {
    backgroundColor: '#4A6FA5', borderRadius: 4, padding: 16, alignItems: 'center', marginTop: 8,
  },
  newWorkoutText: { color: '#F5F5F5', fontSize: 16, fontWeight: '500', letterSpacing: 0.5 },
});
