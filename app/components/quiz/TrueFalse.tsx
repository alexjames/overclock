import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { TrueFalseQuestion } from '../../types/quiz';

interface TrueFalseProps {
  question: TrueFalseQuestion;
  selectedAnswer: boolean | null;
  onSelect: (value: boolean) => void;
  isSubmitted: boolean;
}

export function TrueFalse({
  question,
  selectedAnswer,
  onSelect,
  isSubmitted,
}: TrueFalseProps) {
  const { colors } = useTheme();

  const shuffledOptions = useMemo(() => {
    const options = [
      { value: true, label: 'True' },
      { value: false, label: 'False' },
    ];
    return Math.random() < 0.5 ? options : [options[1], options[0]];
  }, []);

  const getButtonStyle = (value: boolean) => {
    const isSelected = selectedAnswer === value;
    const isCorrect = value === question.correctAnswer;

    if (!isSubmitted) {
      if (isSelected) {
        return [styles.button, { backgroundColor: colors.primary + '15', borderColor: colors.primary, borderWidth: 2 }];
      }
      return [styles.button, { backgroundColor: colors.surface }];
    }

    if (isCorrect) {
      return [styles.button, { backgroundColor: colors.successLight, borderColor: colors.success, borderWidth: 2 }];
    }
    if (isSelected && !isCorrect) {
      return [styles.button, { backgroundColor: colors.errorLight, borderColor: colors.error, borderWidth: 2 }];
    }
    return [styles.button, { backgroundColor: colors.surface }];
  };

  const getButtonTextStyle = (value: boolean) => {
    const isSelected = selectedAnswer === value;
    const isCorrect = value === question.correctAnswer;

    if (!isSubmitted) {
      return isSelected
        ? [styles.buttonText, { color: colors.primary }]
        : [styles.buttonText, { color: colors.text }];
    }

    if (isCorrect || (isSelected && !isCorrect)) {
      return [styles.buttonText, { color: colors.text, fontWeight: '700' as const }];
    }
    return [styles.buttonText, { color: colors.text }];
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.question, { color: colors.text }]}>{question.question}</Text>
      <View style={styles.buttonsContainer}>
        {shuffledOptions.map((option) => (
          <Pressable
            key={option.label}
            style={getButtonStyle(option.value)}
            onPress={() => !isSubmitted && onSelect(option.value)}
            disabled={isSubmitted}
          >
            <Text style={getButtonTextStyle(option.value)}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 32,
    lineHeight: 28,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
