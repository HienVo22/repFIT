import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { getCalendarData, getDayDetail } from '@/api/calendar';
import { deleteWorkoutSession, getWorkoutSession, saveWorkoutSession } from '@/api/workouts';
import {
  deleteNutritionLog,
  updateNutritionLog,
  createNutritionLogForDate,
  searchFoods,
} from '@/api/nutrition';
import { getRoutine } from '@/api/routines';
import { useRoutines } from '@/hooks/useRoutines';
import { FoodSearchResult, Routine, CompletedSet } from '@/types';
import { showAlert } from '@/utils/alert';

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

interface LogSetEntry {
  exerciseName: string;
  setNumber: number;
  checked: boolean;
  reps: string;
  weight: string;
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [visibleMonth, setVisibleMonth] = useState(currentMonth());

  const [editingMeal, setEditingMeal] = useState<{
    id: number; raw_input: string; calories: string; protein_g: string; carbs_g: string; fat_g: string;
  } | null>(null);

  const [addNutritionVisible, setAddNutritionVisible] = useState(false);
  const [newMealInput, setNewMealInput] = useState('');
  const [newMealCal, setNewMealCal] = useState('');
  const [newMealP, setNewMealP] = useState('');
  const [newMealC, setNewMealC] = useState('');
  const [newMealF, setNewMealF] = useState('');
  const [foodResults, setFoodResults] = useState<FoodSearchResult[]>([]);
  const [foodSearching, setFoodSearching] = useState(false);

  const [logWorkoutVisible, setLogWorkoutVisible] = useState(false);
  const [selectedRoutineForLog, setSelectedRoutineForLog] = useState<Routine | null>(null);
  const [logSets, setLogSets] = useState<LogSetEntry[]>([]);
  const [loadingRoutine, setLoadingRoutine] = useState(false);
  const [savingWorkout, setSavingWorkout] = useState(false);

  const [detailWorkoutId, setDetailWorkoutId] = useState<number | null>(null);

  const { data: calendarDays } = useQuery({
    queryKey: ['calendar', visibleMonth],
    queryFn: () => getCalendarData(visibleMonth),
    staleTime: 60 * 1000,
  });

  const { data: dayDetail, isLoading: dayDetailLoading } = useQuery({
    queryKey: ['calendar-day', selectedDate],
    queryFn: () => getDayDetail(selectedDate),
    enabled: !!selectedDate,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const { data: routinesList } = useRoutines();

  const { data: workoutDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['workout-detail', detailWorkoutId],
    queryFn: () => getWorkoutSession(detailWorkoutId!),
    enabled: detailWorkoutId !== null,
  });

  const groupedExercises = useMemo(() => {
    if (!workoutDetail?.completed_sets) return [];
    const map = new Map<string, CompletedSet[]>();
    for (const s of workoutDetail.completed_sets) {
      if (!map.has(s.exercise_name)) map.set(s.exercise_name, []);
      map.get(s.exercise_name)!.push(s);
    }
    return Array.from(map.entries()).map(([name, sets]) => ({
      name,
      sets: sets.sort((a, b) => a.set_number - b.set_number),
    }));
  }, [workoutDetail]);

  const invalidateDay = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar-day', selectedDate] });
    queryClient.invalidateQueries({ queryKey: ['calendar', visibleMonth] });
  };

  const deleteWorkoutMut = useMutation({
    mutationFn: deleteWorkoutSession,
    onSuccess: invalidateDay,
    onError: () => showAlert('Error', 'Failed to delete workout.'),
  });

  const deleteNutritionMut = useMutation({
    mutationFn: deleteNutritionLog,
    onSuccess: invalidateDay,
    onError: () => showAlert('Error', 'Failed to delete meal.'),
  });

  const updateMealMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateNutritionLog(id, data),
    onSuccess: () => { invalidateDay(); setEditingMeal(null); },
    onError: () => showAlert('Error', 'Failed to update meal.'),
  });

  const addNutritionMut = useMutation({
    mutationFn: (data: any) => createNutritionLogForDate(data),
    onSuccess: () => {
      invalidateDay();
      setAddNutritionVisible(false);
      resetAddForm();
    },
    onError: () => showAlert('Error', 'Failed to log nutrition.'),
  });

  const resetAddForm = () => {
    setNewMealInput('');
    setNewMealCal('');
    setNewMealP('');
    setNewMealC('');
    setNewMealF('');
    setFoodResults([]);
  };

  const handleFoodSearch = async (text: string) => {
    setNewMealInput(text);
    setFoodResults([]);
    if (text.trim().length < 2) { setFoodSearching(false); return; }
    setFoodSearching(true);
    try {
      const result = await searchFoods(text.trim());
      setFoodResults(result.foods);
    } catch { setFoodResults([]); }
    finally { setFoodSearching(false); }
  };

  const handleSelectFood = (food: FoodSearchResult) => {
    setNewMealInput(food.name);
    setNewMealCal(Math.round(food.calories).toString());
    setNewMealP(Math.round(food.protein_g).toString());
    setNewMealC(Math.round(food.carbs_g).toString());
    setNewMealF(Math.round(food.fat_g).toString());
    setFoodResults([]);
  };

  const handleSubmitNutrition = () => {
    if (!newMealInput.trim()) return;
    addNutritionMut.mutate({
      raw_input: newMealInput.trim(),
      calories: parseFloat(newMealCal) || 0,
      protein_g: parseFloat(newMealP) || 0,
      carbs_g: parseFloat(newMealC) || 0,
      fat_g: parseFloat(newMealF) || 0,
      date: selectedDate,
    });
  };

  const handleSaveMealEdit = () => {
    if (!editingMeal) return;
    updateMealMut.mutate({
      id: editingMeal.id,
      data: {
        raw_input: editingMeal.raw_input,
        calories: parseFloat(editingMeal.calories) || 0,
        protein_g: parseFloat(editingMeal.protein_g) || 0,
        carbs_g: parseFloat(editingMeal.carbs_g) || 0,
        fat_g: parseFloat(editingMeal.fat_g) || 0,
      },
    });
  };

  const confirmDeleteWorkout = (id: number, name: string) => {
    showAlert('Delete Workout', `Remove "${name}"?`);
    deleteWorkoutMut.mutate(id);
  };

  const confirmDeleteMeal = (id: number, name: string) => {
    showAlert('Delete Meal', `Removed "${name}"`);
    deleteNutritionMut.mutate(id);
  };

  const handleSelectRoutineForLog = async (routineId: number) => {
    setLoadingRoutine(true);
    try {
      const full = await getRoutine(routineId);
      setSelectedRoutineForLog(full);
      const entries: LogSetEntry[] = full.exercises.flatMap((ex) =>
        Array.from({ length: ex.target_sets }, (_, i) => ({
          exerciseName: ex.exercise_name,
          setNumber: i + 1,
          checked: true,
          reps: String(ex.target_reps),
          weight: ex.target_weight ? String(ex.target_weight) : '0',
        }))
      );
      setLogSets(entries);
    } catch {
      showAlert('Error', 'Failed to load routine');
    } finally {
      setLoadingRoutine(false);
    }
  };

  const toggleLogSet = (index: number) => {
    setLogSets((prev) => prev.map((s, i) => i === index ? { ...s, checked: !s.checked } : s));
  };

  const updateLogSetField = (index: number, field: 'reps' | 'weight', value: string) => {
    setLogSets((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSaveLogWorkout = async () => {
    if (!selectedRoutineForLog) return;
    const checkedSets = logSets.filter((s) => s.checked);
    if (checkedSets.length === 0) return;

    setSavingWorkout(true);
    try {
      const completedSets = checkedSets.map((s) => ({
        exercise_name: s.exerciseName,
        set_number: s.setNumber,
        reps_completed: parseInt(s.reps) || 0,
        weight_used: parseFloat(s.weight) || null,
        is_completed: true,
      }));

      const dateObj = new Date(selectedDate + 'T12:00:00');
      await saveWorkoutSession({
        routine_id: selectedRoutineForLog.id,
        routine_name: selectedRoutineForLog.name,
        started_at: dateObj.toISOString(),
        ended_at: dateObj.toISOString(),
        duration_seconds: 0,
        completed_sets: completedSets,
      });

      invalidateDay();
      setLogWorkoutVisible(false);
      setSelectedRoutineForLog(null);
      setLogSets([]);
    } catch {
      showAlert('Error', 'Failed to log workout');
    } finally {
      setSavingWorkout(false);
    }
  };

  const closeLogWorkout = () => {
    setLogWorkoutVisible(false);
    setSelectedRoutineForLog(null);
    setLogSets([]);
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    if (calendarDays) {
      for (const day of calendarDays) {
        const dots: { color: string }[] = [];
        if (day.has_workout) dots.push({ color: '#4A6FA5' });
        if (day.has_nutrition) dots.push({ color: '#8A8A8A' });
        if (dots.length > 0) marks[day.date] = { marked: true, dots };
      }
    }
    if (selectedDate) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#4A6FA5' };
    }
    return marks;
  }, [calendarDays, selectedDate]);

  const workoutCount = calendarDays?.filter(d => d.has_workout).length ?? 0;
  const totalDays = calendarDays?.length ?? 0;
  const handleDayPress = (day: DateData) => setSelectedDate(day.dateString);
  const handleMonthChange = (month: DateData) =>
    setVisibleMonth(`${month.year}-${String(month.month).padStart(2, '0')}`);

  const todayDate = new Date();
  const greeting = todayDate.getHours() < 12 ? 'Good morning' :
                   todayDate.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const hasWorkouts = dayDetail && dayDetail.workouts.length > 0;
  const hasMeals = dayDetail && dayDetail.nutrition.meals.length > 0;
  const hasAnyData = hasWorkouts || hasMeals;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.userName}>{user?.username || 'Athlete'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{workoutCount}</Text>
          <Text style={styles.statLabel}>Workouts this month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalDays}</Text>
          <Text style={styles.statLabel}>Active days</Text>
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <Calendar
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            backgroundColor: '#1E1E1E',
            calendarBackground: '#1E1E1E',
            textSectionTitleColor: '#8A8A8A',
            selectedDayBackgroundColor: '#4A6FA5',
            selectedDayTextColor: '#F5F5F5',
            todayTextColor: '#4A6FA5',
            dayTextColor: '#F5F5F5',
            textDisabledColor: '#3A3A3A',
            monthTextColor: '#F5F5F5',
            arrowColor: '#4A6FA5',
          }}
          style={styles.calendar}
        />
      </View>

      {selectedDate && (
        <View style={styles.detailContainer}>
          <Text style={styles.sectionTitle}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'short', day: 'numeric',
            })}
          </Text>

          {dayDetailLoading && (
            <ActivityIndicator size="small" color="#4A6FA5" style={{ marginTop: 12 }} />
          )}

          {!dayDetailLoading && !hasAnyData && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No data recorded for this date.</Text>
            </View>
          )}

          {!dayDetailLoading && hasWorkouts && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Workouts</Text>
              {dayDetail!.workouts.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={styles.workoutRow}
                  onPress={() => setDetailWorkoutId(w.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{w.routine_name}</Text>
                    <Text style={styles.workoutMeta}>
                      {formatDuration(w.duration_seconds)} · {w.sets_completed} sets
                    </Text>
                  </View>
                  <View style={styles.rowActions}>
                    {w.started_at && (
                      <Text style={styles.workoutTime}>
                        {new Date(w.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={() => setDetailWorkoutId(w.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="eye-outline" size={16} color="#4A6FA5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDeleteWorkout(w.id, w.routine_name)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#8A8A8A" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!dayDetailLoading && hasMeals && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Nutrition</Text>

              <View style={styles.nutrientSummary}>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{dayDetail!.nutrition.totals.calories}</Text>
                  <Text style={styles.nutrientLabel}>cal</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{dayDetail!.nutrition.totals.protein_g}g</Text>
                  <Text style={styles.nutrientLabel}>protein</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{dayDetail!.nutrition.totals.carbs_g}g</Text>
                  <Text style={styles.nutrientLabel}>carbs</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{dayDetail!.nutrition.totals.fat_g}g</Text>
                  <Text style={styles.nutrientLabel}>fat</Text>
                </View>
              </View>

              <View style={styles.mealDivider} />

              {dayDetail!.nutrition.meals.map((meal) => (
                <View key={meal.id} style={styles.mealRow}>
                  <View style={styles.mealInfo}>
                    {meal.logged_at && (
                      <Text style={styles.mealTime}>
                        {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                    <Text style={styles.mealName}>{meal.raw_input}</Text>
                  </View>
                  <View style={styles.mealMacros}>
                    <Text style={styles.mealCal}>{Math.round(meal.calories)} cal</Text>
                    <Text style={styles.mealMacroText}>
                      {Math.round(meal.protein_g)}P · {Math.round(meal.carbs_g)}C · {Math.round(meal.fat_g)}F
                    </Text>
                  </View>
                  <View style={styles.mealActions}>
                    <TouchableOpacity
                      onPress={() => setEditingMeal({
                        id: meal.id,
                        raw_input: meal.raw_input,
                        calories: String(meal.calories),
                        protein_g: String(meal.protein_g),
                        carbs_g: String(meal.carbs_g),
                        fat_g: String(meal.fat_g),
                      })}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="pencil-outline" size={14} color="#4A6FA5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDeleteMeal(meal.id, meal.raw_input)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={14} color="#8A8A8A" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!dayDetailLoading && (
            <View style={styles.logButtonsRow}>
              <TouchableOpacity
                style={styles.addLogButton}
                onPress={() => setLogWorkoutVisible(true)}
              >
                <Ionicons name="barbell-outline" size={18} color="#4A6FA5" />
                <Text style={styles.addLogText}>Log Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addLogButton}
                onPress={() => { resetAddForm(); setAddNutritionVisible(true); }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#4A6FA5" />
                <Text style={styles.addLogText}>Log Nutrition</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4A6FA5' }]} />
          <Text style={styles.legendText}>Workout</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8A8A8A' }]} />
          <Text style={styles.legendText}>Nutrition</Text>
        </View>
      </View>

      {/* Edit Meal Modal */}
      <Modal visible={!!editingMeal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Meal</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Description"
              placeholderTextColor="#8A8A8A"
              value={editingMeal?.raw_input ?? ''}
              onChangeText={(t) => setEditingMeal((prev) => prev ? { ...prev, raw_input: t } : prev)}
            />
            <View style={styles.modalMacroRow}>
              <View style={styles.modalMacroCol}>
                <Text style={styles.modalMacroLabel}>cal</Text>
                <TextInput
                  style={styles.modalMacroInput}
                  keyboardType="numeric"
                  value={editingMeal?.calories ?? ''}
                  onChangeText={(t) => setEditingMeal((prev) => prev ? { ...prev, calories: t } : prev)}
                />
              </View>
              <View style={styles.modalMacroCol}>
                <Text style={styles.modalMacroLabel}>P</Text>
                <TextInput
                  style={styles.modalMacroInput}
                  keyboardType="numeric"
                  value={editingMeal?.protein_g ?? ''}
                  onChangeText={(t) => setEditingMeal((prev) => prev ? { ...prev, protein_g: t } : prev)}
                />
              </View>
              <View style={styles.modalMacroCol}>
                <Text style={styles.modalMacroLabel}>C</Text>
                <TextInput
                  style={styles.modalMacroInput}
                  keyboardType="numeric"
                  value={editingMeal?.carbs_g ?? ''}
                  onChangeText={(t) => setEditingMeal((prev) => prev ? { ...prev, carbs_g: t } : prev)}
                />
              </View>
              <View style={styles.modalMacroCol}>
                <Text style={styles.modalMacroLabel}>F</Text>
                <TextInput
                  style={styles.modalMacroInput}
                  keyboardType="numeric"
                  value={editingMeal?.fat_g ?? ''}
                  onChangeText={(t) => setEditingMeal((prev) => prev ? { ...prev, fat_g: t } : prev)}
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingMeal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveMealEdit}>
                <Text style={styles.modalSaveText}>
                  {updateMealMut.isPending ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Nutrition Modal */}
      <Modal visible={addNutritionVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Nutrition for {selectedDate}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Search food or describe a meal..."
              placeholderTextColor="#8A8A8A"
              value={newMealInput}
              onChangeText={handleFoodSearch}
            />
            {foodSearching && <ActivityIndicator size="small" color="#4A6FA5" style={{ marginVertical: 4 }} />}
            {foodResults.length > 0 && (
              <ScrollView style={styles.foodDropdown} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {foodResults.slice(0, 5).map((food, i) => (
                  <TouchableOpacity key={`${food.fdc_id}-${i}`} style={styles.foodItem} onPress={() => handleSelectFood(food)}>
                    <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
                    <Text style={styles.foodMeta}>
                      {Math.round(food.calories)} cal · {Math.round(food.protein_g)}P
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <View style={styles.modalMacroRow}>
              <View style={styles.modalMacroCol}>
                <Text style={styles.modalMacroLabel}>cal</Text>
                <TextInput style={styles.modalMacroInput} keyboardType="numeric" value={newMealCal} onChangeText={setNewMealCal} />
              </View>
              <View style={styles.modalMacroCol}>
                <Text style={styles.modalMacroLabel}>P</Text>
                <TextInput style={styles.modalMacroInput} keyboardType="numeric" value={newMealP} onChangeText={setNewMealP} />
              </View>
              <View style={styles.modalMacroCol}>
                <Text style={styles.modalMacroLabel}>C</Text>
                <TextInput style={styles.modalMacroInput} keyboardType="numeric" value={newMealC} onChangeText={setNewMealC} />
              </View>
              <View style={styles.modalMacroCol}>
                <Text style={styles.modalMacroLabel}>F</Text>
                <TextInput style={styles.modalMacroInput} keyboardType="numeric" value={newMealF} onChangeText={setNewMealF} />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddNutritionVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, !newMealInput.trim() && { opacity: 0.4 }]}
                onPress={handleSubmitNutrition}
                disabled={!newMealInput.trim() || addNutritionMut.isPending}
              >
                <Text style={styles.modalSaveText}>
                  {addNutritionMut.isPending ? 'Logging...' : 'Log'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Log Workout Modal */}
      <Modal visible={logWorkoutVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.logWorkoutCard}>
            <View style={styles.lwHeader}>
              <Text style={styles.modalTitle}>
                {selectedRoutineForLog ? selectedRoutineForLog.name : `Log Workout for ${selectedDate}`}
              </Text>
              <TouchableOpacity onPress={closeLogWorkout} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color="#8A8A8A" />
              </TouchableOpacity>
            </View>

            {!selectedRoutineForLog && (
              <>
                {loadingRoutine && (
                  <ActivityIndicator size="small" color="#4A6FA5" style={{ marginVertical: 16 }} />
                )}
                <ScrollView style={styles.lwRoutineList} nestedScrollEnabled>
                  {(routinesList ?? []).map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={styles.lwRoutineItem}
                      onPress={() => handleSelectRoutineForLog(r.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lwRoutineName}>{r.name}</Text>
                        <Text style={styles.lwRoutineDetail}>{r.exercise_count} exercises</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#4A6FA5" />
                    </TouchableOpacity>
                  ))}
                  {(!routinesList || routinesList.length === 0) && !loadingRoutine && (
                    <Text style={styles.lwEmpty}>No routines found. Create one in the Routines tab.</Text>
                  )}
                </ScrollView>
              </>
            )}

            {selectedRoutineForLog && (
              <>
                <TouchableOpacity
                  style={styles.lwBackBtn}
                  onPress={() => { setSelectedRoutineForLog(null); setLogSets([]); }}
                >
                  <Ionicons name="arrow-back" size={18} color="#4A6FA5" />
                  <Text style={styles.lwBackText}>Choose different routine</Text>
                </TouchableOpacity>

                <ScrollView style={styles.lwSetList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {logSets.map((entry, idx) => {
                    const showHeader = idx === 0 || logSets[idx - 1].exerciseName !== entry.exerciseName;
                    return (
                      <View key={idx}>
                        {showHeader && (
                          <Text style={styles.lwExerciseHeader}>{entry.exerciseName}</Text>
                        )}
                        <View style={[styles.lwSetRow, !entry.checked && styles.lwSetUnchecked]}>
                          <TouchableOpacity onPress={() => toggleLogSet(idx)} style={{ marginRight: 10 }}>
                            <Ionicons
                              name={entry.checked ? 'checkbox' : 'square-outline'}
                              size={22}
                              color={entry.checked ? '#4A6FA5' : '#3A3A3A'}
                            />
                          </TouchableOpacity>
                          <Text style={styles.lwSetLabel}>Set {entry.setNumber}</Text>
                          <TextInput
                            style={styles.lwSetInput}
                            value={entry.reps}
                            onChangeText={(t) => updateLogSetField(idx, 'reps', t)}
                            keyboardType="numeric"
                            editable={entry.checked}
                          />
                          <Text style={styles.lwSetUnit}>reps</Text>
                          <TextInput
                            style={styles.lwSetInput}
                            value={entry.weight}
                            onChangeText={(t) => updateLogSetField(idx, 'weight', t)}
                            keyboardType="numeric"
                            editable={entry.checked}
                          />
                          <Text style={styles.lwSetUnit}>lbs</Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={closeLogWorkout}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSaveBtn, savingWorkout && { opacity: 0.5 }]}
                    onPress={handleSaveLogWorkout}
                    disabled={savingWorkout || logSets.filter((s) => s.checked).length === 0}
                  >
                    <Text style={styles.modalSaveText}>
                      {savingWorkout ? 'Saving...' : 'Save Workout'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Workout Detail Popup */}
      <Modal visible={detailWorkoutId !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>
                  {workoutDetail?.routine_name || 'Workout Details'}
                </Text>
                {workoutDetail?.duration_seconds != null && workoutDetail.duration_seconds > 0 && (
                  <Text style={styles.detailDuration}>
                    Duration: {formatDuration(workoutDetail.duration_seconds)}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setDetailWorkoutId(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color="#8A8A8A" />
              </TouchableOpacity>
            </View>

            {loadingDetail ? (
              <ActivityIndicator size="small" color="#4A6FA5" style={{ marginVertical: 24 }} />
            ) : groupedExercises.length === 0 ? (
              <Text style={styles.detailEmpty}>No sets recorded for this workout.</Text>
            ) : (
              <ScrollView style={styles.detailScroll} nestedScrollEnabled>
                {groupedExercises.map((group) => (
                  <View key={group.name} style={styles.detailGroup}>
                    <Text style={styles.detailExerciseName}>{group.name}</Text>
                    {group.sets.map((s) => (
                      <View key={s.id} style={styles.detailSetRow}>
                        <Text style={styles.detailSetNum}>Set {s.set_number}</Text>
                        <Text style={styles.detailSetInfo}>
                          {s.reps_completed} reps
                          {s.weight_used != null && s.weight_used > 0 ? ` @ ${s.weight_used} lbs` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 24, paddingTop: 16 },
  greeting: { fontSize: 14, color: '#8A8A8A', letterSpacing: 1 },
  userName: { fontSize: 28, fontWeight: '300', color: '#F5F5F5', marginTop: 4, letterSpacing: 1 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#1E1E1E', borderRadius: 4, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '300', color: '#4A6FA5', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, color: '#8A8A8A', marginTop: 4, textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' },
  calendarContainer: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '400', color: '#8A8A8A', marginBottom: 12, letterSpacing: 2, textTransform: 'uppercase' },
  calendar: { borderRadius: 4, overflow: 'hidden' },

  detailContainer: { paddingHorizontal: 24, marginBottom: 24 },
  emptyCard: { backgroundColor: '#1E1E1E', borderRadius: 4, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#F5F5F5', marginBottom: 4 },

  sectionCard: { backgroundColor: '#1E1E1E', borderRadius: 4, padding: 16, marginBottom: 12 },
  sectionCardTitle: { fontSize: 11, fontWeight: '500', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },

  workoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  workoutInfo: { flex: 1 },
  workoutName: { fontSize: 15, color: '#F5F5F5', marginBottom: 2 },
  workoutMeta: { fontSize: 12, color: '#8A8A8A' },
  workoutTime: { fontSize: 12, color: '#4A6FA5', fontVariant: ['tabular-nums'], marginRight: 12 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  nutrientSummary: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  nutrientItem: { alignItems: 'center' },
  nutrientValue: { fontSize: 18, fontWeight: '300', color: '#F5F5F5', fontVariant: ['tabular-nums'] },
  nutrientLabel: { fontSize: 10, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  mealDivider: { height: 1, backgroundColor: '#2A2A2A', marginVertical: 12 },
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  mealInfo: { flex: 1 },
  mealTime: { fontSize: 11, color: '#8A8A8A', letterSpacing: 0.5 },
  mealName: { fontSize: 14, color: '#F5F5F5', marginTop: 2 },
  mealMacros: { alignItems: 'flex-end', marginRight: 8 },
  mealCal: { fontSize: 13, color: '#4A6FA5', fontVariant: ['tabular-nums'] },
  mealMacroText: { fontSize: 11, color: '#8A8A8A', fontVariant: ['tabular-nums'], marginTop: 2 },
  mealActions: { flexDirection: 'column', gap: 8, marginLeft: 4 },

  logButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  addLogButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(74,111,165,0.1)', borderRadius: 4, padding: 14,
    borderWidth: 1, borderColor: 'rgba(74,111,165,0.2)',
  },
  addLogText: { fontSize: 14, color: '#4A6FA5', fontWeight: '500' },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingBottom: 32 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: '#8A8A8A', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 17, fontWeight: '400', color: '#F5F5F5', letterSpacing: 0.5, marginBottom: 16 },
  modalInput: { backgroundColor: '#121212', borderRadius: 4, padding: 12, fontSize: 15, color: '#F5F5F5', marginBottom: 12 },
  modalMacroRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modalMacroCol: { flex: 1, alignItems: 'center', gap: 4 },
  modalMacroLabel: { fontSize: 11, color: '#8A8A8A', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalMacroInput: { width: '100%', backgroundColor: '#121212', borderRadius: 4, padding: 10, fontSize: 14, color: '#F5F5F5', textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { fontSize: 15, color: '#8A8A8A' },
  modalSaveBtn: { backgroundColor: '#4A6FA5', borderRadius: 4, paddingVertical: 12, paddingHorizontal: 24 },
  modalSaveText: { fontSize: 15, color: '#F5F5F5', fontWeight: '500' },

  foodDropdown: { maxHeight: 160, backgroundColor: '#2A2A2A', borderRadius: 4, marginBottom: 8 },
  foodItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  foodName: { fontSize: 13, color: '#F5F5F5', marginBottom: 2 },
  foodMeta: { fontSize: 11, color: '#8A8A8A' },

  logWorkoutCard: {
    backgroundColor: '#1E1E1E', borderTopLeftRadius: 12, borderTopRightRadius: 12,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  lwHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  lwRoutineList: { maxHeight: 350 },
  lwRoutineItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#2A2A2A',
  },
  lwRoutineName: { fontSize: 15, color: '#F5F5F5' },
  lwRoutineDetail: { fontSize: 12, color: '#8A8A8A', marginTop: 2 },
  lwEmpty: { fontSize: 14, color: '#8A8A8A', textAlign: 'center', paddingVertical: 24 },
  lwBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  lwBackText: { fontSize: 13, color: '#4A6FA5' },
  lwSetList: { maxHeight: 300 },
  lwExerciseHeader: {
    fontSize: 14, fontWeight: '500', color: '#F5F5F5', marginTop: 12, marginBottom: 6,
    letterSpacing: 0.5,
  },
  lwSetRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#2A2A2A',
  },
  lwSetUnchecked: { opacity: 0.35 },
  lwSetLabel: { fontSize: 13, color: '#8A8A8A', width: 48 },
  lwSetInput: {
    width: 52, backgroundColor: '#121212', borderRadius: 4, padding: 6,
    fontSize: 14, color: '#F5F5F5', textAlign: 'center', marginHorizontal: 4,
  },
  lwSetUnit: { fontSize: 11, color: '#8A8A8A', width: 28 },

  detailModalCard: {
    backgroundColor: '#1E1E1E', borderTopLeftRadius: 12, borderTopRightRadius: 12,
    padding: 24, paddingBottom: 40, maxHeight: '75%',
  },
  detailHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16,
  },
  detailTitle: { fontSize: 18, fontWeight: '400', color: '#F5F5F5', letterSpacing: 0.5 },
  detailDuration: { fontSize: 13, color: '#8A8A8A', marginTop: 4 },
  detailEmpty: { fontSize: 14, color: '#8A8A8A', textAlign: 'center', paddingVertical: 20 },
  detailScroll: { maxHeight: 400 },
  detailGroup: { marginBottom: 16 },
  detailExerciseName: {
    fontSize: 14, fontWeight: '500', color: '#4A6FA5', letterSpacing: 0.5,
    marginBottom: 6, textTransform: 'uppercase',
  },
  detailSetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: '#2A2A2A',
  },
  detailSetNum: { fontSize: 13, color: '#8A8A8A', width: 50 },
  detailSetInfo: { fontSize: 14, color: '#F5F5F5', fontVariant: ['tabular-nums'] },
});
