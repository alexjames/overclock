import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ContentBlock, ChartData } from '../types/course';

interface ContentRendererProps {
  blocks: ContentBlock[];
}

export function ContentRenderer({ blocks }: ContentRendererProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => (
        <View key={index} style={styles.blockContainer}>
          {renderBlock(block, colors)}
        </View>
      ))}
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
          ]}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

// Shared formatting parser
function parseFormatting(text: string) {
  const parts: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];
  let currentIndex = 0;

  // Regex to match **bold**, *italic*, or ***bold+italic***
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push({ text: text.substring(currentIndex, match.index) });
    }

    const matchedText = match[0];
    if (matchedText.startsWith('***') && matchedText.endsWith('***')) {
      // Bold + Italic
      parts.push({
        text: matchedText.slice(3, -3),
        bold: true,
        italic: true,
      });
    } else if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      // Bold
      parts.push({
        text: matchedText.slice(2, -2),
        bold: true,
      });
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      // Italic
      parts.push({
        text: matchedText.slice(1, -1),
        italic: true,
      });
    }

    currentIndex = match.index + matchedText.length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push({ text: text.substring(currentIndex) });
  }

  return parts;
}

function renderBlock(block: ContentBlock, colors: any) {
  switch (block.type) {
    case 'text':
      return <TextBlock content={block.content} colors={colors} />;
    case 'image':
      return <ImageBlock url={block.url} caption={block.caption} colors={colors} />;
    case 'table':
      return <TableBlock headers={block.headers} rows={block.rows} colors={colors} />;
    case 'chart':
      return <ChartBlock chartType={block.chartType} title={block.title} data={block.data} colors={colors} />;
    default:
      return null;
  }
}

// Text Block with formatting support
function TextBlock({ content, colors }: { content: string; colors: any }) {
  return <FormattedText style={[styles.text, { color: colors.text }]}>{content}</FormattedText>;
}

// Image Block
function ImageBlock({ url, caption, colors }: { url: string; caption?: string; colors: any }) {
  return (
    <View style={styles.imageContainer}>
      <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
      {caption && (
        <Text style={[styles.caption, { color: colors.textMuted }]}>{caption}</Text>
      )}
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
  imageContainer: {
    alignItems: 'center',
    marginVertical: 8,
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
});
