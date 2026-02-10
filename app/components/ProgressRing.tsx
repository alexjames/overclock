import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface ProgressRingProps {
  total: number;
  current: number;
}

export function ProgressRing({ total, current }: ProgressRingProps) {
  const { colors } = useTheme();

  // Calculate text width based on digit count
  const displayText = `${current + 1}/${total}`;
  const charCount = displayText.length;

  // Adaptive sizing: fontSize 10, each char ~6px wide, plus padding
  const fontSize = 10;
  const textWidth = charCount * 6;
  const padding = 6; // Space between text and ring
  const strokeWidth = 3;

  // Size = text width + padding on both sides + stroke on both sides
  const size = textWidth + padding * 2 + strokeWidth * 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (current + 1) / total;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#58CC02"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Center text */}
      <View style={styles.textContainer}>
        <Text style={[styles.text, { color: colors.text, fontSize }]}>
          {displayText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
