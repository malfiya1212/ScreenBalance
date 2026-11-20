import React from 'react';
import { Text, View } from 'react-native';

export interface ProtocolCardProps {
  /** Top-left technical system tag (e.g., "SYSTEM ARCHITECTURE // V1.0") */
  systemTag?: string;
  /** Top-right badge status text (e.g., "READY", "ACTIVE", "LOCKED") */
  statusLabel?: string;
  /** Status indicator indicator tone */
  statusTone?: 'ready' | 'active' | 'warning' | 'error';
  /** Section title above the flow pipeline (e.g., "FRICTION PROTOCOL") */
  protocolTitle?: string;
  /** Array of stage labels displayed in the interlock pipeline */
  stages?: string[];
  /** Progress bar percentage (0 - 100) */
  progress?: number;
  /** Bottom descriptive caption explaining the hardware/protocol logic */
  caption?: string;
  /** Optional container style overrides */
  className?: string;
}

/**
 * ProtocolCard (Reusable UI)
 * 
 * Recreates the technical, hardware-grade aesthetic from the ScreenBalance design.
 * Accepts props for all data points, enforces the design system's zero pure black/white rule,
 * and scales text responsively with accessibility support.
 */
export default function ProtocolCard({
  systemTag = 'SYSTEM ARCHITECTURE // V1.0',
  statusLabel = 'READY',
  statusTone = 'ready',
  protocolTitle = 'FRICTION PROTOCOL',
  stages = ['IMPULSE', 'INTERLOCK', 'BALANCE'],
  progress = 75,
  caption = 'Hardware-grade boundaries for app addiction. Take control of your daily digital consumption.',
  className = '',
}: ProtocolCardProps) {
  // Clamped progress percentage (0 - 100)
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Status indicator colors adhering to design tokens (no pure black/white)
  const toneIndicatorStyles: Record<string, string> = {
    ready: 'bg-emerald-600',
    active: 'bg-text-obsidian',
    warning: 'bg-amber-500',
    error: 'bg-danger-border',
  };

  return (
    <View
      accessibilityRole="summary"
      className={`border-2 border-text-obsidian bg-surface-paper p-5 rounded-lg ${className}`}
    >
      {/* 1. Header: System Tag & Status Badge */}
      <View className="flex-row justify-between items-center mb-3">
        <Text
          allowFontScaling={true}
          maxFontSizeMultiplier={1.3}
          className="text-xs font-black uppercase tracking-wider text-text-stone"
        >
          {systemTag}
        </Text>

        <View className="flex-row items-center gap-1.5 bg-surface-base px-2.5 py-1 border border-text-obsidian rounded">
          <View
            className={`w-2 h-2 rounded-full border border-text-obsidian ${
              toneIndicatorStyles[statusTone] || toneIndicatorStyles.ready
            }`}
          />
          <Text
            allowFontScaling={true}
            maxFontSizeMultiplier={1.2}
            className="text-xs font-black uppercase tracking-wider text-text-obsidian"
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* 2. Protocol Title Label */}
      <Text
        allowFontScaling={true}
        maxFontSizeMultiplier={1.3}
        className="text-xs font-black uppercase tracking-wider text-text-obsidian mb-2.5"
      >
        {protocolTitle}
      </Text>

      {/* 3. Stage Pipeline Interlock Box */}
      <View className="flex-row items-center justify-between bg-surface-base border-2 border-text-obsidian px-3 py-2.5 rounded mb-3">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          return (
            <React.Fragment key={stage}>
              <Text
                allowFontScaling={true}
                maxFontSizeMultiplier={1.3}
                className={`text-xs font-black uppercase tracking-wide ${
                  isLast ? 'text-emerald-700' : 'text-text-obsidian'
                }`}
              >
                {stage}
              </Text>
              {!isLast && (
                <Text
                  allowFontScaling={false}
                  className="text-xs font-bold text-text-stone px-1"
                >
                  →
                </Text>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* 4. Telemetry Progress Bar */}
      <View className="w-full h-3 bg-surface-base border-2 border-text-obsidian rounded-sm overflow-hidden mb-3">
        <View
          className="h-full bg-text-obsidian"
          style={{ width: `${clampedProgress}%` }}
        />
      </View>

      {/* 5. Footer Descriptive Caption */}
      <Text
        allowFontScaling={true}
        maxFontSizeMultiplier={1.4}
        className="text-xs font-medium text-text-stone leading-relaxed"
      >
        {caption}
      </Text>
    </View>
  );
}
