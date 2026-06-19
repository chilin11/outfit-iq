import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';

/** 单颗五角星，支持按 fillRatio (0-1) 填充 */
function Star({ size = 14, fillRatio = 0, color = '#E0A030' }: { size?: number; fillRatio?: number; color?: string }) {
  // 五角星顶点坐标（中心 12,12，半径 10 居中到 viewBox 24）
  // 用 SVG path
  const path =
    'M12 2 L14.9 8.6 L22 9.3 L16.5 14 L18.2 21 L12 17.3 L5.8 21 L7.5 14 L2 9.3 L9.1 8.6 Z';
  const clamped = Math.max(0, Math.min(1, fillRatio));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* 底层灰星 */}
        <Path d={path} fill={theme.borderSoft} />
        {/* 顶层彩星（用 clipPath 效果不好，用一个矩形做 clip 太复杂；这里直接用一个覆盖层做"部分填充"） */}
        {/* 简化做法：按 fillRatio 直接覆盖一颗整星或不覆盖 */}
      </Svg>
      {/* 真正的部分填充：上面再叠一个 mask 太重，用一个 wrapper 控制显示 */}
    </View>
  );
}

/** 简化版：fillRatio < 0.5 显示空星，>= 0.5 显示实心星。0-10 分数转 0-5 颗星（半颗用空表示） */
export function StarRow({ score, count = 5, size = 16, color }: { score: number; count?: number; size?: number; color?: string }) {
  // 0-10 -> 0-count 颗
  const stars = (score / 10) * count;
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  const fillColor = color || scoreColor(score);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => {
        let type: 'full' | 'half' | 'empty';
        if (i < full) type = 'full';
        else if (i === full && half) type = 'half';
        else type = 'empty';
        return <StarIcon key={i} type={type} size={size} color={fillColor} />;
      })}
    </View>
  );
}

function scoreColor(score: number): string {
  if (score >= 8) return '#16A34A';
  if (score >= 6) return '#D97706';
  return '#DC2626';
}

function StarIcon({ type, size, color }: { type: 'full' | 'half' | 'empty'; size: number; color: string }) {
  const path =
    'M12 2 L14.9 8.6 L22 9.3 L16.5 14 L18.2 21 L12 17.3 L5.8 21 L7.5 14 L2 9.3 L9.1 8.6 Z';
  if (type === 'empty') {
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={path} fill={theme.borderSoft} />
        </Svg>
      </View>
    );
  }
  if (type === 'full') {
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={path} fill={color} />
        </Svg>
      </View>
    );
  }
  // half：用 clip 实现
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={path} fill={theme.borderSoft} />
        <Path d={path} fill={color} clipPath="url(#halfClip)" />
        <defs>
          <clipPath id="halfClip">
            <Path d="M0 0 H12 V24 H0 Z" />
          </clipPath>
        </defs>
      </Svg>
    </View>
  );
}