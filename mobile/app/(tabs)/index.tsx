/**
 * Dashboard Screen - Calendar view with workout/nutrition indicators.
 * 
 * 🎓 INTERVIEW CONCEPT: Calendar-Based Data Visualization
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Displaying activity data on a calendar:
 * 1. Query data for the visible month
 * 2. Transform into markers format for react-native-calendars
 * 3. Handle date selection for drill-down view
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useAuthStore } from '@/store/authStore';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Mock marked dates - replace with API data
  const markedDates: Record<string, any> = {
    '2026-01-27': { marked: true, dotColor: '#6366f1' }, // Workout
    '2026-01-28': { marked: true, dotColor: '#22c55e' }, // Nutrition
    '2026-01-29': { 
      marked: true, 
      dots: [
        { color: '#6366f1' }, // Workout
        { color: '#22c55e' }, // Nutrition
      ],
    },
    [selectedDate]: { selected: true, selectedColor: '#6366f1' },
  };
  
  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };
  
  // Get current date info
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : 
                   today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.userName}>{user?.username || 'Athlete'} 💪</Text>
      </View>
      
      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Workouts this month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>85%</Text>
          <Text style={styles.statLabel}>Consistency</Text>
        </View>
      </View>
      
      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>Activity Calendar</Text>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            backgroundColor: '#252542',
            calendarBackground: '#252542',
            textSectionTitleColor: '#888',
            selectedDayBackgroundColor: '#6366f1',
            selectedDayTextColor: '#fff',
            todayTextColor: '#6366f1',
            dayTextColor: '#fff',
            textDisabledColor: '#444',
            monthTextColor: '#fff',
            arrowColor: '#6366f1',
          }}
          style={styles.calendar}
        />
      </View>
      
      {/* Selected Date Summary */}
      {selectedDate && (
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              No data recorded for this date.
            </Text>
            <Text style={styles.summaryHint}>
              Tap "Record" to log a workout!
            </Text>
          </View>
        </View>
      )}
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
          <Text style={styles.legendText}>Workout</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Nutrition</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#888',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#252542',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  calendarContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  calendar: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#252542',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#888',
  },
  summaryHint: {
    fontSize: 14,
    color: '#6366f1',
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 32,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#888',
  },
});
