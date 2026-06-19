import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import { sans, sansMedium } from '../fonts';
import { loadConfig, addHistory, AppConfig } from '../lib/storage';
import { rateOutfit, Mode } from '../lib/api';
import { compressForAI } from '../lib/image';
import { RatingResult } from '../types';
import ResultView from '../components/ResultView';

type Props = { onOpenSettings: () => void };

type PickedImage = {
  uri: string;
  aiUri: string;
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  width: number;
  height: number;
};

async function pickImage(source: 'camera' | 'library'): Promise<PickedImage | null> {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('需要权限', source === 'camera' ? '请在系统设置中允许使用相机' : '请允许访问相册');
    return null;
  }
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: false, exif: false })
      : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: false,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          exif: false,
        });

  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  const compressed = await compressForAI(a.uri);
  return {
    uri: a.uri,
    aiUri: compressed.uri,
    base64: compressed.base64,
    mediaType: compressed.mediaType,
    width: compressed.width,
    height: compressed.height,
  };
}

export default function HomeScreen({ onOpenSettings }: Props) {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RatingResult | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [mode, setMode] = useState<Mode>('quick');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  const reset = () => {
    setImage(null);
    setResult(null);
    setErrorMsg(null);
    controllerRef.current?.abort();
    controllerRef.current = null;
  };

  const onPickCamera = async () => {
    try {
      const img = await pickImage('camera');
      if (img) {
        reset();
        setImage(img);
      }
    } catch (e: any) {
      Alert.alert('拍照失败', String(e?.message ?? e));
    }
  };
  const onPickLibrary = async () => {
    try {
      const img = await pickImage('library');
      if (img) {
        reset();
        setImage(img);
      }
    } catch (e: any) {
      Alert.alert('选图失败', String(e?.message ?? e));
    }
  };

  const onSubmit = async () => {
    if (!image) return;
    if (!config?.apiKey) {
      Alert.alert('还没配 API', '请先在右上角设置里填 API URL、Key 和模型', [
        { text: '去设置', onPress: onOpenSettings },
      ]);
      return;
    }
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const r = await rateOutfit({
        config,
        imageBase64: image.base64,
        mediaType: image.mediaType,
        mode,
        signal: controller.signal,
      });
      setResult(r);
      await addHistory({
        id: String(Date.now()),
        createdAt: Date.now(),
        result: r,
        thumbUri: image.aiUri,
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setErrorMsg(String(e?.message ?? e));
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  const onCancel = () => {
    controllerRef.current?.abort();
  };

  const hasConfig = !!config?.apiKey;
  const showResult = !!result && !loading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.nav}>
        <View>
          <Text style={styles.navTitle}>OutfitIQ</Text>
          <Text style={styles.navSub}>AI 帮你看清今天的搭配</Text>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={onOpenSettings} activeOpacity={0.7}>
          <Text style={styles.navBtnText}>{hasConfig ? '⚙︎' : '⚙ 设置'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.previewWrap}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.previewEmpty}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconEmoji}>✨</Text>
              </View>
              <Text style={styles.emptyTitle}>记录今天的搭配</Text>
              <Text style={styles.emptySub}>拍一张 or 从相册选一张</Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.loadingText}>{mode === 'quick' ? '快速评分中…' : '详细分析中…'}</Text>
              <Text style={styles.loadingHint}>通常 3-8 秒</Text>
              <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.modeRow}>
          <ModeChip active={mode === 'quick'} onPress={() => setMode('quick')} label="快速" hint="4 维度" />
          <ModeChip active={mode === 'full'} onPress={() => setMode('full')} label="详细" hint="5 维度 · 更慢" />
        </View>

        <View style={styles.btnRow}>
          {!image ? (
            <>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onPickCamera} disabled={loading}>
                <Text style={styles.btnPrimaryText}>拍照</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onPickLibrary} disabled={loading}>
                <Text style={styles.btnSecondaryText}>从相册选</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={[styles.btn, styles.btnPrimary, loading && { opacity: 0.6 }]}
                onPress={onSubmit}
                disabled={loading}
              >
                <Text style={styles.btnPrimaryText}>{mode === 'quick' ? '快速评分' : '详细评分'}</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnSecondary]}
                onPress={reset}
                disabled={loading}
              >
                <Text style={styles.btnSecondaryText}>换一张</Text>
              </Pressable>
            </>
          )}
        </View>

        {errorMsg && !loading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>评分失败</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Pressable style={styles.errorBtn} onPress={onSubmit}>
              <Text style={styles.errorBtnText}>重试</Text>
            </Pressable>
          </View>
        )}

        {showResult && (
          <View style={{ marginTop: theme.spacing(2.5) }}>
            <ResultView result={result!} imageUri={image?.aiUri} />
            <View style={styles.againWrap}>
              <Pressable style={styles.againBtn} onPress={onPickCamera}>
                <Text style={styles.againText}>拍下一张</Text>
              </Pressable>
              <Pressable style={[styles.againBtn, styles.againBtnAlt]} onPress={onPickLibrary}>
                <Text style={[styles.againText, { color: theme.ink }]}>从相册选</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: theme.spacing(8) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeChip({ active, onPress, label, hint }: { active: boolean; onPress: () => void; label: string; hint: string }) {
  return (
    <Pressable style={[styles.modeChip, active && styles.modeChipActive]} onPress={onPress}>
      <Text style={[styles.modeLabel, active && { color: '#fff' }]}>{label}</Text>
      <Text style={[styles.modeHint, active && { color: 'rgba(255,255,255,0.7)' }]}>{hint}</Text>
    </Pressable>
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
  navTitle: { fontFamily: sansMedium, fontSize: 22, color: theme.ink, letterSpacing: -0.3 },
  navSub: { fontFamily: sans, fontSize: 12, color: theme.inkMuted, marginTop: 2 },
  navBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: theme.card, borderRadius: 999,
    borderWidth: 1, borderColor: theme.border,
  },
  navBtnText: { fontFamily: sansMedium, fontSize: 13, color: theme.ink },

  scroll: { paddingHorizontal: 20 },

  previewWrap: {
    backgroundColor: theme.card, borderRadius: theme.radiusLg,
    overflow: 'hidden', aspectRatio: 3 / 4,
    borderWidth: 1, borderColor: theme.border,
    position: 'relative',
  },
  previewImage: { width: '100%', height: '100%' },
  previewEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: theme.brandSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyIconEmoji: { fontSize: 32 },
  emptyTitle: { fontFamily: sansMedium, fontSize: 17, color: theme.ink },
  emptySub: { fontFamily: sans, fontSize: 13, color: theme.inkMuted, marginTop: 6 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  loadingText: { fontFamily: sansMedium, color: '#fff', fontSize: 14, marginTop: 12 },
  cancelBtn: {
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  cancelText: { fontFamily: sans, color: '#fff', fontSize: 13 },

  // loading
  loadingHint: { fontFamily: sans, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  // 模式
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modeChip: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, backgroundColor: theme.card,
    borderWidth: 1, borderColor: theme.border,
  },
  modeChipActive: { backgroundColor: theme.ink, borderColor: theme.ink },
  modeLabel: { fontFamily: sansMedium, fontSize: 14, color: theme.ink },
  modeHint: { fontFamily: sans, fontSize: 11, color: theme.inkMuted, marginTop: 2 },

  // 主按钮
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: theme.ink },
  btnPrimaryText: { fontFamily: sansMedium, color: '#fff', fontSize: 15 },
  btnSecondary: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  btnSecondaryText: { fontFamily: sansMedium, color: theme.ink, fontSize: 15 },

  // 再来一次
  againWrap: { flexDirection: 'row', gap: 10, marginTop: 20 },
  againBtn: {
    flex: 1,
    backgroundColor: theme.ink,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  againBtnAlt: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  againText: {
    fontFamily: sansMedium,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    includeFontPadding: false,
  },

  // 错误
  errorCard: {
    marginTop: 16,
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.danger,
  },
  errorTitle: { fontFamily: sansMedium, fontSize: 14, color: theme.danger, marginBottom: 6 },
  errorText: { fontFamily: sans, fontSize: 13, color: theme.inkSoft, lineHeight: 18 },
  errorBtn: {
    marginTop: 12, alignSelf: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, backgroundColor: theme.ink,
  },
  errorBtnText: { fontFamily: sansMedium, color: '#fff', fontSize: 13 },
});
