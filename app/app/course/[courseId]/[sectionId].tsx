import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useApiHost } from '../../../context/ApiHostContext';
import { PageSlideshow } from '../../../components/PageSlideshow';
import { QuizContainer } from '../../../components/quiz/QuizContainer';
import { fetchSectionDetail } from '../../../api/courses';
import { CourseSection } from '../../../types/course';
import { QuizResult } from '../../../types/quiz';

type ScreenMode = 'slideshow' | 'quiz' | 'results';

export default function SectionScreen() {
  const { courseId, sectionId } = useLocalSearchParams<{ courseId: string; sectionId: string }>();
  const { colors } = useTheme();
  const { apiHost } = useApiHost();

  const [section, setSection] = useState<CourseSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screenMode, setScreenMode] = useState<ScreenMode>('slideshow');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (!courseId || !sectionId) return;
    fetchSectionDetail(apiHost, courseId, sectionId)
      .then(setSection)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId, sectionId, apiHost]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !section) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error ?? 'Section not found'}
        </Text>
      </SafeAreaView>
    );
  }

  const hasQuiz = !!(section.quiz && section.quiz.questions.length > 0);

  const handleSlideshowComplete = () => {
    if (hasQuiz) {
      setScreenMode('quiz');
    } else {
      router.back();
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);
    setScreenMode('results');
  };

  const handleQuizExit = () => {
    router.back();
  };

  // Quiz results screen
  if (screenMode === 'results' && quizResult) {
    const isPassing = quizResult.percentage >= 70;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.resultsContainer}>
          <View style={[styles.resultsCard, { backgroundColor: colors.card }]}>
            <View style={[styles.scoreCircle, { borderColor: isPassing ? colors.success : colors.error }]}>
              <Text style={[styles.scoreText, { color: isPassing ? colors.success : colors.error }]}>
                {quizResult.percentage}%
              </Text>
            </View>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              {isPassing ? 'Great job!' : 'Keep practicing!'}
            </Text>
            <Text style={[styles.resultsSubtitle, { color: colors.textSecondary }]}>
              You got {quizResult.correctAnswers} out of {quizResult.totalQuestions} questions correct
            </Text>
          </View>
          <View style={styles.resultsButtons}>
            <TouchableOpacity
              style={[styles.resultButton, { backgroundColor: colors.primary }]}
              onPress={handleQuizExit}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={[styles.resultButtonText, { color: 'white' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Quiz screen
  if (screenMode === 'quiz' && hasQuiz) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleQuizExit} style={styles.exitButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Quiz</Text>
          <View style={styles.placeholder} />
        </View>
        <QuizContainer
          questions={section.quiz!.questions}
          onComplete={handleQuizComplete}
          onExit={handleQuizExit}
        />
      </SafeAreaView>
    );
  }

  // Slideshow (default)
  return (
    <PageSlideshow
      pages={section.pages}
      onComplete={handleSlideshowComplete}
    />
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
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  resultsCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '700',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  resultsButtons: {
    marginTop: 32,
    gap: 12,
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
