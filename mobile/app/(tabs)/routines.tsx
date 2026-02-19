import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutines, useCreateRoutine, useDeleteRoutine } from '@/hooks/useRoutines';
import { RoutineListItem, DayOfWeek } from '@/types';
import { showAlert } from '@/utils/alert';

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const ALL_DAYS: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export default function RoutinesScreen() {
  const { data: routines, isLoading, error, refetch } = useRoutines();
  const createMutation = useCreateRoutine();
  const deleteMutation = useDeleteRoutine();

  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineDesc, setRoutineDesc] = useState('');
  const [routineDay, setRoutineDay] = useState<DayOfWeek | null>(null);

  const handleFabPress = () => setShowChoiceModal(true);

  const handleBuildWithAssistant = () => {
    setShowChoiceModal(false);
    router.push('/routine-builder');
  };

  const handleManualCreate = () => {
    setShowChoiceModal(false);
    setRoutineName('');
    setRoutineDesc('');
    setRoutineDay(null);
    setShowManualModal(true);
  };

  const handleSaveManual = () => {
    if (!routineName.trim()) {
      showAlert('Validation', 'Please enter a routine name');
      return;
    }
    createMutation.mutate(
      {
        name: routineName.trim(),
        description: routineDesc.trim() || undefined,
        day_of_week: routineDay || undefined,
        exercises: [],
      },
      {
        onSuccess: () => {
          setShowManualModal(false);
          showAlert('Success', 'Routine created!');
        },
        onError: () => showAlert('Error', 'Failed to create routine'),
      },
    );
  };

  const handleDeleteRoutine = (id: number, name: string) => {
    showAlert('Delete', `Delete "${name}"?`);
    deleteMutation.mutate(id);
  };

  const renderRoutineCard = ({ item }: { item: RoutineListItem }) => (
    <View style={styles.routineCard}>
      <View style={styles.routineHeader}>
        <Text style={styles.routineName}>{item.name}</Text>
        {item.day_of_week && (
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>
              {DAY_LABELS[item.day_of_week]}
            </Text>
          </View>
        )}
      </View>

      {item.description && (
        <Text style={styles.routineDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.routineFooter}>
        <View style={styles.exerciseCount}>
          <Ionicons name="barbell-outline" size={16} color="#8A8A8A" />
          <Text style={styles.exerciseCountText}>
            {item.exercise_count} exercises
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteRoutine(item.id, item.name)}>
          <Ionicons name="trash-outline" size={18} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A6FA5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load routines</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={routines}
        renderItem={renderRoutineCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color="#2A2A2A" />
            <Text style={styles.emptyTitle}>No routines yet</Text>
            <Text style={styles.emptyText}>
              Tap + to create your first workout routine
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
        <Ionicons name="add" size={28} color="#F5F5F5" />
      </TouchableOpacity>

      {/* Choice Modal */}
      <Modal
        visible={showChoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChoiceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChoiceModal(false)}
        >
          <View style={styles.choiceSheet}>
            <Text style={styles.choiceTitle}>New Routine</Text>

            <TouchableOpacity style={styles.choiceOption} onPress={handleBuildWithAssistant}>
              <View style={styles.choiceIconWrap}>
                <Ionicons name="sparkles-outline" size={24} color="#4A6FA5" />
              </View>
              <View style={styles.choiceTextWrap}>
                <Text style={styles.choiceOptionTitle}>Build with Assistant</Text>
                <Text style={styles.choiceOptionDesc}>
                  Choose your split, intensity, and get a full program generated
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A8A8A" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.choiceOption} onPress={handleManualCreate}>
              <View style={styles.choiceIconWrap}>
                <Ionicons name="create-outline" size={24} color="#4A6FA5" />
              </View>
              <View style={styles.choiceTextWrap}>
                <Text style={styles.choiceOptionTitle}>Create Manually</Text>
                <Text style={styles.choiceOptionDesc}>
                  Build a custom routine from scratch
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A8A8A" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Manual Creation Modal */}
      <Modal
        visible={showManualModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.manualSheet}>
            <View style={styles.manualHeader}>
              <TouchableOpacity onPress={() => setShowManualModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.manualTitle}>New Routine</Text>
              <TouchableOpacity
                onPress={handleSaveManual}
                disabled={createMutation.isPending}
              >
                <Text style={[styles.saveText, createMutation.isPending && { opacity: 0.5 }]}>
                  {createMutation.isPending ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.manualBody}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Push Day"
                placeholderTextColor="#8A8A8A"
                value={routineName}
                onChangeText={setRoutineName}
              />

              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Brief description"
                placeholderTextColor="#8A8A8A"
                value={routineDesc}
                onChangeText={setRoutineDesc}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.fieldLabel}>Day of Week (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={styles.dayChips}>
                  {ALL_DAYS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dayChip, routineDay === d && styles.dayChipSelected]}
                      onPress={() => setRoutineDay(routineDay === d ? null : d)}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          routineDay === d && styles.dayChipTextSelected,
                        ]}
                      >
                        {DAY_LABELS[d]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  listContent: { padding: 16, paddingBottom: 100 },
  routineCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routineName: {
    fontSize: 17,
    fontWeight: '400',
    color: '#F5F5F5',
    flex: 1,
    letterSpacing: 0.5,
  },
  dayBadge: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    marginLeft: 8,
  },
  dayBadgeText: {
    color: '#F5F5F5',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  routineDescription: {
    fontSize: 14,
    color: '#8A8A8A',
    marginBottom: 12,
    lineHeight: 20,
  },
  routineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseCountText: { fontSize: 13, color: '#8A8A8A' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A6FA5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorText: { fontSize: 16, color: '#ef4444', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  retryText: { color: '#F5F5F5', fontWeight: '500', letterSpacing: 0.5 },

  // Choice modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  choiceSheet: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 24,
    paddingBottom: 40,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#F5F5F5',
    letterSpacing: 0.5,
    marginBottom: 20,
    textAlign: 'center',
  },
  choiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  choiceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74,111,165,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  choiceTextWrap: { flex: 1 },
  choiceOptionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#F5F5F5',
    marginBottom: 2,
  },
  choiceOptionDesc: { fontSize: 13, color: '#8A8A8A', lineHeight: 18 },

  // Manual modal
  manualSheet: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  manualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  manualTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#F5F5F5',
    letterSpacing: 0.5,
  },
  cancelText: { fontSize: 15, color: '#8A8A8A' },
  saveText: { fontSize: 15, color: '#4A6FA5', fontWeight: '500' },
  manualBody: { paddingBottom: 20 },
  fieldLabel: {
    fontSize: 13,
    color: '#8A8A8A',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: '#121212',
    borderRadius: 4,
    padding: 14,
    fontSize: 15,
    color: '#F5F5F5',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dayChips: { flexDirection: 'row', gap: 8 },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
  },
  dayChipSelected: { backgroundColor: '#4A6FA5' },
  dayChipText: { fontSize: 14, color: '#8A8A8A', fontWeight: '500' },
  dayChipTextSelected: { color: '#F5F5F5' },
});
