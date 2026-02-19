/**
 * Dashboard -- calendar view with real workout/nutrition indicators.
 */

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { getCalendarData } from '@/api/calendar';

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [visibleMonth, setVisibleMonth] = useState(currentMonth());

  const { data: calendarDays } = useQuery({
    queryKey: ['calendar', visibleMonth],
    queryFn: () => getCalendarData(visibleMonth),
    staleTime: 60 * 1000,
  });

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    if (calendarDays) {
      for (const day of calendarDays) {
        const dots: { color: string }[] = [];
        if (day.has_workout) dots.push({ color: '#4A6FA5' });
        if (day.has_nutrition) dots.push({ color: '#8A8A8A' });
        if (dots.length > 0) {
          marks[day.date] = { marked: true, dots };
        }
      }
    }

    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: '#4A6FA5',
      };
    }

    return marks;
  }, [calendarDays, selectedDate]);

  const workoutCount = calendarDays?.filter(d => d.has_workout).length ?? 0;
  const totalDays = calendarDays?.length ?? 0;

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setVisibleMonth(`${month.year}-${String(month.month).padStart(2, '0')}`);
  };

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' :
                   today.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const selectedDay = calendarDays?.find(d => d.date === selectedDate);

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
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <View style={styles.summaryCard}>
            {selectedDay ? (
              <>
                {selectedDay.has_workout && (
                  <Text style={styles.summaryText}>Workout logged</Text>
                )}
                {selectedDay.has_nutrition && (
                  <Text style={styles.summaryText}>Nutrition logged</Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.summaryText}>No data recorded for this date.</Text>
                <Text style={styles.summaryHint}>Tap "Record" to log a workout</Text>
              </>
            )}
          </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#8A8A8A',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 28,
    fontWeight: '300',
    color: '#F5F5F5',
    marginTop: 4,
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '300',
    color: '#4A6FA5',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: '#8A8A8A',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  calendarContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8A8A8A',
    marginBottom: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  calendar: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    padding: 20,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 15,
    color: '#F5F5F5',
    marginBottom: 4,
  },
  summaryHint: {
    fontSize: 13,
    color: '#4A6FA5',
    marginTop: 4,
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
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#8A8A8A',
    letterSpacing: 0.5,
  },
});
