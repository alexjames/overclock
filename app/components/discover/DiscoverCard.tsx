import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiscoverItem } from '../../types/discover';
import { useApiHost } from '../../context/ApiHostContext';

interface DiscoverCardProps {
  item: DiscoverItem;
  onPress: () => void;
}

function estimateReadingMinutes(item: DiscoverItem): number {
  let wordCount = 0;
  for (const slide of item.slides) {
    for (const block of slide.blocks) {
      if (block.type === 'text') {
        wordCount += block.content.split(/\s+/).length;
      }
    }
  }
  // ~200 words per minute, minimum 1 minute
  return Math.max(1, Math.round(wordCount / 200));
}

export function DiscoverCard({ item, onPress }: DiscoverCardProps) {
  const { apiHost } = useApiHost();
  const imageUrl = item.image.startsWith('http') ? item.image : `${apiHost}${item.image}`;
  const readingMinutes = estimateReadingMinutes(item);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text>
        )}
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Ionicons name="layers-outline" size={12} color="#FFFFFF" />
            <Text style={styles.badgeText}>{item.slides.length} slides</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Ionicons name="time-outline" size={12} color="#FFFFFF" />
            <Text style={styles.badgeText}>{readingMinutes} min</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    margin: 16,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
