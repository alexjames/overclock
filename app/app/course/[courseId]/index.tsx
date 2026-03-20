import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useApiHost } from '../../../context/ApiHostContext';
import { fetchCourses, fetchSections } from '../../../api/courses';
import { Course, CourseSection } from '../../../types/course';

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { colors } = useTheme();
  const { apiHost } = useApiHost();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      fetchCourses(apiHost).then((courses) => courses.find((c) => c.id === courseId) ?? null),
      fetchSections(apiHost, courseId),
    ])
      .then(([found, secs]) => {
        setCourse(found);
        setSections(secs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId, apiHost]);

  const handleSectionPress = (section: CourseSection) => {
    router.push(`/course/${courseId}/${section.id}`);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Failed to load course</Text>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Course not found</Text>
      </SafeAreaView>
    );
  }

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
          {(() => {
            // Group sections into runs: ungrouped sections stand alone, grouped sections are collected together
            type GroupRun =
              | { kind: 'ungrouped'; section: CourseSection; index: number }
              | { kind: 'group'; label: string; items: { section: CourseSection; index: number }[] };
            const runs: GroupRun[] = [];
            sections.forEach((section, i) => {
              if (!section.group) {
                runs.push({ kind: 'ungrouped', section, index: i });
              } else {
                const last = runs[runs.length - 1];
                if (last && last.kind === 'group' && last.label === section.group) {
                  last.items.push({ section, index: i });
                } else {
                  runs.push({ kind: 'group', label: section.group, items: [{ section, index: i }] });
                }
              }
            });
            return runs.map((run, runIdx) => {
              if (run.kind === 'ungrouped') {
                return (
                  <TouchableOpacity
                    key={run.section.id}
                    style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, runIdx > 0 && styles.sectionCardSpacing]}
                    onPress={() => handleSectionPress(run.section)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sectionContent}>
                      <View style={[styles.sectionNumber, { backgroundColor: colors.primary }]}>
                        <Text style={styles.sectionNumberText}>{run.index + 1}</Text>
                      </View>
                      <View style={styles.sectionInfo}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{run.section.title}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              }
              return (
                <View key={`group-${run.label}-${runIdx}`} style={runIdx > 0 && styles.sectionCardSpacing}>
                  <Text style={[styles.groupLabel, { color: colors.textMuted }]}>{run.label}</Text>
                  <View style={[styles.groupContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {run.items.map(({ section, index }, itemIdx) => (
                      <View key={section.id}>
                        {itemIdx > 0 && <View style={[styles.groupDivider, { backgroundColor: colors.border }]} />}
                        <TouchableOpacity
                          style={styles.groupSectionRow}
                          onPress={() => handleSectionPress(section)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.sectionContent}>
                            <View style={[styles.sectionNumber, { backgroundColor: colors.primary }]}>
                              <Text style={styles.sectionNumberText}>{index + 1}</Text>
                            </View>
                            <View style={styles.sectionInfo}>
                              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              );
            });
          })()}
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
  },
  sectionCardSpacing: {
    marginTop: 12,
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
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  groupContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  groupDivider: {
    height: 1,
    marginLeft: 16,
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
