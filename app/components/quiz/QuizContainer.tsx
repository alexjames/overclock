import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Question, QuestionFormat, QuizResult } from '../../types/quiz';
import { MultipleChoice } from './MultipleChoice';
import { TrueFalse } from './TrueFalse';

interface QuizContainerProps {
  questions: Question[];
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}

export function QuizContainer({ questions, onComplete, onExit }: QuizContainerProps) {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnswer = answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== null;

  const handleSelect = (value: any) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const checkAnswer = (): boolean => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.format === QuestionFormat.MULTIPLE_CHOICE) {
      return answer === currentQuestion.correctAnswerIndex;
    } else if (currentQuestion.format === QuestionFormat.TRUE_FALSE) {
      return answer === currentQuestion.correctAnswer;
    }
    return false;
  };

  const handleSubmit = () => {
    const isCorrect = checkAnswer();
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const finalCorrect = correctCount + (checkAnswer() && !isSubmitted ? 1 : 0);
      onComplete({
        totalQuestions: questions.length,
        correctAnswers: isSubmitted ? correctCount : finalCorrect,
        percentage: Math.round(((isSubmitted ? correctCount : finalCorrect) / questions.length) * 100),
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setIsSubmitted(false);
    }
  };

  const renderQuestion = () => {
    switch (currentQuestion.format) {
      case QuestionFormat.MULTIPLE_CHOICE:
        return (
          <MultipleChoice
            question={currentQuestion}
            selectedIndex={answers[currentQuestion.id] ?? null}
            onSelect={handleSelect}
            isSubmitted={isSubmitted}
          />
        );
      case QuestionFormat.TRUE_FALSE:
        return (
          <TrueFalse
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id] ?? null}
            onSelect={handleSelect}
            isSubmitted={isSubmitted}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Question content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuestion()}

        {/* Explanation after submit */}
        {isSubmitted && currentQuestion.explanation && (
          <View style={[styles.explanationCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.explanationTitle, { color: colors.primary }]}>Explanation</Text>
            <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
              {currentQuestion.explanation}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomBar}>
        {!isSubmitted ? (
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: hasAnswer ? colors.primary : colors.border },
            ]}
            onPress={handleSubmit}
            disabled={!hasAnswer}
          >
            <Text style={[styles.buttonText, { color: hasAnswer ? 'white' : colors.textMuted }]}>
              Check Answer
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>
              {isLastQuestion ? 'See Results' : 'Next Question'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  explanationCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bottomBar: {
    padding: 24,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
