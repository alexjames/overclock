import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { courses } from '../../../data/courses';
import { CourseSection } from '../../../types/course';

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { colors } = useTheme();

  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Course not found</Text>
      </SafeAreaView>
    );
  }

  const handleSectionPress = (section: CourseSection) => {
    router.push(`/course/${courseId}/${section.id}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Course Hero */}
        <View style={styles.heroContainer}>
          <View style={[styles.heroImage, { backgroundColor: course.color }]}>
            <Ionicons name={course.icon as any} size={80} color="white" />
          </View>
          <Text style={[styles.category, { color: colors.textMuted }]}>{course.category}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{course.title}</Text>
        </View>

        {/* Sections List */}
        <View style={styles.sectionsContainer}>
          <Text style={[styles.sectionsTitle, { color: colors.text }]}>Sections</Text>
          {course.sections.map((section, index) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSectionPress(section)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionContent}>
                <View style={[styles.sectionNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.sectionNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.sectionInfo}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                  <Text style={[styles.sectionPages, { color: colors.textMuted }]}>
                    {section.pages.length} pages
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  heroImage: {
    width: 160,
    height: 160,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionsContainer: {
    paddingHorizontal: 24,
  },
  sectionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionPages: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  bottomPadding: {
    height: 32,
  },
});
