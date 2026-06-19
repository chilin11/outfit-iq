import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line, Circle, G } from 'react-native-svg';
import { theme } from '../theme';
import { sansMedium } from '../fonts';
import { Text } from 'react-native';
import { RatingDimension } from '../types';

type Props = {
  dimensions: RatingDimension[];
  size?: number;
};

/** 雷达图：每个维度是顶点，分数 0-10 决定顶点离中心多远 */
export function RadarChart({ dimensions, size = 240 }: Props) {
  const n = dimensions.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36; // 数据多边形最大半径
  const labelR = size * 0.48; // 标签到中心的距离

  // 顶点在角度 0 上方（顺时针）
  // 第 i 个顶点的角度 = -90 + i * (360/n) 度
  const angle = (i: number) => -90 + (i * 360) / n;

  const point = (i: number, value01: number) => {
    const a = (angle(i) * Math.PI) / 180;
    const r = maxR * value01;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  // 数据多边形顶点
  const dataPoints = dimensions
    .map((d, i) => point(i, Math.max(0, Math.min(1, (d.score ?? 0) / 10))))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  // 5 圈参考网格（10%, 30%, 50%, 70%, 100%）
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
  // 每个维度轴线
  const axisLines = Array.from({ length: n }).map((_, i) => {
    const p = point(i, 1);
    return { x1: cx, y1: cy, x2: p.x, y2: p.y };
  });

  // 维度颜色按名
  const col = (name: string) => {
    const map: Record<string, string> = {
      '色彩': '#5B5BD6',
      '版型': '#0EA5E9',
      '层次': '#A8765A',
      '风格': '#16A34A',
      '合身': '#DC2626',
    };
    return map[name] || '#5B5BD6';
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* 网格圈 */}
        <G>
          {gridLevels.map((lv, i) => {
            const pts = Array.from({ length: n })
              .map((_, k) => point(k, lv))
              .map((p) => `${p.x},${p.y}`)
              .join(' ');
            return (
              <Polygon
                key={i}
                points={pts}
                stroke={theme.border}
                strokeWidth={1}
                fill="none"
              />
            );
          })}
        </G>
        {/* 轴线 */}
        <G>
          {axisLines.map((l, i) => (
            <Line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={theme.borderSoft}
              strokeWidth={1}
            />
          ))}
        </G>
        {/* 数据多边形 */}
        <Polygon
          points={dataPoints}
          fill="rgba(91, 91, 214, 0.18)"
          stroke="#5B5BD6"
          strokeWidth={2}
        />
        {/* 数据点 */}
        <G>
          {dimensions.map((d, i) => {
            const p = point(i, Math.max(0, Math.min(1, (d.score ?? 0) / 10)));
            return <Circle key={i} cx={p.x} cy={p.y} r={4} fill={col(d.name)} />;
          })}
        </G>
        {/* 标签 */}
        <G>
          {dimensions.map((d, i) => {
            const a = (angle(i) * Math.PI) / 180;
            const x = cx + labelR * Math.cos(a);
            const y = cy + labelR * Math.sin(a);
            // SVG text 不好用，用 RN Text 叠加
            return null;
          })}
        </G>
      </Svg>
      {/* 标签叠加层（用 RN Text，因为 SVG Text 中文难处理） */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width: size, height: size }}>
        {dimensions.map((d, i) => {
          const a = (angle(i) * Math.PI) / 180;
          const x = labelR * Math.cos(a);
          const y = labelR * Math.sin(a);
          // 根据象限对齐文字
          const isLeft = Math.cos(a) < -0.1;
          const isRight = Math.cos(a) > 0.1;
          const isTop = Math.sin(a) < -0.1;
          const isBottom = Math.sin(a) > 0.1;
          let align: 'left' | 'right' | 'center' = 'center';
          let dy = -7;
          if (isLeft) align = 'right';
          else if (isRight) align = 'left';
          if (isTop) dy = -10;
          if (isBottom) dy = -3;

          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: cx + x,
                top: cy + y,
                transform: [
                  { translateX: align === 'left' ? 6 : align === 'right' ? -6 : -20 },
                  { translateY: dy },
                ],
                width: 40,
                alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
              }}
            >
              <Text style={{ fontFamily: sansMedium, fontSize: 11, color: theme.ink }}>{d.name}</Text>
              <Text style={{ fontFamily: sansMedium, fontSize: 13, color: col(d.name) }}>
                {(d.score ?? 0).toFixed(1)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}