import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../theme';
import { sans, sansMedium } from '../fonts';
import { RatingResult } from '../types';

type Props = { result: RatingResult; imageUri?: string };

function scoreColor(score: number): string {
  if (score >= 8) return theme.scoreHi;
  if (score >= 6) return theme.scoreMid;
  return theme.scoreLo;
}

function scoreBg(score: number): string {
  if (score >= 8) return '#E8F6EC';
  if (score >= 6) return '#FDF3E2';
  return '#FBE9E7';
}

function scoreGrade(score: number): string {
  if (score >= 9) return 'A+';
  if (score >= 8) return 'A';
  if (score >= 7) return 'B+';
  if (score >= 6) return 'B';
  if (score >= 5) return 'C+';
  if (score >= 4) return 'C';
  return 'D';
}

const DIM_COLORS: Record<string, string> = {
  '色彩': '#5B5BD6',
  '版型': '#0EA5E9',
  '层次': '#A8765A',
  '风格': '#16A34A',
  '合身': '#DC2626',
};
function dimColor(name: string): string {
  return DIM_COLORS[name] || '#5B5BD6';
}

export default function ResultView({ result, imageUri }: Props) {
  const overall = typeof result.overall === 'number' && !isNaN(result.overall) ? result.overall : 0;
  const hasValidOverall = typeof result.overall === 'number' && !isNaN(result.overall) && result.overall > 0;
  const [showRaw, setShowRaw] = React.useState(false);

  const [openDimensions, setOpenDimensions] = React.useState(true);
  const [openItems, setOpenItems] = React.useState(false);
  // 亮点、待改进默认收起（用户最关心的是"怎么改"，不是"哪里好"）
  const [openPros, setOpenPros] = React.useState(false);
  const [openCons, setOpenCons] = React.useState(false);
  // 改造建议默认展开（最实用、最常看）
  const [openSuggestions, setOpenSuggestions] = React.useState(true);

  const onCopy = async () => {
    if (!result.raw) return;
    await Clipboard.setStringAsync(result.raw);
  };

  return (
    <View>
      {/* ====== Hero：上下结构 ====== */}
      <View style={[styles.heroCard, { backgroundColor: scoreBg(overall) }]}>
        {/* 上：分数居中 */}
        <View style={styles.heroScoreBlock}>
          <View style={styles.heroScoreLine}>
            <Text style={[styles.heroScore, { color: scoreColor(overall) }]}>
              {overall.toFixed(1)}
            </Text>
            <Text style={styles.heroMax}>/10</Text>
            <View style={[styles.gradePill, { backgroundColor: scoreColor(overall) }]}>
              <Text style={styles.gradeText}>{scoreGrade(overall)}</Text>
            </View>
          </View>
        </View>
        {/* 下：标题 + 摘要 */}
        {!!result.title && <Text style={styles.heroTitle}>{result.title}</Text>}
        {!!result.summary && <Text style={styles.heroSummary}>{result.summary}</Text>}
      </View>

      {/* ====== 维度评分：简洁进度条 ====== */}
      {!!result.dimensions?.length && (
        <FoldCard
          title="维度评分"
          count={result.dimensions.length}
          open={openDimensions}
          onToggle={() => setOpenDimensions(!openDimensions)}
        >
          {result.dimensions.map((d, i) => (
            <View key={i} style={styles.dimRow}>
              <Text style={styles.dimName}>{d.name}</Text>
              <View style={styles.dimBarBg}>
                <View
                  style={[
                    styles.dimBarFill,
                    {
                      width: `${Math.max(0, Math.min(10, d.score)) * 10}%`,
                      backgroundColor: scoreColor(d.score),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dimScore, { color: scoreColor(d.score) }]}>
                {d.score?.toFixed?.(1)}
              </Text>
            </View>
          ))}
          {/* 下方一行评语总览 */}
          {result.dimensions.some((d) => d.comment) && (
            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderSoft }}>
              {result.dimensions.map((d, i) => (
                d.comment ? (
                  <View key={i} style={styles.dimCommentRow}>
                    <Text style={styles.dimCommentName}>{d.name}</Text>
                    <Text style={styles.dimCommentText}>{d.comment}</Text>
                  </View>
                ) : null
              ))}
            </View>
          )}
        </FoldCard>
      )}

      {/* ====== 单品识别 ====== */}
      {!!result.outfit_items?.length && (
        <FoldCard
          title="识别到的单品"
          count={result.outfit_items.length}
          open={openItems}
          onToggle={() => setOpenItems(!openItems)}
        >
          <View style={styles.chipRow}>
            {result.outfit_items.map((it, i) => (
              <View key={i} style={[styles.chip, { borderLeftColor: chipColor(i) }]}>
                <Text style={styles.chipText}>{it}</Text>
              </View>
            ))}
          </View>
        </FoldCard>
      )}

      {/* ====== 亮点：彩色左边条 + 浅色背景 ====== */}
      {!!result.pros?.length && (
        <FoldCard
          title="亮点"
          accent={theme.success}
          count={result.pros.length}
          open={openPros}
          onToggle={() => setOpenPros(!openPros)}
        >
          {result.pros.map((p, i) => (
            <View key={i} style={[styles.textCard, styles.textCardPros]}>
              <Text style={[styles.textCardSign, { color: theme.success }]}>＋</Text>
              <Text style={styles.textCardText}>{p}</Text>
            </View>
          ))}
        </FoldCard>
      )}

      {/* ====== 待改进 ====== */}
      {!!result.cons?.length && (
        <FoldCard
          title="待改进"
          accent={theme.danger}
          count={result.cons.length}
          open={openCons}
          onToggle={() => setOpenCons(!openCons)}
        >
          {result.cons.map((p, i) => (
            <View key={i} style={[styles.textCard, styles.textCardCons]}>
              <Text style={[styles.textCardSign, { color: theme.danger }]}>－</Text>
              <Text style={styles.textCardText}>{p}</Text>
            </View>
          ))}
        </FoldCard>
      )}

      {/* ====== 改造建议（默认展开） ====== */}
      {!!result.suggestions?.length && (
        <FoldCard
          title="改造建议"
          accent={theme.brand}
          count={result.suggestions.length}
          open={openSuggestions}
          onToggle={() => setOpenSuggestions(!openSuggestions)}
        >
          {result.suggestions.map((p, i) => (
            <View key={i} style={[styles.textCard, styles.textCardSug]}>
              <Text style={styles.textCardText}>{p}</Text>
            </View>
          ))}
        </FoldCard>
      )}

      {!!result.raw && (
        <Pressable onPress={() => setShowRaw(true)} style={styles.debugBtn}>
          <Text style={styles.debugText}>⌥  查看模型原始返回</Text>
        </Pressable>
      )}

      <Modal visible={showRaw} animationType="slide" onRequestClose={() => setShowRaw(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>模型原始返回</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={onCopy} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>复制</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowRaw(false)} style={[styles.modalBtn, styles.modalBtnDark]}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>关闭</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.modalText} selectable>
              {result.raw}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function FoldCard({
  title, count, accent, open, onToggle, children,
}: {
  title: string;
  count?: number;
  accent?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.foldCard}>
      <Pressable onPress={onToggle} style={styles.foldHeader} hitSlop={8}>
        <View style={styles.foldLeft}>
          {!!accent && <View style={[styles.foldDot, { backgroundColor: accent }]} />}
          <Text style={styles.foldTitle}>{title}</Text>
          {typeof count === 'number' && (
            <View style={[styles.foldBadge, accent && { backgroundColor: accent + '15' }]}>
              <Text style={[styles.foldBadgeText, accent && { color: accent }]}>{count}</Text>
            </View>
          )}
        </View>
        <Text style={styles.foldChevron}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open && <View style={styles.foldBody}>{children}</View>}
    </View>
  );
}

const PALETTE = ['#5B5BD6', '#0EA5E9', '#A8765A', '#16A34A', '#DC2626'];
function chipColor(i: number) {
  return PALETTE[i % PALETTE.length];
}

const styles = StyleSheet.create({
  // hero：上下结构（分数居中 + 标题 + 摘要）
  heroCard: {
    borderRadius: theme.radius,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  heroScoreBlock: { alignItems: 'center', marginBottom: 14 },
  heroScoreLine: { flexDirection: 'row', alignItems: 'center' },
  heroScore: { fontFamily: sansMedium, fontSize: 42, letterSpacing: -1 },
  heroMax: { fontFamily: sans, fontSize: 14, color: theme.inkMuted, marginLeft: 6, marginRight: 12 },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: { fontFamily: sansMedium, color: '#fff', fontSize: 11, letterSpacing: 0.5 },
  heroTitle: { fontFamily: sansMedium, fontSize: 15, color: theme.ink, lineHeight: 21, textAlign: 'center' },
  heroSummary: { fontFamily: sans, fontSize: 12, color: theme.inkSoft, marginTop: 6, lineHeight: 18, textAlign: 'center' },

  // 维度：单行进度条
  dimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  dimName: { fontFamily: sans, fontSize: 13, color: theme.ink, width: 32 },
  dimBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: theme.borderSoft,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dimBarFill: { height: 6, borderRadius: 3 },
  dimScore: { fontFamily: sansMedium, fontSize: 14, width: 32, textAlign: 'right' },

  // 维度评语行（紧凑版）
  dimCommentRow: { flexDirection: 'row', paddingVertical: 3 },
  dimCommentName: { fontFamily: sansMedium, fontSize: 11, color: theme.inkMuted, width: 32 },
  dimCommentText: { flex: 1, fontFamily: sans, fontSize: 11, color: theme.inkSoft, lineHeight: 15 },

  // 文字卡：彩色左边条 + 浅色整卡背景（核心：让文字"跳出来"）
  textCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  textCardPros: { backgroundColor: '#F1F8F2', borderLeftColor: theme.success },
  textCardCons: { backgroundColor: '#FDEDEA', borderLeftColor: theme.danger },
  textCardSug: { backgroundColor: '#EEEEFB', borderLeftColor: theme.brand },
  textCardSign: {
    fontFamily: sansMedium,
    fontSize: 14,
    marginRight: 12,
    marginTop: 1,
    width: 16,
    textAlign: 'center',
  },
  textCardText: { flex: 1, fontFamily: sansMedium, fontSize: 14, color: theme.ink, lineHeight: 21 },

  // 单品 chip
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.bg,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  chipText: { fontFamily: sans, fontSize: 12, color: theme.ink },

  // 折叠
  foldCard: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  foldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  foldLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  foldDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  foldTitle: { fontFamily: sansMedium, fontSize: 14, color: theme.ink },
  foldBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: theme.bg,
  },
  foldBadgeText: { fontFamily: sansMedium, fontSize: 11, color: theme.inkMuted },
  foldChevron: { fontFamily: sans, fontSize: 16, color: theme.inkMuted, marginLeft: 8 },
  foldBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.borderSoft,
    paddingTop: 12,
  },

  debugBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  debugText: { fontFamily: sans, fontSize: 12, color: theme.inkMuted },

  // modal
  modalWrap: { flex: 1, backgroundColor: theme.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: theme.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  modalTitle: { fontFamily: sansMedium, fontSize: 17, color: theme.ink },
  modalBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.card,
  },
  modalBtnDark: { backgroundColor: theme.ink, borderColor: theme.ink },
  modalBtnText: { fontFamily: sansMedium, fontSize: 13, color: theme.ink },
  modalBody: { flex: 1, padding: 20 },
  modalText: { fontFamily: sans, fontSize: 13, color: theme.ink, lineHeight: 19 },
});