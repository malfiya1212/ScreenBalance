import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RestrictionScreen() {
  const params = useLocalSearchParams<{
    appName?: string;
    reason?: string;
    details?: string;
  }>();

  const appName = params.appName || 'Application';
  const reason = params.reason || 'Daily Limit Reached';
  const details =
    params.details ||
    `${appName} has reached its designated limit or entered a scheduled focus period. Step back, take a breath, and focus on what matters.`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Shield / Restrict Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🛡️</Text>
        </View>

        {/* Status Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>APP RESTRICTED</Text>
        </View>

        {/* Title & App Name */}
        <Text style={styles.title}>{appName}</Text>
        <Text style={styles.subtitle}>{reason}</Text>

        {/* Informative Description Card */}
        <View style={styles.card}>
          <Text style={styles.cardText}>{details}</Text>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>
              &ldquo;Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.&rdquo;
            </Text>
          </View>
        </View>

        {/* Actions */}
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace('/dashboard')}
        >
          <Text style={styles.primaryButtonText}>Return to Home</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace('/dashboard/focus')}
        >
          <Text style={styles.secondaryButtonText}>Start a Focus Session</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C15',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 44,
  },
  badge: {
    backgroundColor: '#37151B',
    borderColor: '#7F1D1D',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9E98A8',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1C1726',
    borderColor: '#322B42',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  cardText: {
    color: '#D1CADB',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 14,
  },
  quoteBox: {
    backgroundColor: '#120F1A',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  quoteText: {
    color: '#A78BFA',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#231D30',
    borderColor: '#3B324D',
    borderWidth: 1,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#D1CADB',
    fontSize: 14,
    fontWeight: '600',
  },
});
