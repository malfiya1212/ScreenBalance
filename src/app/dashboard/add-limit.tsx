import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StayFreeTimePicker from '@/components/StayFreeTimePicker';
import { useApp } from '@/context/AppContext';

const CATEGORIES = ['Social', 'Entertainment', 'Games', 'Communication', 'Productivity'];

export default function AddLimitScreen() {
  const router = useRouter();
  const { addAppLimit } = useApp();

  const [appName, setAppName] = useState('');
  const [limitHours, setLimitHours] = useState(0);
  const [limitMinutes, setLimitMinutes] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState('Social');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const totalMins = limitHours * 60 + limitMinutes;
    if (!appName.trim()) {
      setError('Please enter an application name');
      return;
    }
    if (totalMins <= 0) {
      setError('Please set a duration of at least 1 minute');
      return;
    }

    addAppLimit(appName.trim(), totalMins, selectedCategory);
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#16131D' }} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5 py-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
            >
              <Text className="text-base text-white font-bold">←</Text>
              <Text className="text-xs font-semibold text-[#9E98A8]">Back</Text>
            </Pressable>

            <Text className="text-base font-extrabold text-white">Set Limit</Text>
            <View className="w-12" />
          </View>

          {/* Error Message */}
          {error && (
            <View
              style={{ backgroundColor: '#3B1824', borderColor: '#7F1D1D' }}
              className="border rounded-2xl p-3.5 mb-4 flex-row items-center gap-2"
            >
              <Text>⚠️</Text>
              <Text className="text-xs font-semibold text-rose-300 flex-1">{error}</Text>
            </View>
          )}

          {/* Application Name */}
          <View
            style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
            className="border p-4 rounded-3xl mb-4"
          >
            <Text className="text-xs font-bold text-white mb-2">Application</Text>
            <TextInput
              style={{ backgroundColor: '#16131D', borderColor: '#2E273B', color: '#FFFFFF' }}
              className="w-full border rounded-xl px-4 py-3 text-white text-xs font-medium"
              placeholder="Application name"
              placeholderTextColor="#7C7389"
              value={appName}
              onChangeText={(text) => {
                setAppName(text);
                setError(null);
              }}
              autoFocus
            />
          </View>

          {/* Time Picker */}
          <View
            style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
            className="border p-4 rounded-3xl mb-4"
          >
            <View className="flex-row justify-between items-center mb-2 px-1">
              <Text className="text-xs font-bold text-white">Time Limit</Text>
              <Text style={{ color: '#9D84D6' }} className="text-xs font-bold">
                {limitHours > 0 ? `${limitHours}h ` : ''}
                {limitMinutes}m
              </Text>
            </View>

            <StayFreeTimePicker
              hours={limitHours}
              minutes={limitMinutes}
              onChange={(h, m) => {
                setLimitHours(h);
                setLimitMinutes(m);
                setError(null);
              }}
              maxHours={12}
            />
          </View>

          {/* Category */}
          <View
            style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
            className="border p-4 rounded-3xl mb-6"
          >
            <Text className="text-xs font-bold text-white mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={{
                      backgroundColor: isSelected ? '#4A3C63' : '#16131D',
                      borderColor: isSelected ? '#9D84D6' : '#2E273B',
                    }}
                    className="border px-3 py-1.5 rounded-xl"
                  >
                    <Text
                      style={{ color: isSelected ? '#FFFFFF' : '#9E98A8' }}
                      className="text-xs font-semibold"
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            accessibilityRole="button"
            style={{ backgroundColor: '#4A3C63', borderColor: '#9D84D6' }}
            className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-sm mb-12"
          >
            <Text className="text-white text-sm font-bold tracking-wide">Save Limit</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
