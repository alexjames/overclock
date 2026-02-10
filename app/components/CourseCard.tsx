import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Course } from '../types/course';

const CARD_WIDTH = (Dimensions.get('window').width - 48 - 16) / 2;

interface CourseCardProps {
  course: Course;
  onPress: () => void;
}

export function CourseCard({ course, onPress }: CourseCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.container}>
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
    width: CARD_WIDTH,
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
