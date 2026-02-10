import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useApiHost, DEFAULT_API_HOST } from '../../context/ApiHostContext';

type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'auto', label: 'Auto', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const { colors, mode, setThemeMode } = useTheme();
  const { apiHost, setApiHost } = useApiHost();

  const [hostInput, setHostInput] = useState(apiHost);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHostInput(apiHost);
    setHasChanges(false);
  }, [apiHost]);

  const handleHostChange = (text: string) => {
    setHostInput(text);
    setHasChanges(text.trim() !== apiHost);
  };

  const handleSave = async () => {
    const trimmed = hostInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid URL', 'Please enter a valid API host URL.');
      return;
    }
    await setApiHost(trimmed);
    setHasChanges(false);
  };

  const handleReset = () => {
    setHostInput(DEFAULT_API_HOST);
    setHasChanges(DEFAULT_API_HOST !== apiHost);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          </View>

          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
            <View style={[styles.segmentedControl, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {THEME_OPTIONS.map((option) => {
                const isActive = mode === option.mode;
                return (
                  <TouchableOpacity
                    key={option.mode}
                    style={[
                      styles.segment,
                      isActive && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setThemeMode(option.mode)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={18}
                      color={isActive ? 'white' : colors.text}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isActive ? 'white' : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* API Server Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>API Server</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Host URL</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={hostInput}
                onChangeText={handleHostChange}
                placeholder="http://192.168.0.24"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={handleReset}
                >
                  <Ionicons name="refresh-outline" size={18} color={colors.text} />
                  <Text style={[styles.buttonText, { color: colors.text }]}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: hasChanges ? colors.primary : colors.border },
                  ]}
                  onPress={handleSave}
                  disabled={!hasChanges}
                >
                  <Ionicons name="save-outline" size={18} color={hasChanges ? 'white' : colors.textMuted} />
                  <Text
                    style={[
                      styles.buttonText,
                      { color: hasChanges ? 'white' : colors.textMuted },
                    ]}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});
