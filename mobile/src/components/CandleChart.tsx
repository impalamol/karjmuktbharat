import { useMemo, useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg'
import { MotiView } from 'moti'
import { colors } from '@/theme/tokens'
import type { DailyRescue } from '@/lib/types'

export interface Candle {
  label: string
  open: number
  close: number
  low: number
  high: number
}

/**
 * Turns per-day counts into candles. Each candle covers `per` days: open = first day,
 * close = last day, wick = min/max inside the bucket. A single day is a flat candle.
 */
export function toCandles(rows: DailyRescue[], per: number, label: (d: Date) => string): Candle[] {
  const out: Candle[] = []
  for (let i = 0; i < rows.length; i += per) {
    const b = rows.slice(i, i + per)
    if (!b.length) continue
    const vals = b.map((r) => r.saved)
    const prev = i > 0 ? rows[i - 1]!.saved : vals[0]!
    out.push({ label: label(new Date(b[0]!.day)), open: per === 1 ? prev : vals[0]!, close: vals.at(-1)!, low: Math.min(...vals, per === 1 ? prev : Infinity), high: Math.max(...vals, per === 1 ? prev : -Infinity) })
  }
  return out
}

/** Minimal candlestick chart on black: mint up, gray down, candles draw in left to right. */
export function CandleChart({ candles, height = 200 }: { candles: Candle[]; height?: number }) {
  const [w, setW] = useState(0)
  const { min, max } = useMemo(() => {
    const lo = Math.min(...candles.map((c) => c.low))
    const hi = Math.max(...candles.map((c) => c.high))
    const pad = Math.max(1, (hi - lo) * 0.1)
    return { min: lo - pad, max: hi + pad }
  }, [candles])
  const plotH = height - 24
  const y = (v: number) => plotH - ((v - min) / (max - min || 1)) * plotH
  const slot = candles.length ? w / candles.length : 0
  const body = Math.max(4, Math.min(14, slot * 0.55))
  const labelEvery = Math.ceil(candles.length / 6)

  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} style={{ height }} accessibilityRole="image" accessibilityLabel={`Candlestick chart, ${candles.length} periods`}>
      {w > 0 &&
        candles.map((c, i) => {
          const up = c.close >= c.open
          const top = y(Math.max(c.open, c.close))
          const bh = Math.max(2, Math.abs(y(c.open) - y(c.close)))
          const fill = up ? colors.mint.strong : colors.gray[500]
          return (
            <MotiView
              key={`${c.label}-${i}`}
              from={{ opacity: 0, scaleY: 0.2 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ type: 'timing', duration: 400, delay: i * 25 }}
              style={{ position: 'absolute', left: i * slot, top: 0, width: slot, height }}
            >
              <Svg width={slot} height={height}>
                <Line x1={slot / 2} x2={slot / 2} y1={y(c.high)} y2={y(c.low)} stroke={fill} strokeWidth={1.2} />
                <Rect x={(slot - body) / 2} y={top} width={body} height={bh} rx={2} fill={fill} />
                {i % labelEvery === 0 && (
                  <SvgText x={slot / 2} y={height - 4} fontSize={10} fill={colors.gray[500]} textAnchor="middle">
                    {c.label}
                  </SvgText>
                )}
              </Svg>
            </MotiView>
          )
        })}
    </View>
  )
}
