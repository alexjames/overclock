import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
  Animated,
  PanResponder,
  GestureResponderEvent,
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
  const [enlargedUrl, setEnlargedUrl] = useState<string | null>(null);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const initialPinchDistance = useRef<number | null>(null);
  const slideTouch = useRef<{ x: number; t: number } | null>(null);

  function getPinchDistance(touches: { pageX: number; pageY: number }[]) {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
        initialPinchDistance.current = null;
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const dist = getPinchDistance(touches as any);
          if (initialPinchDistance.current === null) {
            initialPinchDistance.current = dist;
          }
          const newScale = Math.max(0.5, Math.min(5, lastScale.current * (dist / initialPinchDistance.current)));
          scale.setValue(newScale);
        } else {
          initialPinchDistance.current = null;
          Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(evt, gestureState);
        }
      },
      onPanResponderRelease: () => {
        lastScale.current = (scale as any)._value;
        pan.flattenOffset();
        initialPinchDistance.current = null;
      },
      onPanResponderTerminate: () => {
        lastScale.current = (scale as any)._value;
        pan.flattenOffset();
        initialPinchDistance.current = null;
      },
    })
  ).current;

  const handleLongPressImage = (url: string) => {
    pan.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    lastScale.current = 1;
    setEnlargedUrl(url);
  };

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

      {/* Slide area — touch handler on the container detects taps vs long presses */}
      <View
        style={styles.slideArea}
        onTouchStart={(e) => {
          if (index === lastIndex) return;
          slideTouch.current = { x: e.nativeEvent.pageX, t: Date.now() };
        }}
        onTouchEnd={(e) => {
          if (index === lastIndex) return;
          const s = slideTouch.current;
          if (!s) return;
          const duration = Date.now() - s.t;
          const dx = Math.abs(e.nativeEvent.pageX - s.x);
          const dy = Math.abs(e.nativeEvent.pageY - (e.nativeEvent.pageY));
          // Only navigate on a quick short tap
          if (duration < 300 && dx < 10) {
            if (s.x < SCREEN_WIDTH / 2) {
              if (index > 0) setIndex(index - 1);
            } else {
              if (index < lastIndex) setIndex(index + 1);
            }
          }
          slideTouch.current = null;
        }}
      >
        {index === 0 && <TutorialSlide />}
        {index > 0 && index <= total && (
          <ContentSlide page={pages[index - 1]} onLongPressImage={handleLongPressImage} />
        )}
        {index === lastIndex && (
          <CompletionSlide onDone={onComplete} />
        )}
      </View>

      {/* Enlarged image modal — rendered at PageSlideshow level to sit above tap zones */}
      <Modal visible={!!enlargedUrl} transparent={false} animationType="fade" statusBarTranslucent>
        <View style={styles.enlargedOverlay} {...panResponder.panHandlers}>
          <TouchableOpacity
            style={[styles.enlargedClose, { top: insets.top + 12 }]}
            onPress={() => { setEnlargedUrl(null); pan.setValue({ x: 0, y: 0 }); scale.setValue(1); lastScale.current = 1; }}
          >
            <Ionicons name="close" size={22} color="#000" />
          </TouchableOpacity>
          <Animated.View style={{ transform: [...pan.getTranslateTransform(), { scale }] }}>
            {enlargedUrl && (
              <Image
                source={{ uri: enlargedUrl }}
                style={{ width: SCREEN_WIDTH - 32, height: undefined, aspectRatio: 16 / 9, borderRadius: 12 }}
                resizeMode="contain"
              />
            )}
          </Animated.View>
        </View>
      </Modal>
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

function ContentSlide({ page, onLongPressImage }: { page: CoursePage; onLongPressImage?: (url: string) => void }) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={styles.contentScroll}
      contentContainerStyle={styles.contentScrollInner}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>{page.title}</Text>
      {page.blocks && page.blocks.length > 0 ? (
        <ContentRenderer blocks={page.blocks} onLongPressImage={onLongPressImage} />
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
  enlargedOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedClose: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
