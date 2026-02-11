import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useApiHost } from '../../context/ApiHostContext';
import { fetchQuizList, fetchQuiz, QuizSummary } from '../../api/courses';
import { QuizContainer } from '../../components/quiz/QuizContainer';
import { Question, QuizResult } from '../../types/quiz';

type ScreenMode = 'list' | 'loading_quiz' | 'quiz' | 'results';

export default function QuizScreen() {
  const { colors } = useTheme();
  const { apiHost } = useApiHost();

  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activeQuizTitle, setActiveQuizTitle] = useState('');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const loadQuizList = useCallback(async () => {
    try {
      setError(null);
      const list = await fetchQuizList(apiHost);
      setQuizzes(list);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiHost]);

  useEffect(() => {
    setLoading(true);
    loadQuizList();
  }, [loadQuizList]);

  const handleStartQuiz = async (quiz: QuizSummary) => {
    setScreenMode('loading_quiz');
    setActiveQuizTitle(quiz.title);
    try {
      const data = await fetchQuiz(apiHost, quiz.id);
      if (data.questions && data.questions.length > 0) {
        setActiveQuestions(data.questions);
        setScreenMode('quiz');
      } else {
        setScreenMode('list');
      }
    } catch {
      setScreenMode('list');
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);
    setScreenMode('results');
  };

  const handleQuizExit = () => {
    setScreenMode('list');
    setActiveQuestions([]);
    setQuizResult(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuizList();
  };

  // Quiz mode
  if (screenMode === 'quiz' && activeQuestions.length > 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleQuizExit} style={styles.exitButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.quizTitle, { color: colors.text }]} numberOfLines={1}>
            {activeQuizTitle}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <QuizContainer
          questions={activeQuestions}
          onComplete={handleQuizComplete}
          onExit={handleQuizExit}
        />
      </SafeAreaView>
    );
  }

  // Results mode
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
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            onPress={handleQuizExit}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading quiz mode
  if (screenMode === 'loading_quiz') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // List loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Quiz</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text }]}>Failed to load quizzes</Text>
            <Text style={[styles.errorDetail, { color: colors.textMuted }]}>{error}</Text>
          </View>
        )}

        {!error && quizzes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No quizzes available</Text>
          </View>
        )}

        <View style={styles.quizList}>
          {quizzes.map((quiz) => (
            <TouchableOpacity
              key={quiz.id}
              style={[styles.quizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleStartQuiz(quiz)}
              activeOpacity={0.7}
            >
              <View style={styles.quizCardLeft}>
                <View style={[styles.courseIcon, { backgroundColor: quiz.color }]}>
                  <Ionicons name={quiz.icon as any} size={24} color="white" />
                </View>
                <View style={styles.quizCardInfo}>
                  <Text style={[styles.quizCardTitle, { color: colors.text }]}>{quiz.title}</Text>
                  <Text style={[styles.quizCardSubtitle, { color: colors.textMuted }]}>
                    {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={[styles.startButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.startButtonText}>Start</Text>
              </View>
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
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  quizList: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  quizCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quizCardInfo: {
    flex: 1,
  },
  quizCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quizCardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  startButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
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
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 32,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomPadding: {
    height: 32,
  },
});
