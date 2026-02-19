import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNutritionByDate, createNutritionLog } from '@/api/nutrition';
import { NutritionLog } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const todayStr = () => new Date().toISOString().split('T')[0];

export default function NutritionScreen() {
  const [input, setInput] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
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
      setInput('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to log nutrition entry.');
    },
  });

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
      <ScrollView style={styles.scrollView}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Nutrition</Text>

          <View style={styles.caloriesContainer}>
            <View style={styles.caloriesCircle}>
              <Text style={styles.caloriesValue}>{Math.round(totalCalories)}</Text>
              <Text style={styles.caloriesLabel}>/ {goalCalories} kcal</Text>
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
                <Text style={styles.mealCalories}>{Math.round(meal.calories)} kcal</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What did you eat?"
          placeholderTextColor="#8A8A8A"
          value={input}
          onChangeText={setInput}
          maxLength={200}
        />
        <View style={styles.macroInputRow}>
          <TextInput style={styles.macroInput} placeholder="kcal" placeholderTextColor="#8A8A8A" value={calories} onChangeText={setCalories} keyboardType="numeric" />
          <TextInput style={styles.macroInput} placeholder="P (g)" placeholderTextColor="#8A8A8A" value={protein} onChangeText={setProtein} keyboardType="numeric" />
          <TextInput style={styles.macroInput} placeholder="C (g)" placeholderTextColor="#8A8A8A" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
          <TextInput style={styles.macroInput} placeholder="F (g)" placeholderTextColor="#8A8A8A" value={fat} onChangeText={setFat} keyboardType="numeric" />
        </View>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
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
  caloriesContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
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
  caloriesLabel: {
    fontSize: 12,
    color: '#8A8A8A',
  },
  macrosContainer: {
    gap: 12,
  },
  macroItem: {
    gap: 6,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
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
  macroUnit: {
    color: '#8A8A8A',
    fontWeight: 'normal',
  },
  macroBarBg: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  mealsSection: {
    padding: 16,
    paddingTop: 0,
  },
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
  emptyText: {
    fontSize: 14,
    color: '#8A8A8A',
  },
  mealCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealInfo: {
    flex: 1,
  },
  mealTime: {
    fontSize: 11,
    color: '#8A8A8A',
    letterSpacing: 0.5,
  },
  mealDescription: {
    fontSize: 15,
    color: '#F5F5F5',
    marginTop: 4,
  },
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
  input: {
    backgroundColor: '#121212',
    borderRadius: 4,
    padding: 12,
    fontSize: 15,
    color: '#F5F5F5',
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroInput: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    color: '#F5F5F5',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#4A6FA5',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
