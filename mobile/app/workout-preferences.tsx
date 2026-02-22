import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePreferencesStore } from '@/store/preferencesStore';
import { showAlert } from '@/utils/alert';

const SPLIT_OPTIONS = [
  { key: 'push_pull_legs', label: 'Push / Pull / Legs' },
  { key: 'upper_lower', label: 'Upper / Lower' },
  { key: 'full_body', label: 'Full Body' },
  { key: 'bro_split', label: 'Bro Split' },
  { key: 'arnold', label: 'Arnold Split' },
  { key: 'lift_cardio', label: 'Lift + Cardio' },
];

const INTENSITY_OPTIONS = [
  { key: 'hypertrophy', label: 'Hypertrophy', desc: '3 sets x 10-15 reps' },
  { key: 'strength', label: 'Strength', desc: '5 sets x 3-6 reps' },
  { key: 'balanced', label: 'Balanced', desc: '4 sets x 8-12 reps' },
];

export default function WorkoutPreferencesScreen() {
  const { workoutPrefs, setWorkoutPrefs } = usePreferencesStore();

  const [split, setSplit] = useState(workoutPrefs?.preferredSplit ?? 'push_pull_legs');
  const [days, setDays] = useState(workoutPrefs?.daysPerWeek ?? 3);
  const [intensity, setIntensity] = useState(workoutPrefs?.defaultIntensity ?? 'balanced');

  const handleSave = () => {
    setWorkoutPrefs({
      preferredSplit: split,
      daysPerWeek: days,
      defaultIntensity: intensity,
    });
    showAlert('Saved', 'Workout preferences updated. These will be pre-filled the next time you build a routine.');
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F5F5F5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionLabel}>Preferred Split</Text>
        <View style={styles.optionGrid}>
          {SPLIT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.optionCard, split === opt.key && styles.optionCardActive]}
              onPress={() => setSplit(opt.key)}
            >
              <Text style={[styles.optionText, split === opt.key && styles.optionTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Training Days Per Week</Text>
        <View style={styles.daysRow}>
          {[2, 3, 4, 5, 6].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayPill, days === d && styles.dayPillActive]}
              onPress={() => setDays(d)}
            >
              <Text style={[styles.dayPillText, days === d && styles.dayPillTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Default Intensity</Text>
        <View style={styles.optionList}>
          {INTENSITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.intensityCard, intensity === opt.key && styles.intensityCardActive]}
              onPress={() => setIntensity(opt.key)}
            >
              <Text style={[styles.intensityLabel, intensity === opt.key && styles.intensityLabelActive]}>
                {opt.label}
              </Text>
              <Text style={styles.intensityDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: { flex: 1, padding: 24 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 24,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  optionCardActive: {
    borderColor: '#4A6FA5',
    backgroundColor: 'rgba(74,111,165,0.15)',
  },
  optionText: {
    fontSize: 14,
    color: '#8A8A8A',
  },
  optionTextActive: {
    color: '#4A6FA5',
    fontWeight: '500',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dayPill: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  dayPillActive: {
    borderColor: '#4A6FA5',
    backgroundColor: 'rgba(74,111,165,0.15)',
  },
  dayPillText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#8A8A8A',
    fontVariant: ['tabular-nums'],
  },
  dayPillTextActive: { color: '#4A6FA5', fontWeight: '500' },
  optionList: { gap: 8 },
  intensityCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  intensityCardActive: {
    borderColor: '#4A6FA5',
    backgroundColor: 'rgba(74,111,165,0.15)',
  },
  intensityLabel: {
    fontSize: 16,
    color: '#F5F5F5',
    fontWeight: '400',
    marginBottom: 4,
  },
  intensityLabelActive: { color: '#4A6FA5' },
  intensityDesc: {
    fontSize: 13,
    color: '#8A8A8A',
  },
  saveButton: {
    backgroundColor: '#4A6FA5',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
