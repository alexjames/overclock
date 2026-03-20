import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ContentRenderer, FormattedText } from './ContentRenderer';
import { CoursePage } from '../types/course';

interface PageViewerProps {
  title: string;
  color: string;
  pages: CoursePage[];
  hasQuiz?: boolean;
  onComplete: () => void;
  onStartQuiz?: () => void;
}

export function PageViewer({ title, color, pages, hasQuiz, onComplete, onStartQuiz }: PageViewerProps) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const total = pages.length;
  const page = pages[index];
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const goBack = () => {
    if (!isFirst) {
      setIndex(index - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const goForward = () => {
    if (!isLast) {
      setIndex(index + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Top bar — matches discover */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onComplete} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.progress, { color: colors.textMuted }]}>
          {index + 1}/{total}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              width: `${((index + 1) / total) * 100}%`,
            },
          ]}
        />
      </View>

      {/* Page content in card */}
      <ScrollView
        ref={scrollRef}
        style={styles.slideScroll}
        contentContainerStyle={styles.slideScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.slideCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.slideTitle, { color: color }]}>
            {page.title}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.slideBody}>
            {page.blocks && page.blocks.length > 0 ? (
              <ContentRenderer blocks={page.blocks} />
            ) : (
              <FormattedText style={[styles.pageContent, { color: colors.text }]}>{page.content}</FormattedText>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom nav bar */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: isFirst ? colors.border : colors.surface, borderColor: colors.border }]}
          onPress={goBack}
          disabled={isFirst}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={isFirst ? colors.textMuted : colors.text} />
          <Text style={[styles.navButtonText, { color: isFirst ? colors.textMuted : colors.text }]}>Previous</Text>
        </TouchableOpacity>

        {isLast && hasQuiz && onStartQuiz ? (
          <TouchableOpacity
            style={[styles.navButton, styles.primaryButton, { backgroundColor: color }]}
            onPress={onStartQuiz}
            activeOpacity={0.7}
          >
            <Text style={[styles.navButtonText, { color: 'white' }]}>Start Quiz</Text>
            <Ionicons name="school" size={20} color="white" />
          </TouchableOpacity>
        ) : isLast ? (
          <TouchableOpacity
            style={[styles.navButton, styles.primaryButton, { backgroundColor: colors.success }]}
            onPress={onComplete}
            activeOpacity={0.7}
          >
            <Text style={[styles.navButtonText, { color: 'white' }]}>Done</Text>
            <Ionicons name="checkmark" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.primaryButton, { backgroundColor: color }]}
            onPress={goForward}
            activeOpacity={0.7}
          >
            <Text style={[styles.navButtonText, { color: 'white' }]}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  progress: {
    fontSize: 14,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  progressBar: {
    height: 3,
  },
  progressFill: {
    height: '100%',
  },
  slideScroll: {
    flex: 1,
  },
  slideScrollContent: {
    padding: 12,
  },
  slideCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    marginHorizontal: 24,
  },
  slideBody: {
    padding: 24,
  },
  pageContent: {
    fontSize: 17,
    lineHeight: 28,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  primaryButton: {
    borderWidth: 0,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
