import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePreferencesStore } from '@/store/preferencesStore';
import { showAlert } from '@/utils/alert';

type WizardStep = 'goal' | 'stats' | 'activity' | 'results';

type FitnessGoal = 'lean_muscle' | 'bulk' | 'cut';

const GOALS: { key: FitnessGoal; label: string; desc: string }[] = [
  { key: 'lean_muscle', label: 'Build Lean Muscle', desc: 'Moderate calorie surplus focused on lean gains with high protein.' },
  { key: 'bulk', label: 'Get Bigger / Bulk', desc: 'Aggressive calorie surplus to maximize muscle and strength gains.' },
  { key: 'cut', label: 'Get Lean / Cut', desc: 'Calorie deficit to reduce body fat while preserving muscle mass.' },
];

const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise', multiplier: 1.2 },
  { key: 'light', label: 'Lightly Active', desc: '1-3 days/week', multiplier: 1.375 },
  { key: 'moderate', label: 'Moderately Active', desc: '3-5 days/week', multiplier: 1.55 },
  { key: 'active', label: 'Very Active', desc: '6-7 days/week', multiplier: 1.725 },
  { key: 'extreme', label: 'Extremely Active', desc: 'Athlete / physical job', multiplier: 1.9 },
];

export default function NutritionGoalsScreen() {
  const existingStats = usePreferencesStore((s) => s.bodyStats);
  const setNutritionGoals = usePreferencesStore((s) => s.setNutritionGoals);
  const setBodyStats = usePreferencesStore((s) => s.setBodyStats);

  const [step, setStep] = useState<WizardStep>('goal');
  const [goal, setGoal] = useState<FitnessGoal | null>(null);

  const [sex, setSex] = useState<'male' | 'female'>(existingStats?.sex ?? 'male');
  const [age, setAge] = useState(existingStats?.age ? String(existingStats.age) : '');
  const [weight, setWeight] = useState(
    existingStats?.weight_kg ? String(Math.round(existingStats.weight_kg * 2.20462)) : ''
  );
  const [height, setHeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [heightUnit, setHeightUnit] = useState<'ftin' | 'cm'>('ftin');
  const [heightFt, setHeightFt] = useState(
    existingStats?.height_cm ? String(Math.floor(existingStats.height_cm / 30.48)) : ''
  );
  const [heightIn, setHeightIn] = useState(
    existingStats?.height_cm
      ? String(Math.round((existingStats.height_cm % 30.48) / 2.54))
      : ''
  );

  const savedActivity = existingStats?.activityLevel
    ? ACTIVITY_LEVELS.find((a) => a.key === existingStats.activityLevel)
    : null;
  const [activityLevel, setActivityLevel] = useState(existingStats?.activityLevel ?? '');
  const [activityMultiplier, setActivityMultiplier] = useState(savedActivity?.multiplier ?? 1.55);

  const weightKg = weightUnit === 'kg' ? parseFloat(weight) || 0 : (parseFloat(weight) || 0) * 0.453592;
  const heightCm = heightUnit === 'cm'
    ? parseFloat(height) || 0
    : ((parseFloat(heightFt) || 0) * 30.48 + (parseFloat(heightIn) || 0) * 2.54);
  const ageNum = parseInt(age) || 0;

  const bmr = sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;

  const tdee = bmr * activityMultiplier;

  const goalConfig: Record<FitnessGoal, { calAdjust: number; proteinPerKg: number }> = {
    lean_muscle: { calAdjust: 250, proteinPerKg: 2.0 },
    bulk: { calAdjust: 500, proteinPerKg: 1.8 },
    cut: { calAdjust: -500, proteinPerKg: 2.2 },
  };

  const cfg = goal ? goalConfig[goal] : goalConfig.lean_muscle;
  const adjustedCalories = Math.round(tdee + cfg.calAdjust);
  const proteinG = Math.round(cfg.proteinPerKg * weightKg);
  const fatG = Math.round((adjustedCalories * 0.25) / 9);
  const carbsG = Math.round((adjustedCalories - proteinG * 4 - fatG * 9) / 4);

  const handleSelectGoal = (g: FitnessGoal) => {
    setGoal(g);
    setStep('stats');
  };

  const handleStatsNext = () => {
    if (!ageNum || !weightKg || !heightCm) {
      showAlert('Missing Info', 'Please fill in all fields.');
      return;
    }
    setStep('activity');
  };

  const handleSelectActivity = (key: string, multiplier: number) => {
    setActivityLevel(key);
    setActivityMultiplier(multiplier);
    setStep('results');
  };

  const handleSave = () => {
    setNutritionGoals({
      calories: adjustedCalories,
      protein_g: proteinG,
      carbs_g: Math.max(carbsG, 0),
      fat_g: fatG,
    });
    setBodyStats({
      sex,
      age: ageNum,
      weight_kg: weightKg,
      height_cm: heightCm,
      activityLevel,
    });
    showAlert('Saved', 'Your nutrition goals have been set.');
    router.back();
  };

  const handleBack = () => {
    if (step === 'stats') setStep('goal');
    else if (step === 'activity') setStep('stats');
    else if (step === 'results') setStep('activity');
    else router.back();
  };

  const steps: WizardStep[] = ['goal', 'stats', 'activity', 'results'];
  const stepIdx = steps.indexOf(step);

  const renderGoalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your goal?</Text>
      <Text style={styles.stepSubtitle}>This determines your calorie and macro targets</Text>
      <View style={styles.optionsList}>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[styles.optionCard, goal === g.key && styles.optionCardSelected]}
            onPress={() => handleSelectGoal(g.key)}
          >
            <Text style={styles.optionTitle}>{g.label}</Text>
            <Text style={styles.optionDesc}>{g.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStatsStep = () => (
    <ScrollView style={styles.stepContainer} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Your body stats</Text>
      <Text style={styles.stepSubtitle}>Used to calculate your basal metabolic rate</Text>

      <Text style={styles.fieldLabel}>Sex</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, sex === 'male' && styles.toggleBtnActive]}
          onPress={() => setSex('male')}
        >
          <Text style={[styles.toggleText, sex === 'male' && styles.toggleTextActive]}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, sex === 'female' && styles.toggleBtnActive]}
          onPress={() => setSex('female')}
        >
          <Text style={[styles.toggleText, sex === 'female' && styles.toggleTextActive]}>Female</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>Age</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. 25"
        placeholderTextColor="#8A8A8A"
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Weight</Text>
        <View style={styles.miniToggle}>
          <TouchableOpacity onPress={() => setWeightUnit('lbs')}>
            <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>lbs</Text>
          </TouchableOpacity>
          <Text style={styles.unitSep}>/</Text>
          <TouchableOpacity onPress={() => setWeightUnit('kg')}>
            <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>kg</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={styles.textInput}
        placeholder={weightUnit === 'lbs' ? 'e.g. 170' : 'e.g. 77'}
        placeholderTextColor="#8A8A8A"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Height</Text>
        <View style={styles.miniToggle}>
          <TouchableOpacity onPress={() => setHeightUnit('ftin')}>
            <Text style={[styles.unitText, heightUnit === 'ftin' && styles.unitTextActive]}>ft/in</Text>
          </TouchableOpacity>
          <Text style={styles.unitSep}>/</Text>
          <TouchableOpacity onPress={() => setHeightUnit('cm')}>
            <Text style={[styles.unitText, heightUnit === 'cm' && styles.unitTextActive]}>cm</Text>
          </TouchableOpacity>
        </View>
      </View>
      {heightUnit === 'cm' ? (
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 175"
          placeholderTextColor="#8A8A8A"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />
      ) : (
        <View style={styles.heightRow}>
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            placeholder="ft"
            placeholderTextColor="#8A8A8A"
            keyboardType="numeric"
            value={heightFt}
            onChangeText={setHeightFt}
          />
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            placeholder="in"
            placeholderTextColor="#8A8A8A"
            keyboardType="numeric"
            value={heightIn}
            onChangeText={setHeightIn}
          />
        </View>
      )}

      <TouchableOpacity style={styles.nextButton} onPress={handleStatsNext}>
        <Text style={styles.nextButtonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderActivityStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Activity level</Text>
      <Text style={styles.stepSubtitle}>How active are you on a typical week?</Text>
      <View style={styles.optionsList}>
        {ACTIVITY_LEVELS.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={[styles.optionCard, activityLevel === a.key && styles.optionCardSelected]}
            onPress={() => handleSelectActivity(a.key, a.multiplier)}
          >
            <Text style={styles.optionTitle}>{a.label}</Text>
            <Text style={styles.optionDesc}>{a.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderResultsStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your daily targets</Text>
      <Text style={styles.stepSubtitle}>
        Based on {goal === 'lean_muscle' ? 'lean muscle gain' : goal === 'bulk' ? 'bulking' : 'cutting'}
      </Text>

      <View style={styles.resultGrid}>
        <View style={styles.resultCard}>
          <Text style={styles.resultValue}>{Math.round(bmr)}</Text>
          <Text style={styles.resultLabel}>BMR</Text>
        </View>
        <View style={styles.resultCard}>
          <Text style={styles.resultValue}>{Math.round(tdee)}</Text>
          <Text style={styles.resultLabel}>TDEE</Text>
        </View>
      </View>

      <View style={styles.macroCard}>
        <Text style={styles.macroCardTitle}>Daily Targets</Text>
        <View style={styles.macroRow}>
          <View style={styles.macroCol}>
            <Text style={styles.macroNum}>{adjustedCalories}</Text>
            <Text style={styles.macroUnit}>calories</Text>
          </View>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroRow}>
          <View style={styles.macroCol}>
            <Text style={styles.macroNum}>{proteinG}g</Text>
            <Text style={styles.macroUnit}>protein</Text>
          </View>
          <View style={styles.macroCol}>
            <Text style={styles.macroNum}>{Math.max(carbsG, 0)}g</Text>
            <Text style={styles.macroUnit}>carbs</Text>
          </View>
          <View style={styles.macroCol}>
            <Text style={styles.macroNum}>{fatG}g</Text>
            <Text style={styles.macroUnit}>fat</Text>
          </View>
        </View>
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>How we calculated this</Text>
        <Text style={styles.breakdownLine}>BMR (Mifflin-St Jeor) = {Math.round(bmr)} cal</Text>
        <Text style={styles.breakdownLine}>TDEE = BMR × {activityMultiplier} = {Math.round(tdee)} cal</Text>
        <Text style={styles.breakdownLine}>
          Adjusted = {Math.round(tdee)} {cfg.calAdjust >= 0 ? '+' : ''} {cfg.calAdjust} = {adjustedCalories} cal
        </Text>
        <Text style={styles.breakdownLine}>Protein = {cfg.proteinPerKg} g/kg × {Math.round(weightKg)} kg = {proteinG}g</Text>
        <Text style={styles.breakdownLine}>Fat = 25% of calories = {fatG}g</Text>
        <Text style={styles.breakdownLine}>Carbs = remaining calories = {Math.max(carbsG, 0)}g</Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save as My Goals</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F5F5F5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Goals</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progress}>
        {steps.map((s, i) => (
          <View
            key={s}
            style={[styles.progressDot, i <= stepIdx && styles.progressDotActive]}
          />
        ))}
      </View>

      {step === 'goal' && renderGoalStep()}
      {step === 'stats' && renderStatsStep()}
      {step === 'activity' && renderActivityStep()}
      {step === 'results' && renderResultsStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#F5F5F5',
    letterSpacing: 0.5,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
  },
  progressDotActive: { backgroundColor: '#4A6FA5' },

  stepContainer: { flex: 1, padding: 24 },
  stepTitle: {
    fontSize: 26,
    fontWeight: '300',
    color: '#F5F5F5',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#8A8A8A',
    marginBottom: 32,
    letterSpacing: 0.3,
  },
  optionsList: { gap: 12 },
  optionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  optionCardSelected: {
    borderColor: '#4A6FA5',
    backgroundColor: 'rgba(74,111,165,0.15)',
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#F5F5F5',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  optionDesc: { fontSize: 13, color: '#8A8A8A', lineHeight: 18 },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
  },
  miniToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unitText: { fontSize: 13, color: '#8A8A8A', paddingHorizontal: 4 },
  unitTextActive: { color: '#4A6FA5', fontWeight: '600' },
  unitSep: { fontSize: 13, color: '#2A2A2A' },

  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  toggleBtnActive: {
    borderColor: '#4A6FA5',
    backgroundColor: 'rgba(74,111,165,0.15)',
  },
  toggleText: { fontSize: 15, color: '#8A8A8A' },
  toggleTextActive: { color: '#4A6FA5', fontWeight: '500' },

  textInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 14,
    fontSize: 16,
    color: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  heightRow: { flexDirection: 'row', gap: 12 },

  nextButton: {
    backgroundColor: '#4A6FA5',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  nextButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  resultGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  resultCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 20,
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '300',
    color: '#4A6FA5',
    fontVariant: ['tabular-nums'],
  },
  resultLabel: {
    fontSize: 11,
    color: '#8A8A8A',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  macroCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 20,
    marginBottom: 16,
  },
  macroCardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroCol: { alignItems: 'center' },
  macroNum: {
    fontSize: 24,
    fontWeight: '300',
    color: '#F5F5F5',
    fontVariant: ['tabular-nums'],
  },
  macroUnit: {
    fontSize: 11,
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  macroDivider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 16,
  },
  breakdownCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4A6FA5',
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  breakdownLine: {
    fontSize: 13,
    color: '#F5F5F5',
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  saveButton: {
    backgroundColor: '#4A6FA5',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
