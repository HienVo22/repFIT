import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getNutritionByDate,
  createNutritionLog,
  searchFoods,
  deleteNutritionLog,
} from '@/api/nutrition';
import { NutritionLog, FoodSearchResult } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showAlert } from '@/utils/alert';

const todayStr = () => new Date().toISOString().split('T')[0];

export default function NutritionScreen() {
  const [input, setInput] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showManualFields, setShowManualFields] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ['nutrition', todayStr()],
    queryFn: () => getNutritionByDate(todayStr()),
    staleTime: 30 * 1000,
  });

  const logMutation = useMutation({
    mutationFn: createNutritionLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', todayStr()] });
      resetForm();
    },
    onError: () => showAlert('Error', 'Failed to log nutrition entry.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNutritionLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', todayStr()] });
    },
  });

  const resetForm = () => {
    setInput('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setSearchResults([]);
    setShowManualFields(false);
  };

  const handleInputChange = useCallback((text: string) => {
    setInput(text);
    setSearchResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await searchFoods(text.trim());
        setSearchResults(result.foods);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, []);

  const handleSelectFood = (food: FoodSearchResult) => {
    setInput(food.name);
    setCalories(Math.round(food.calories).toString());
    setProtein(Math.round(food.protein_g).toString());
    setCarbs(Math.round(food.carbs_g).toString());
    setFat(Math.round(food.fat_g).toString());
    setSearchResults([]);
    setShowManualFields(true);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;

    logMutation.mutate({
      raw_input: input.trim(),
      calories: parseFloat(calories) || 0,
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fat_g: parseFloat(fat) || 0,
    });
  };

  const totalCalories = summary?.total_calories ?? 0;
  const totalProtein = summary?.total_protein_g ?? 0;
  const totalCarbs = summary?.total_carbs_g ?? 0;
  const totalFat = summary?.total_fat_g ?? 0;
  const logs: NutritionLog[] = summary?.logs ?? [];

  const goalCalories = 2200;
  const goalProtein = 150;
  const goalCarbs = 250;
  const goalFat = 80;

  const MacroProgress = ({
    label,
    current,
    goal,
    color,
  }: {
    label: string;
    current: number;
    goal: number;
    color: string;
  }) => {
    const percentage = Math.min((current / goal) * 100, 100);
    return (
      <View style={styles.macroItem}>
        <View style={styles.macroHeader}>
          <Text style={styles.macroLabel}>{label}</Text>
          <Text style={styles.macroValue}>
            {Math.round(current)}<Text style={styles.macroUnit}>/{goal}g</Text>
          </Text>
        </View>
        <View style={styles.macroBarBg}>
          <View
            style={[
              styles.macroBarFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Nutrition</Text>

          <View style={styles.caloriesContainer}>
            <View style={styles.caloriesCircle}>
              <Text style={styles.caloriesValue}>{Math.round(totalCalories)}</Text>
              <Text style={styles.caloriesLabel}>/ {goalCalories} cal</Text>
            </View>
          </View>

          <View style={styles.macrosContainer}>
            <MacroProgress label="Protein" current={totalProtein} goal={goalProtein} color="#4A6FA5" />
            <MacroProgress label="Carbs" current={totalCarbs} goal={goalCarbs} color="#8A8A8A" />
            <MacroProgress label="Fat" current={totalFat} goal={goalFat} color="#F5F5F5" />
          </View>
        </View>

        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>

          {logs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No meals logged yet</Text>
            </View>
          ) : (
            logs.map((meal) => (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealTime}>
                    {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.mealDescription}>{meal.raw_input}</Text>
                </View>
                <View style={styles.mealRight}>
                  <Text style={styles.mealCalories}>{Math.round(meal.calories)} cal</Text>
                  <TouchableOpacity
                    onPress={() => deleteMutation.mutate(meal.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#8A8A8A" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Search food or describe a meal..."
            placeholderTextColor="#8A8A8A"
            value={input}
            onChangeText={handleInputChange}
            maxLength={200}
          />
          {searching && (
            <ActivityIndicator size="small" color="#4A6FA5" style={styles.searchSpinner} />
          )}
        </View>

        {searchResults.length > 0 && (
          <ScrollView style={styles.searchDropdown} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {searchResults.map((food, idx) => (
              <TouchableOpacity
                key={`${food.fdc_id}-${idx}`}
                style={styles.searchItem}
                onPress={() => handleSelectFood(food)}
              >
                <Text style={styles.searchItemName} numberOfLines={1}>{food.name}</Text>
                <Text style={styles.searchItemMacros}>
                  {Math.round(food.calories)} cal · {Math.round(food.protein_g)}p · {Math.round(food.carbs_g)}c · {Math.round(food.fat_g)}f
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {(showManualFields || (calories || protein || carbs || fat)) && (
          <View style={styles.macroInputRow}>
            <TextInput style={styles.macroInput} placeholder="cal" placeholderTextColor="#8A8A8A" value={calories} onChangeText={setCalories} keyboardType="numeric" />
            <TextInput style={styles.macroInput} placeholder="P (g)" placeholderTextColor="#8A8A8A" value={protein} onChangeText={setProtein} keyboardType="numeric" />
            <TextInput style={styles.macroInput} placeholder="C (g)" placeholderTextColor="#8A8A8A" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
            <TextInput style={styles.macroInput} placeholder="F (g)" placeholderTextColor="#8A8A8A" value={fat} onChangeText={setFat} keyboardType="numeric" />
          </View>
        )}

        <View style={styles.actionRow}>
          {!showManualFields && !calories && (
            <TouchableOpacity
              style={styles.manualToggle}
              onPress={() => setShowManualFields(true)}
            >
              <Text style={styles.manualToggleText}>Enter manually</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.submitButton, (!input.trim() || logMutation.isPending) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!input.trim() || logMutation.isPending}
          >
            <Text style={styles.submitButtonText}>
              {logMutation.isPending ? 'Logging...' : 'Log'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollView: { flex: 1 },
  summaryCard: {
    margin: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  caloriesContainer: { alignItems: 'center', marginBottom: 24 },
  caloriesCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#4A6FA5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: '300',
    color: '#F5F5F5',
    fontVariant: ['tabular-nums'],
  },
  caloriesLabel: { fontSize: 12, color: '#8A8A8A' },
  macrosContainer: { gap: 12 },
  macroItem: { gap: 6 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: {
    fontSize: 13,
    color: '#8A8A8A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#F5F5F5',
    fontVariant: ['tabular-nums'],
  },
  macroUnit: { color: '#8A8A8A', fontWeight: 'normal' },
  macroBarBg: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroBarFill: { height: '100%', borderRadius: 2 },
  mealsSection: { padding: 16, paddingTop: 0 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8A8A8A',
    marginBottom: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  emptyCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: '#8A8A8A' },
  mealCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealInfo: { flex: 1 },
  mealTime: { fontSize: 11, color: '#8A8A8A', letterSpacing: 0.5 },
  mealDescription: { fontSize: 15, color: '#F5F5F5', marginTop: 4 },
  mealRight: { alignItems: 'flex-end', gap: 6 },
  mealCalories: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4A6FA5',
    fontVariant: ['tabular-nums'],
  },

  inputContainer: {
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    gap: 8,
  },
  searchRow: { position: 'relative' },
  input: {
    backgroundColor: '#121212',
    borderRadius: 4,
    padding: 12,
    paddingRight: 40,
    fontSize: 15,
    color: '#F5F5F5',
  },
  searchSpinner: { position: 'absolute', right: 12, top: 14 },
  searchDropdown: {
    maxHeight: 200,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
  },
  searchItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  searchItemName: { fontSize: 14, color: '#F5F5F5', marginBottom: 2 },
  searchItemMacros: { fontSize: 12, color: '#8A8A8A' },
  macroInputRow: { flexDirection: 'row', gap: 8 },
  macroInput: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    color: '#F5F5F5',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  manualToggle: { paddingVertical: 8, paddingHorizontal: 4 },
  manualToggleText: { fontSize: 13, color: '#4A6FA5' },
  submitButton: {
    backgroundColor: '#4A6FA5',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: {
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
