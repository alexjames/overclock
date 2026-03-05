import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useApiHost } from '../../context/ApiHostContext';
import { CourseCard } from '../../components/CourseCard';
import { fetchCourses } from '../../api/courses';
import { Course } from '../../types/course';

export default function CoursesScreen() {
  const { colors } = useTheme();
  const { apiHost } = useApiHost();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCourses(apiHost);
      setCourses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiHost]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCourses();
    }, [loadCourses])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const handleCoursePress = (course: Course) => {
    router.push(`/course/${course.id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.text }]}>Failed to load courses</Text>
          <Text style={[styles.errorDetail, { color: colors.textMuted }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => { setLoading(true); loadCourses(); }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Courses</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            All courses
          </Text>
          <View style={styles.coursesGrid}>
            {courses.map((course) => (
              <View key={course.id} style={styles.courseWrapper}>
                <CourseCard course={course} onPress={() => handleCoursePress(course)} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  courseWrapper: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  bottomPadding: {
    height: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
