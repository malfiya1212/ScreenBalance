import React from 'react';
import { Text, View } from 'react-native';

export interface InfoCardProps {
  title: string;
  message: string;
  isError?: boolean;
  className?: string;
}

/**
 * Prop-Driven Information Card (Reusable UI)
 * 
 * Strictly uses props (title, message, isError) to dynamically render status 
 * or alert information. Respects accessibility font scaling without layout clipping.
 */
export default function InfoCard({
  title,
  message,
  isError = false,
  className = '',
}: InfoCardProps) {
  return (
    <View
      accessibilityRole={isError ? 'alert' : 'summary'}
      accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
      className={`border-2 rounded-md p-4 mb-4 shadow-brutal-sm ${
        isError
          ? 'bg-danger-base border-danger-border'
          : 'bg-surface-paper border-text-obsidian'
      } ${className}`}
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <Text
          allowFontScaling={true}
          maxFontSizeMultiplier={1.4}
          className={`text-xs font-black uppercase tracking-wider ${
            isError ? 'text-danger-text' : 'text-text-obsidian'
          }`}
        >
          {isError ? `[ERROR] ${title}` : `[STATUS] ${title}`}
        </Text>
        <View
          className={`w-2.5 h-2.5 rounded-full border border-text-obsidian ${
            isError ? 'bg-danger-border' : 'bg-emerald-600'
          }`}
        />
      </View>
      <Text
        allowFontScaling={true}
        maxFontSizeMultiplier={1.5}
        className={`text-xs font-medium leading-relaxed ${
          isError ? 'text-danger-text' : 'text-text-stone'
        }`}
      >
        {message}
      </Text>
    </View>
  );
}
