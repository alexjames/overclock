import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ContentRenderer, FormattedText } from './ContentRenderer';
import { ProgressRing } from './ProgressRing';
import { CoursePage } from '../types/course';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PageSlideshowProps {
  pages: CoursePage[];
  onComplete: () => void;
}

// Total slides = tutorial + pages + completion
// index 0          = tutorial
// index 1..n       = pages[0..n-1]
// index n+1        = completion

export function PageSlideshow({ pages, onComplete }: PageSlideshowProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const total = pages.length; // number of content slides
  const lastIndex = total + 1; // completion slide index

  // Only show progress ring on content slides (not tutorial or completion)
  const showRing = index > 0 && index <= total;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onComplete}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        {showRing && <ProgressRing total={total} current={index - 1} />}
      </View>

      {/* Slide area */}
      <View style={styles.slideArea}>
        {index === 0 && <TutorialSlide />}
        {index > 0 && index <= total && (
          <ContentSlide page={pages[index - 1]} />
        )}
        {index === lastIndex && (
          <CompletionSlide onDone={onComplete} />
        )}

        {/* Tap zones — hidden on completion slide so only the Done button registers */}
        {index !== lastIndex && (
          <>
            <TouchableOpacity
              style={styles.tapZoneLeft}
              onPress={() => { if (index > 0) setIndex(index - 1); }}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.tapZoneRight}
              onPress={() => { if (index < lastIndex) setIndex(index + 1); }}
              activeOpacity={1}
            />
          </>
        )}
      </View>
    </View>
  );
}

// ─── Tutorial slide ────────────────────────────────────────────────────────────

function TutorialSlide() {
  const { colors } = useTheme();
  return (
    <View style={styles.tutorialContainer}>
      <View style={styles.tutorialZones}>
        {/* Left zone */}
        <View style={styles.tutorialZone}>
          <Ionicons name="arrow-back" size={48} color={colors.textSecondary} />
          <Text style={[styles.tutorialZoneLabel, { color: colors.textSecondary }]}>Tap to go{'\n'}back</Text>
        </View>

        {/* Divider */}
        <View style={[styles.tutorialDivider, { backgroundColor: colors.border }]} />

        {/* Right zone */}
        <View style={styles.tutorialZone}>
          <Ionicons name="arrow-forward" size={48} color={colors.textSecondary} />
          <Text style={[styles.tutorialZoneLabel, { color: colors.textSecondary }]}>Tap to go{'\n'}forward</Text>
        </View>
      </View>

      <View style={styles.tutorialFooter}>
        <View style={[styles.tutorialFooterLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.tutorialFooterText, { color: colors.textMuted }]}>Tap to navigate</Text>
        <View style={[styles.tutorialFooterLine, { backgroundColor: colors.border }]} />
      </View>
    </View>
  );
}

// ─── Content slide ─────────────────────────────────────────────────────────────

function ContentSlide({ page }: { page: CoursePage }) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={styles.contentScroll}
      contentContainerStyle={styles.contentScrollInner}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>{page.title}</Text>
      {page.blocks && page.blocks.length > 0 ? (
        <ContentRenderer blocks={page.blocks} />
      ) : (
        <FormattedText style={[styles.pageContent, { color: colors.text }]}>{page.content}</FormattedText>
      )}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

// ─── Completion slide ──────────────────────────────────────────────────────────

function CompletionSlide({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.completionContainer}>
      <View style={styles.completionIcon}>
        <Ionicons name="checkmark-circle" size={88} color={colors.success} />
      </View>
      <Text style={[styles.completionTitle, { color: colors.text }]}>Section Complete</Text>
      <Text style={[styles.completionSubtitle, { color: colors.textSecondary }]}>You've finished this section.</Text>
      <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.success }]} onPress={onDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideArea: {
    flex: 1,
  },
  tapZoneLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH / 2,
    bottom: 0,
  },
  tapZoneRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: SCREEN_WIDTH / 2,
    bottom: 0,
  },

  // Tutorial
  tutorialContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  tutorialZones: {
    flex: 1,
    flexDirection: 'row',
  },
  tutorialZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  tutorialDivider: {
    width: StyleSheet.hairlineWidth,
  },
  tutorialZoneLabel: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  tutorialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 12,
  },
  tutorialFooterLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  tutorialFooterText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Content slide
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 30,
  },
  pageContent: {
    fontSize: 17,
    lineHeight: 28,
  },

  // Completion
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  completionIcon: {
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  doneButton: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});
