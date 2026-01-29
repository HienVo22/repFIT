/**
 * Nutrition Screen - Natural language food logging.
 * 
 * 🎓 INTERVIEW CONCEPT: Natural Language Processing (NLP) Integration
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * This screen sends raw text to the backend, which:
 * 1. Parses the text to extract food items
 * 2. Queries USDA API for nutritional data
 * 3. Aggregates and returns macro totals
 * 
 * The frontend is simple - it just sends text and displays results.
 * All the complexity is on the backend (Separation of Concerns).
 */

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NutritionScreen() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock daily totals - replace with API data
  const dailyTotals = {
    calories: 1850,
    protein: 120,
    carbs: 180,
    fat: 65,
    goal: {
      calories: 2200,
      protein: 150,
      carbs: 250,
      fat: 80,
    },
  };
  
  const meals = [
    { id: 1, time: '8:30 AM', description: 'Oatmeal with banana', calories: 350 },
    { id: 2, time: '12:00 PM', description: 'Chicken salad', calories: 550 },
    { id: 3, time: '3:00 PM', description: 'Greek yogurt with berries', calories: 200 },
    { id: 4, time: '7:00 PM', description: 'Salmon with rice', calories: 750 },
  ];
  
  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    // TODO: Send to API
    // const result = await logNutrition({ raw_input: input });
    
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setInput('');
  };
  
  const MacroProgress = ({ 
    label, 
    current, 
    goal, 
    color 
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
            {current}<Text style={styles.macroUnit}>/{goal}g</Text>
          </Text>
        </View>
        <View style={styles.macroBarBg}>
          <View 
            style={[
              styles.macroBarFill, 
              { width: `${percentage}%`, backgroundColor: color }
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
        {/* Daily Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Nutrition</Text>
          
          {/* Calories Circle */}
          <View style={styles.caloriesContainer}>
            <View style={styles.caloriesCircle}>
              <Text style={styles.caloriesValue}>{dailyTotals.calories}</Text>
              <Text style={styles.caloriesLabel}>
                / {dailyTotals.goal.calories} kcal
              </Text>
            </View>
          </View>
          
          {/* Macros Progress */}
          <View style={styles.macrosContainer}>
            <MacroProgress 
              label="Protein" 
              current={dailyTotals.protein} 
              goal={dailyTotals.goal.protein}
              color="#ef4444"
            />
            <MacroProgress 
              label="Carbs" 
              current={dailyTotals.carbs} 
              goal={dailyTotals.goal.carbs}
              color="#3b82f6"
            />
            <MacroProgress 
              label="Fat" 
              current={dailyTotals.fat} 
              goal={dailyTotals.goal.fat}
              color="#f59e0b"
            />
          </View>
        </View>
        
        {/* Meals List */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          
          {meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealTime}>{meal.time}</Text>
                <Text style={styles.mealDescription}>{meal.description}</Text>
              </View>
              <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What did you eat? (e.g., 2 eggs and toast)"
          placeholderTextColor="#666"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={200}
        />
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || !input.trim()}
        >
          <Ionicons 
            name={isLoading ? "hourglass" : "add-circle"} 
            size={32} 
            color={input.trim() ? "#6366f1" : "#444"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#252542',
    borderRadius: 20,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  caloriesContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  caloriesCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#888',
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
    fontSize: 14,
    color: '#888',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  macroUnit: {
    color: '#888',
    fontWeight: 'normal',
  },
  macroBarBg: {
    height: 8,
    backgroundColor: '#3d3d5c',
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  mealsSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: '#252542',
    borderRadius: 12,
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
    fontSize: 12,
    color: '#888',
  },
  mealDescription: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#252542',
    borderTopWidth: 1,
    borderTopColor: '#3d3d5c',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    minHeight: 48,
    maxHeight: 100,
  },
  submitButton: {
    padding: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});
