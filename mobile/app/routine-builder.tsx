import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAvailableSplits, generateRoutine, createRoutine, getCoachNotes } from '@/api/routines';
import {
  AvailableSplit,
  GenerateRoutineResponse,
  GeneratedDay,
  GeneratedExercise,
  DayOfWeek,
} from '@/types';
import { showAlert } from '@/utils/alert';
import { usePreferencesStore } from '@/store/preferencesStore';

type WizardStep = 'days' | 'split' | 'intensity' | 'schedule' | 'preview';

const WEEKDAYS: { key: DayOfWeek; short: string; full: string }[] = [
  { key: 'monday', short: 'M', full: 'Mon' },
  { key: 'tuesday', short: 'T', full: 'Tue' },
  { key: 'wednesday', short: 'W', full: 'Wed' },
  { key: 'thursday', short: 'T', full: 'Thu' },
  { key: 'friday', short: 'F', full: 'Fri' },
  { key: 'saturday', short: 'S', full: 'Sat' },
  { key: 'sunday', short: 'S', full: 'Sun' },
];

const WEEKDAY_ORDER: Record<DayOfWeek, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
};

const INTENSITY_OPTIONS = [
  {
    key: 'hypertrophy',
    label: 'Hypertrophy',
    desc: 'Higher reps, moderate weight. Best for muscle size and definition.',
    detail: '3 sets x 10-15 reps',
  },
  {
    key: 'strength',
    label: 'Strength',
    desc: 'Lower reps, heavier weight. Best for raw strength gains.',
    detail: '5 sets x 3-6 reps',
  },
  {
    key: 'balanced',
    label: 'Balanced',
    desc: 'The classic bodybuilding range. Good all-around progression.',
    detail: '4 sets x 8-12 reps',
  },
];

export default function RoutineBuilderScreen() {
  const workoutPrefs = usePreferencesStore((s) => s.workoutPrefs);
  const [step, setStep] = useState<WizardStep>('days');
  const [daysPerWeek, setDaysPerWeek] = useState(workoutPrefs?.daysPerWeek ?? 3);
  const [selectedSplit, setSelectedSplit] = useState<AvailableSplit | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState('');
  const [generated, setGenerated] = useState<GenerateRoutineResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [coachTips, setCoachTips] = useState<string[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [tipsExpanded, setTipsExpanded] = useState(false);

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  const queryClient = useQueryClient();

  const { data: splits, isLoading: splitsLoading } = useQuery({
    queryKey: ['splits', daysPerWeek],
    queryFn: () => getAvailableSplits(daysPerWeek),
    enabled: step === 'split',
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateRoutine(daysPerWeek, selectedSplit!.key, selectedIntensity),
    onSuccess: (data) => {
      setGenerated(data);
      setCoachTips([]);
      setTipsExpanded(false);
      setSelectedDays([]);
      setStep('schedule');
    },
    onError: () => showAlert('Error', 'Failed to generate routine.'),
  });

  const handleSelectDays = (days: number) => {
    setDaysPerWeek(days);
    setSelectedSplit(null);
    setStep('split');
  };

  const handleSelectSplit = (split: AvailableSplit) => {
    setSelectedSplit(split);
    setStep('intensity');
  };

  const handleSelectIntensity = (key: string) => {
    setSelectedIntensity(key);
    generateMutation.mutate();
  };

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      if (prev.length >= daysPerWeek) return prev;
      return [...prev, day];
    });
  };

  const handleScheduleConfirm = () => {
    if (selectedDays.length !== daysPerWeek) {
      showAlert('Select Days', `Please select exactly ${daysPerWeek} days.`);
      return;
    }
    if (!generated) return;

    const sortedSelectedDays = [...selectedDays].sort(
      (a, b) => WEEKDAY_ORDER[a] - WEEKDAY_ORDER[b]
    );

    const updatedDays = generated.days.map((day, idx) => ({
      ...day,
      day_of_week: sortedSelectedDays[idx],
    }));

    setGenerated({ ...generated, days: updatedDays });
    setStep('preview');
  };

  const getSchedulePreview = (): { day: DayOfWeek; label: string; isRest: boolean }[] => {
    const sortedSelected = [...selectedDays].sort(
      (a, b) => WEEKDAY_ORDER[a] - WEEKDAY_ORDER[b]
    );

    return WEEKDAYS.map((wd) => {
      const assignedIdx = sortedSelected.indexOf(wd.key);
      if (assignedIdx >= 0 && generated && assignedIdx < generated.days.length) {
        return { day: wd.key, label: generated.days[assignedIdx].name, isRest: false };
      }
      return { day: wd.key, label: 'Rest', isRest: true };
    });
  };

  const handleSaveAll = async () => {
    if (!generated) return;
    setSaving(true);
    try {
      for (const day of generated.days) {
        await createRoutine({
          name: day.name,
          day_of_week: day.day_of_week as DayOfWeek,
          description: `${generated.split_label} - ${generated.intensity}`,
          exercises: day.exercises.map((ex) => ({
            exercise_name: ex.exercise_name,
            target_sets: ex.target_sets,
            target_reps: parseInt(ex.target_reps.split('-')[0]) || 10,
            order: ex.order,
          })),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      showAlert('Success', `Created ${generated.days.length} routines!`);
      router.back();
    } catch {
      showAlert('Error', 'Failed to save routines.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step === 'split') setStep('days');
    else if (step === 'intensity') setStep('split');
    else if (step === 'schedule') setStep('intensity');
    else if (step === 'preview') setStep('schedule');
    else router.back();
  };

  const fetchCoachTips = async () => {
    if (!generated) return;
    setLoadingTips(true);
    try {
      const result = await getCoachNotes({
        split: generated.split_label,
        intensity: generated.intensity,
        days: generated.days.map((d) => ({
          name: d.name,
          exercises: d.exercises.map((e) => ({
            name: e.exercise_name,
            sets: e.target_sets,
            reps: e.target_reps,
          })),
        })),
      });
      setCoachTips(result.tips);
      setTipsExpanded(true);
    } catch {
      showAlert('AI Unavailable', 'Could not load coach tips. Make sure GEMINI_API_KEY is configured.');
    } finally {
      setLoadingTips(false);
    }
  };

  const removeExercise = useCallback((dayIdx: number, exIdx: number) => {
    setGenerated((prev) => {
      if (!prev) return prev;
      const newDays = prev.days.map((day, di) => {
        if (di !== dayIdx) return day;
        return {
          ...day,
          exercises: day.exercises.filter((_, ei) => ei !== exIdx),
        };
      });
      return { ...prev, days: newDays };
    });
  }, []);

  const WIZARD_STEPS: WizardStep[] = ['days', 'split', 'intensity', 'schedule', 'preview'];

  const renderDaysStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How many days per week?</Text>
      <Text style={styles.stepSubtitle}>Select your training frequency</Text>
      <View style={styles.daysGrid}>
        {[2, 3, 4, 5, 6].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.dayOption, daysPerWeek === d && styles.dayOptionSelected]}
            onPress={() => handleSelectDays(d)}
          >
            <Text style={[styles.dayNumber, daysPerWeek === d && styles.dayNumberSelected]}>
              {d}
            </Text>
            <Text style={[styles.dayLabel, daysPerWeek === d && styles.dayLabelSelected]}>
              days
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSplitStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose your split</Text>
      <Text style={styles.stepSubtitle}>
        Based on {daysPerWeek} training days per week
      </Text>
      {splitsLoading ? (
        <ActivityIndicator size="large" color="#4A6FA5" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.optionsList}>
          {splits?.map((split) => (
            <TouchableOpacity
              key={split.key}
              style={styles.optionCard}
              onPress={() => handleSelectSplit(split)}
            >
              <Text style={styles.optionTitle}>{split.label}</Text>
              <Text style={styles.optionDetail}>
                {split.day_names.join(' / ')}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#8A8A8A"
                style={styles.optionChevron}
              />
            </TouchableOpacity>
          ))}
          {splits?.length === 0 && (
            <Text style={styles.emptyText}>
              No splits available for {daysPerWeek} days.{'\n'}Try a different number.
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderIntensityStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Training intensity</Text>
      <Text style={styles.stepSubtitle}>What's your primary goal?</Text>
      <View style={styles.optionsList}>
        {INTENSITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.optionCard,
              workoutPrefs?.defaultIntensity === opt.key && styles.optionCardHighlighted,
            ]}
            onPress={() => handleSelectIntensity(opt.key)}
            disabled={generateMutation.isPending}
          >
            <Text style={styles.optionTitle}>{opt.label}</Text>
            <Text style={styles.optionDesc}>{opt.desc}</Text>
            <Text style={styles.optionBadge}>{opt.detail}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {generateMutation.isPending && (
        <ActivityIndicator size="large" color="#4A6FA5" style={{ marginTop: 20 }} />
      )}
    </View>
  );

  const renderScheduleStep = () => {
    const preview = getSchedulePreview();
    return (
      <ScrollView style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Schedule your week</Text>
        <Text style={styles.stepSubtitle}>
          Select {daysPerWeek} training days · {selectedDays.length}/{daysPerWeek} chosen
        </Text>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((wd, i) => {
            const isActive = selectedDays.includes(wd.key);
            return (
              <TouchableOpacity
                key={wd.key}
                style={[styles.weekPill, isActive && styles.weekPillActive]}
                onPress={() => toggleDay(wd.key)}
              >
                <Text style={[styles.weekPillText, isActive && styles.weekPillTextActive]}>
                  {wd.short}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDays.length > 0 && (
          <View style={styles.schedulePreview}>
            {preview.map((item) => (
              <View
                key={item.day}
                style={[styles.scheduleRow, item.isRest && styles.scheduleRowRest]}
              >
                <Text style={[styles.scheduleDayLabel, item.isRest && styles.scheduleDayLabelRest]}>
                  {WEEKDAYS.find((w) => w.key === item.day)?.full}
                </Text>
                <Text
                  style={[styles.scheduleWorkout, item.isRest && styles.scheduleWorkoutRest]}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.confirmScheduleBtn,
            selectedDays.length !== daysPerWeek && styles.confirmScheduleBtnDisabled,
          ]}
          onPress={handleScheduleConfirm}
          disabled={selectedDays.length !== daysPerWeek}
        >
          <Text style={styles.confirmScheduleText}>Confirm Schedule</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderExercise = (ex: GeneratedExercise, dayIdx: number, exIdx: number) => (
    <View key={`${dayIdx}-${exIdx}`} style={styles.exerciseRow}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
        <Text style={styles.exerciseMeta}>
          {ex.target_sets} sets x {ex.target_reps} reps · {ex.equipment}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => removeExercise(dayIdx, exIdx)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle-outline" size={22} color="#8A8A8A" />
      </TouchableOpacity>
    </View>
  );

  const renderPreviewStep = () => {
    const fullWeek = WEEKDAYS.map((wd) => {
      const workout = generated?.days.find((d) => d.day_of_week === wd.key);
      return { weekday: wd, workout: workout ?? null };
    });

    return (
      <ScrollView style={styles.previewScroll} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.stepTitle}>{generated?.split_label}</Text>
        <Text style={styles.stepSubtitle}>
          {generated?.intensity} intensity · {generated?.days.length} days
        </Text>

        <TouchableOpacity
          style={styles.coachButton}
          onPress={coachTips.length > 0 ? () => setTipsExpanded(!tipsExpanded) : fetchCoachTips}
          disabled={loadingTips}
        >
          <Ionicons name="sparkles" size={18} color="#4A6FA5" />
          <Text style={styles.coachButtonText}>
            {loadingTips ? 'Getting AI tips...' : coachTips.length > 0 ? "Coach's Notes" : 'Get AI Coach Tips'}
          </Text>
          {loadingTips && <ActivityIndicator size="small" color="#4A6FA5" />}
          {coachTips.length > 0 && (
            <Ionicons name={tipsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#8A8A8A" />
          )}
        </TouchableOpacity>

        {tipsExpanded && coachTips.length > 0 && (
          <View style={styles.coachCard}>
            {coachTips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipBullet}>{i + 1}</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {fullWeek.map(({ weekday, workout }) => {
          if (workout) {
            const dayIdx = generated!.days.indexOf(workout);
            return (
              <View key={weekday.key} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{workout.name}</Text>
                  <Text style={styles.dayDow}>{weekday.full}</Text>
                </View>
                {workout.exercises.map((ex, exIdx) => renderExercise(ex, dayIdx, exIdx))}
              </View>
            );
          }
          return (
            <View key={weekday.key} style={styles.restDayRow}>
              <Text style={styles.restDayRowLabel}>{weekday.full}</Text>
              <Text style={styles.restDayRowText}>Rest</Text>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F5F5F5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'days' && 'Build Routine'}
          {step === 'split' && 'Choose Split'}
          {step === 'intensity' && 'Set Intensity'}
          {step === 'schedule' && 'Schedule'}
          {step === 'preview' && 'Preview'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progress}>
        {WIZARD_STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              (step === s || WIZARD_STEPS.indexOf(step) > i) && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {step === 'days' && renderDaysStep()}
      {step === 'split' && renderSplitStep()}
      {step === 'intensity' && renderIntensityStep()}
      {step === 'schedule' && renderScheduleStep()}
      {step === 'preview' && renderPreviewStep()}

      {step === 'preview' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveAll}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : `Save ${generated?.days.length} Routines`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  dayOption: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  dayOptionSelected: {
    borderColor: '#4A6FA5',
    backgroundColor: 'rgba(74, 111, 165, 0.15)',
  },
  dayNumber: {
    fontSize: 28,
    fontWeight: '300',
    color: '#F5F5F5',
    fontVariant: ['tabular-nums'],
  },
  dayNumberSelected: { color: '#4A6FA5' },
  dayLabel: { fontSize: 12, color: '#8A8A8A', marginTop: 2 },
  dayLabelSelected: { color: '#4A6FA5' },

  optionsList: { gap: 12 },
  optionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  optionCardHighlighted: {
    borderColor: '#4A6FA5',
    backgroundColor: 'rgba(74, 111, 165, 0.08)',
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#F5F5F5',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  optionDetail: { fontSize: 13, color: '#8A8A8A', letterSpacing: 0.3 },
  optionDesc: { fontSize: 13, color: '#8A8A8A', marginBottom: 8, lineHeight: 18 },
  optionBadge: {
    fontSize: 12,
    color: '#4A6FA5',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  optionChevron: { position: 'absolute', right: 16, top: 18 },
  emptyText: {
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 24,
  },
  weekPill: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 4,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    maxWidth: 48,
  },
  weekPillActive: {
    borderColor: '#4A6FA5',
    backgroundColor: 'rgba(74,111,165,0.2)',
  },
  weekPillText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8A8A8A',
  },
  weekPillTextActive: { color: '#4A6FA5' },

  schedulePreview: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  scheduleRowRest: { opacity: 0.5 },
  scheduleDayLabel: {
    fontSize: 14,
    color: '#F5F5F5',
    fontWeight: '400',
    width: 50,
  },
  scheduleDayLabelRest: { color: '#8A8A8A' },
  scheduleWorkout: {
    fontSize: 14,
    color: '#4A6FA5',
    fontWeight: '500',
  },
  scheduleWorkoutRest: {
    color: '#8A8A8A',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  confirmScheduleBtn: {
    backgroundColor: '#4A6FA5',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  confirmScheduleBtnDisabled: { opacity: 0.4 },
  confirmScheduleText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  previewScroll: { flex: 1, padding: 16 },
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74,111,165,0.1)',
    borderRadius: 4,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(74,111,165,0.2)',
  },
  coachButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#4A6FA5',
    fontWeight: '500',
  },
  coachCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A6FA5',
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 10,
  },
  tipBullet: {
    fontSize: 13,
    color: '#4A6FA5',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    width: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#F5F5F5',
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    marginTop: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  dayName: {
    fontSize: 17,
    fontWeight: '400',
    color: '#F5F5F5',
    letterSpacing: 0.3,
  },
  dayDow: {
    fontSize: 12,
    color: '#4A6FA5',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, color: '#F5F5F5', marginBottom: 2 },
  exerciseMeta: { fontSize: 12, color: '#8A8A8A' },

  restDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 16,
    opacity: 0.5,
  },
  restDayRowLabel: {
    fontSize: 14,
    color: '#8A8A8A',
    fontWeight: '400',
  },
  restDayRowText: {
    fontSize: 14,
    color: '#8A8A8A',
    fontStyle: 'italic',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  saveButton: {
    backgroundColor: '#4A6FA5',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
