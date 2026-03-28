import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Course } from '../types/course';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 48 - 16) / 2;
// Show 2 full cards + ~1/3 of a third peeking: left padding=24, gap=16 between cards
// total space for 2.4 card-widths = SCREEN_WIDTH - 24 (left pad) - 2*16 (two gaps)
const HORIZONTAL_CARD_WIDTH = Math.floor((SCREEN_WIDTH - 24 - 32) / 2.4);

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  variant?: 'grid' | 'horizontal';
}

export function CourseCard({ course, onPress, variant = 'grid' }: CourseCardProps) {
  const { colors } = useTheme();
  const isHorizontal = variant === 'horizontal';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { width: isHorizontal ? HORIZONTAL_CARD_WIDTH : GRID_CARD_WIDTH }]}
    >
      <View style={[styles.imageContainer, { backgroundColor: course.color }]}>
        <Ionicons
          name={course.icon as any}
          size={48}
          color="white"
        />
      </View>
      <View style={[styles.content, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {course.title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
    minHeight: 70,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
