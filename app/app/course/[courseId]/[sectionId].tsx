import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useApiHost } from '../../../context/ApiHostContext';
import { ProgressRing } from '../../../components/ProgressRing';
import { ContentRenderer, FormattedText } from '../../../components/ContentRenderer';
import { QuizContainer } from '../../../components/quiz/QuizContainer';
import { Slideshow } from '../../../components/slideshow';
import { fetchSectionDetail } from '../../../api/courses';
import { CourseSection } from '../../../types/course';
import { QuizResult } from '../../../types/quiz';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ScreenMode = 'reading' | 'quiz' | 'results' | 'slideshow';

export default function ReadingScreen() {
  const { courseId, sectionId } = useLocalSearchParams<{ courseId: string; sectionId: string }>();
  const { colors } = useTheme();
  const { apiHost } = useApiHost();
  const [currentPage, setCurrentPage] = useState(0);
  const [screenMode, setScreenMode] = useState<ScreenMode>('reading');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [section, setSection] = useState<CourseSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const pages = section.pages;
  const totalPages = pages.length;
  const hasQuiz = section.quiz && section.quiz.questions.length > 0;
  const hasSlideshow = section.slides && section.slides.length > 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (pageIndex !== currentPage && pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPage(pageIndex);
    }
  };

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      scrollViewRef.current?.scrollTo({ x: pageIndex * SCREEN_WIDTH, animated: true });
      setCurrentPage(pageIndex);
    }
  };

  const handleExit = () => {
    router.back();
  };

  const handlePrevious = () => {
    goToPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage === totalPages - 1) {
      if (hasQuiz) {
        setScreenMode('quiz');
      } else {
        router.back();
      }
    } else {
      goToPage(currentPage + 1);
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);
    setScreenMode('results');
  };

  const handleQuizExit = () => {
    router.back();
  };

  const handleSlideshowExit = () => {
    setScreenMode('reading');
  };

  // Slideshow Screen
  if (screenMode === 'slideshow' && hasSlideshow) {
    return (
      <Slideshow
        slides={section.slides!}
        spanningImages={section.spanningImages}
        onExit={handleSlideshowExit}
      />
    );
  }

  // Quiz Results Screen
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
              style={[styles.resultButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => {
                setScreenMode('reading');
                setCurrentPage(0);
                goToPage(0);
              }}
            >
              <Ionicons name="book-outline" size={20} color={colors.text} />
              <Text style={[styles.resultButtonText, { color: colors.text }]}>Review Content</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resultButton, { backgroundColor: colors.primary }]}
              onPress={handleExit}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={[styles.resultButtonText, { color: 'white' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Quiz Screen
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

  // Reading Screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <ProgressRing total={totalPages} current={currentPage} />
        <View style={styles.placeholder} />
      </View>

      {/* Page Content - Swipeable */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {pages.map((page, index) => (
          <View key={page.id} style={[styles.pageContainer, { width: SCREEN_WIDTH }]}>
            <ScrollView
              style={styles.pageScroll}
              contentContainerStyle={styles.pageScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Single Content Card with all content */}
              <View style={[styles.contentCard, { backgroundColor: colors.card }]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                    {page.title}
                  </Text>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Page Content */}
                <View style={styles.contentBody}>
                  {page.blocks && page.blocks.length > 0 ? (
                    <ContentRenderer blocks={page.blocks} />
                  ) : (
                    <FormattedText style={[styles.pageContent, { color: colors.text }]}>
                      {page.content}
                    </FormattedText>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.navButtons, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: colors.border },
            currentPage === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentPage === 0}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={currentPage === 0 ? colors.textMuted : colors.text}
          />
          <Text
            style={[
              styles.navButtonText,
              { color: currentPage === 0 ? colors.textMuted : colors.text },
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.navButtonTextLight}>
            {currentPage === totalPages - 1 ? (hasQuiz ? 'Start Quiz' : 'Finish') : 'Next'}
          </Text>
          <Ionicons
            name={currentPage === totalPages - 1 ? (hasQuiz ? 'school' : 'checkmark') : 'arrow-forward'}
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
  },
  pageScrollContent: {
    padding: 12,
  },
  contentCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  pageIndicator: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: 24,
  },
  contentBody: {
    padding: 24,
  },
  pageContent: {
    fontSize: 17,
    lineHeight: 30,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextLight: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
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
