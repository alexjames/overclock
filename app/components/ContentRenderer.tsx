import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions, TextStyle, Modal, PanResponder, Animated, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ContentBlock, ChartData, ImagePosition, TextAlign } from '../types/course';

interface ContentRendererProps {
  blocks: ContentBlock[];
  onLongPressImage?: (url: string) => void;
}

export function ContentRenderer({ blocks, onLongPressImage }: ContentRendererProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        // Positioned images are absolutely placed — rendered outside normal flow
        if (block.type === 'image' && block.position) {
          const s = block.scale ?? 1;
          const pw = (screenWidth - 72) * s;
          return (
            <View key={index} style={[styles.positionedImageContainer, resolveAbsoluteStyle(block.position)]}>
              <Image source={{ uri: block.url }} style={{ width: pw, height: 200 * s, borderRadius: 12 }} resizeMode="contain" />
              {block.caption && (
                <Text style={[styles.caption, { color: colors.textMuted }]}>{block.caption}</Text>
              )}
            </View>
          );
        }
        return (
          <View key={index} style={block.type === 'image' ? styles.blockContainerImage : styles.blockContainer}>
            {renderBlock(block, colors, onLongPressImage)}
          </View>
        );
      })}
    </View>
  );
}

// Export formatted text component for use elsewhere
interface FormattedTextProps {
  children: string;
  style?: TextStyle | TextStyle[];
}

export function FormattedText({ children, style }: FormattedTextProps) {
  const formattedParts = parseFormatting(children);

  return (
    <Text style={style}>
      {formattedParts.map((part, index) => (
        <Text
          key={index}
          style={[
            part.bold && styles.boldText,
            part.italic && styles.italicText,
            part.color ? { color: part.color } : undefined,
          ]}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

// Shared formatting parser
// Supports: **bold**, *italic*, ***bold+italic***, [text]{#color}
function parseFormatting(text: string) {
  const parts: Array<{ text: string; bold?: boolean; italic?: boolean; color?: string }> = [];
  let currentIndex = 0;

  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\{#[0-9a-fA-F]{3,6}\})/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push({ text: text.substring(currentIndex, match.index) });
    }

    const matchedText = match[0];
    if (matchedText.startsWith('***') && matchedText.endsWith('***')) {
      parts.push({ text: matchedText.slice(3, -3), bold: true, italic: true });
    } else if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      parts.push({ text: matchedText.slice(2, -2), bold: true });
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      parts.push({ text: matchedText.slice(1, -1), italic: true });
    } else {
      // [text]{#color}
      const colorMatch = matchedText.match(/^\[([^\]]+)\]\{(#[0-9a-fA-F]{3,6})\}$/);
      if (colorMatch) {
        parts.push({ text: colorMatch[1], color: colorMatch[2] });
      }
    }

    currentIndex = match.index + matchedText.length;
  }

  if (currentIndex < text.length) {
    parts.push({ text: text.substring(currentIndex) });
  }

  return parts;
}

function renderBlock(block: ContentBlock, colors: any, onLongPressImage?: (url: string) => void) {
  switch (block.type) {
    case 'text':
      return <TextBlock content={block.content} align={block.align} colors={colors} />;
    case 'code':
      return <CodeBlock content={block.content} language={block.language} colors={colors} />;
    case 'image':
      return <ImageBlock url={block.url} caption={block.caption} scale={block.scale} onLongPress={onLongPressImage} colors={colors} />;
    case 'table':
      return <TableBlock headers={block.headers} rows={block.rows} colors={colors} />;
    case 'chart':
      return <ChartBlock chartType={block.chartType} title={block.title} data={block.data} colors={colors} />;
    default:
      return null;
  }
}

// Text Block with formatting support
function TextBlock({ content, align, colors }: { content: string; align?: TextAlign; colors: any }) {
  return <FormattedText style={[styles.text, { color: colors.text, textAlign: align ?? 'left' }]}>{content}</FormattedText>;
}

// Code Block with horizontal/vertical scrolling
function CodeBlock({ content, language, colors }: { content: string; language?: string; colors: any }) {
  return (
    <View style={[styles.codeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {language && (
        <View style={[styles.codeLanguageBadge, { backgroundColor: colors.border }]}>
          <Text style={[styles.codeLanguageText, { color: colors.textSecondary }]}>{language}</Text>
        </View>
      )}
      <ScrollView
        style={styles.codeScrollVertical}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <Text style={[styles.codeText, { color: colors.text }]}>{content}</Text>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

// Maps position string to absolute inset style for a positioned image
function resolveAbsoluteStyle(position: ImagePosition): object {
  const [v, h] = position.split('-');
  const style: Record<string, string | number> = { position: 'absolute' };
  if (v === 'top')    { style.top = 0; }
  if (v === 'bottom') { style.bottom = 0; }
  if (v === 'middle') { style.top = '33%'; style.bottom = '33%'; }
  if (h === 'left')   { style.left = 0; }
  if (h === 'right')  { style.right = 0; }
  if (h === 'center') { style.left = '12.5%'; style.right = '12.5%'; }
  return style;
}

// Image Block (no position — inline flow)
function ImageBlock({ url, caption, scale = 1, onLongPress, colors }: { url: string; caption?: string; scale?: number; onLongPress?: (url: string) => void; colors: any }) {
  const [aspectRatio, setAspectRatio] = React.useState<number | undefined>(undefined);
  const [enlarged, setEnlarged] = React.useState(false);
  const pan = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  React.useEffect(() => {
    Image.getSize(url, (w, h) => {
      if (h > 0) setAspectRatio(w / h);
    });
  }, [url]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setEnlarged(false);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        setEnlarged(false);
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  const baseWidth = (screenWidth - 72) * scale;
  const imageStyle = aspectRatio !== undefined
    ? { width: baseWidth, aspectRatio, borderRadius: 12 }
    : { width: baseWidth, height: 200 * scale, borderRadius: 12 };

  const enlargedWidth = screenWidth - 32;
  const enlargedStyle = aspectRatio !== undefined
    ? { width: enlargedWidth, aspectRatio, borderRadius: 12 }
    : { width: enlargedWidth, height: 260, borderRadius: 12 };

  const handleLongPress = () => {
    pan.setValue({ x: 0, y: 0 });
    if (onLongPress) {
      onLongPress(url);
    } else {
      setEnlarged(true);
    }
  };

  return (
    <View style={styles.imageContainer}>
      <Pressable onLongPress={handleLongPress} delayLongPress={300}>
        <Image source={{ uri: url }} style={imageStyle} resizeMode="contain" />
      </Pressable>
      {caption && (
        <Text style={[styles.caption, { color: colors.textMuted }]}>{caption}</Text>
      )}

      {/* Own modal — only used when not inside PageSlideshow (no onLongPress callback) */}
      <Modal visible={enlarged} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.enlargedOverlay}>
          <Animated.View
            style={[styles.enlargedContainer, { transform: pan.getTranslateTransform() }]}
            {...panResponder.panHandlers}
          >
            <Image source={{ uri: url }} style={enlargedStyle} resizeMode="contain" />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// Table Block
function TableBlock({ headers, rows, colors }: { headers: string[]; rows: string[][]; colors: any }) {
  return (
    <View style={[styles.table, { borderColor: colors.border }]}>
      {/* Header Row */}
      <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.primary + '20' }]}>
        {headers.map((header, index) => (
          <View key={index} style={[styles.tableCell, { borderColor: colors.border }]}>
            <Text style={[styles.tableHeaderText, { color: colors.text }]}>{header}</Text>
          </View>
        ))}
      </View>
      {/* Data Rows */}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.tableRow, { borderColor: colors.border }]}>
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={[styles.tableCell, { borderColor: colors.border }]}>
              <Text style={[styles.tableCellText, { color: colors.text }]}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// Chart Block (Simple Bar/Line/Pie visualization)
function ChartBlock({ chartType, title, data, colors }: { chartType: 'bar' | 'line' | 'pie'; title: string; data: ChartData[]; colors: any }) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <View style={styles.chartContainer}>
      <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>

      {chartType === 'bar' && (
        <View style={styles.barChart}>
          {data.map((item, index) => (
            <View key={index} style={styles.barItem}>
              <Text style={[styles.barLabel, { color: colors.textMuted }]}>{item.label}</Text>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color || colors.primary,
                    },
                  ]}
                />
                <Text style={[styles.barValue, { color: colors.textSecondary }]}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {chartType === 'line' && (
        <View style={styles.lineChart}>
          <View style={[styles.lineChartGrid, { borderColor: colors.border }]}>
            {data.map((item, index) => {
              const height = (item.value / maxValue) * 100;
              return (
                <View key={index} style={styles.linePoint}>
                  <View style={styles.linePointColumn}>
                    <View
                      style={[
                        styles.linePointDot,
                        {
                          bottom: `${height}%`,
                          backgroundColor: item.color || colors.primary,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.linePointBar,
                        {
                          height: `${height}%`,
                          backgroundColor: (item.color || colors.primary) + '30',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.lineLabel, { color: colors.textMuted }]}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {chartType === 'pie' && (
        <View style={styles.pieChart}>
          <View style={styles.pieLegend}>
            {data.map((item, index) => {
              const total = data.reduce((sum, d) => sum + d.value, 0);
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <View key={index} style={styles.pieLegendItem}>
                  <View
                    style={[
                      styles.pieLegendColor,
                      { backgroundColor: item.color || getDefaultColor(index) },
                    ]}
                  />
                  <Text style={[styles.pieLegendText, { color: colors.text }]}>
                    {item.label}: {percentage}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function getDefaultColor(index: number): string {
  const defaultColors = ['#8B5CF6', '#F97316', '#3B82F6', '#10B981', '#EF4444', '#F59E0B'];
  return defaultColors[index % defaultColors.length];
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blockContainer: {
    marginBottom: 16,
  },
  blockContainerImage: {
    marginBottom: 4,
  },
  text: {
    fontSize: 17,
    lineHeight: 30,
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  positionedImageContainer: {
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 2,
  },
  enlargedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth - 72,
    height: 200,
    borderRadius: 12,
  },
  caption: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  table: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableHeader: {
    borderBottomWidth: 2,
  },
  tableCell: {
    flex: 1,
    padding: 10,
    borderRightWidth: 1,
  },
  tableHeaderText: {
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  tableCellText: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartContainer: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  barChart: {
    gap: 12,
  },
  barItem: {
    gap: 4,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    height: 24,
    borderRadius: 4,
    minWidth: 4,
  },
  barValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  lineChart: {
    height: 150,
  },
  lineChartGrid: {
    flex: 1,
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    paddingLeft: 4,
  },
  linePoint: {
    flex: 1,
    alignItems: 'center',
  },
  linePointColumn: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  linePointDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  linePointBar: {
    width: '60%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  lineLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  pieChart: {
    alignItems: 'center',
  },
  pieLegend: {
    gap: 8,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieLegendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  pieLegendText: {
    fontSize: 14,
  },
  codeContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 8,
  },
  codeLanguageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 8,
  },
  codeLanguageText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  codeScrollVertical: {
    maxHeight: 280,
    padding: 14,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
});
