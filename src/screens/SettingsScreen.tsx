import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { sans, sansMedium } from '../fonts';
import { AppConfig } from '../types';
import { loadConfig, saveConfig } from '../lib/storage';

type Props = { onClose: () => void };

const PRESET_BASE_URLS = [
  { label: 'Anthropic', url: 'https://api.anthropic.com' },
  { label: 'OpenAI', url: 'https://api.openai.com' },
  { label: '自建代理', url: '' },
];

const PRESET_MODELS = ['claude-sonnet-4-5', 'claude-opus-4-1', 'gpt-4o', 'gpt-4o-mini'];

export default function SettingsScreen({ onClose }: Props) {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [useStream, setUseStream] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig().then((c) => {
      setApiUrl(c.apiUrl);
      setApiKey(c.apiKey);
      setModel(c.model);
      setUseStream(c.useStream !== false);
    });
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      const cfg: AppConfig = {
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim(),
        model: model.trim(),
        useStream,
      };
      await saveConfig(cfg);
      Alert.alert('已保存', '设置已保存', [{ text: '好', onPress: onClose }]);
    } catch (e: any) {
      Alert.alert('保存失败', String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>设置</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>把模型接进来 · Key 只存在本机</Text>

          <Field label="API Base URL">
            <TextInput
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="https://api.anthropic.com"
              placeholderTextColor={theme.inkMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
            />
            <View style={styles.chipRow}>
              {PRESET_BASE_URLS.map((p) => (
                <TouchableOpacity key={p.label} style={styles.chip} onPress={() => setApiUrl(p.url)}>
                  <Text style={styles.chipText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="API Key">
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-ant-..."
              placeholderTextColor={theme.inkMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={styles.input}
            />
          </Field>

          <Field label="Model">
            <TextInput
              value={model}
              onChangeText={setModel}
              placeholder="claude-sonnet-4-5"
              placeholderTextColor={theme.inkMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <View style={styles.chipRow}>
              {PRESET_MODELS.map((m) => (
                <TouchableOpacity key={m} style={styles.chip} onPress={() => setModel(m)}>
                  <Text style={styles.chipText}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>流式输出</Text>
              <Text style={styles.toggleHint}>开 = 打字机式实时反馈；关 = 等完整结果（部分代理不支持 SSE）</Text>
            </View>
            <Switch value={useStream} onValueChange={setUseStream} />
          </View>

          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? '保存中…' : '保存'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: { width: 50 },
  backText: { fontFamily: sans, fontSize: 15, color: theme.brand },
  navTitle: { fontFamily: sansMedium, fontSize: 17, color: theme.ink },

  content: { padding: 20 },
  intro: { fontFamily: sans, fontSize: 13, color: theme.inkMuted, marginBottom: 24 },

  field: { marginBottom: 20 },
  fieldLabel: { fontFamily: sansMedium, fontSize: 13, color: theme.ink, marginBottom: 8 },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: sans,
    fontSize: 15,
    color: theme.ink,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
  },
  chipText: { fontFamily: sans, fontSize: 12, color: theme.ink },

  saveBtn: {
    backgroundColor: theme.ink,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: { fontFamily: sansMedium, color: '#fff', fontSize: 15 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggleLabel: { fontFamily: sansMedium, fontSize: 14, color: theme.ink },
  toggleHint: { fontFamily: sans, fontSize: 11, color: theme.inkMuted, marginTop: 2, lineHeight: 15 },
});
