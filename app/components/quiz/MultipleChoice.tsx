import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MultipleChoiceQuestion } from '../../types/quiz';

interface MultipleChoiceProps {
  question: MultipleChoiceQuestion;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  isSubmitted: boolean;
}

function shuffleWithIndices<T>(array: T[]): { item: T; originalIndex: number }[] {
  const indexed = array.map((item, originalIndex) => ({ item, originalIndex }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  return indexed;
}

export function MultipleChoice({
  question,
  selectedIndex,
  onSelect,
  isSubmitted,
}: MultipleChoiceProps) {
  const { colors } = useTheme();

  const shuffledOptions = useMemo(() => {
    return shuffleWithIndices(question.options);
  }, [question.options]);

  const getShuffledIndex = (originalIndex: number | null) => {
    if (originalIndex === null) return null;
    return shuffledOptions.findIndex((item) => item.originalIndex === originalIndex);
  };

  const getOptionStyle = (shuffledIndex: number) => {
    const originalIndex = shuffledOptions[shuffledIndex].originalIndex;
    const isSelected = getShuffledIndex(selectedIndex) === shuffledIndex;
    const isCorrect = originalIndex === question.correctAnswerIndex;

    if (!isSubmitted) {
      if (isSelected) {
        return [styles.option, { backgroundColor: colors.primary + '15', borderColor: colors.primary, borderWidth: 2 }];
      }
      return [styles.option, { backgroundColor: colors.surface }];
    }

    if (isCorrect) {
      return [styles.option, { backgroundColor: colors.successLight, borderColor: colors.success, borderWidth: 2 }];
    }
    if (isSelected && !isCorrect) {
      return [styles.option, { backgroundColor: colors.errorLight, borderColor: colors.error, borderWidth: 2 }];
    }
    return [styles.option, { backgroundColor: colors.surface }];
  };

  const getOptionTextStyle = (shuffledIndex: number) => {
    const originalIndex = shuffledOptions[shuffledIndex].originalIndex;
    const isSelected = getShuffledIndex(selectedIndex) === shuffledIndex;
    const isCorrect = originalIndex === question.correctAnswerIndex;

    if (!isSubmitted) {
      return isSelected
        ? [styles.optionText, { color: colors.primary, fontWeight: '500' as const }]
        : [styles.optionText, { color: colors.text }];
    }

    if (isCorrect || (isSelected && !isCorrect)) {
      return [styles.optionText, { color: colors.text, fontWeight: '600' as const }];
    }
    return [styles.optionText, { color: colors.text }];
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.question, { color: colors.text }]}>{question.question}</Text>
      <View style={styles.optionsContainer}>
        {shuffledOptions.map((item, shuffledIndex) => (
          <Pressable
            key={shuffledIndex}
            style={getOptionStyle(shuffledIndex)}
            onPress={() => !isSubmitted && onSelect(item.originalIndex)}
            disabled={isSubmitted}
          >
            <View style={styles.optionContent}>
              <View style={[styles.optionLetter, { backgroundColor: colors.border }]}>
                <Text style={[styles.optionLetterText, { color: colors.textSecondary }]}>
                  {String.fromCharCode(65 + shuffledIndex)}
                </Text>
              </View>
              <Text style={getOptionTextStyle(shuffledIndex)}>{item.item}</Text>
            </View>
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
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderRadius: 16,
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});
