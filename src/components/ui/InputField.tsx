import { Text, TextInput, TextInputProps, View } from 'react-native';

interface InputFieldProps extends TextInputProps {
  label: string;
}

export default function InputField({ label, ...props }: InputFieldProps) {
  return (
    <View className="mb-5">
      <Text 
        allowFontScaling={true}
        maxFontSizeMultiplier={1.4}
        className="text-xs font-bold text-text-obsidian uppercase tracking-wider mb-2"
      >
        {label}
      </Text>
      <TextInput
        allowFontScaling={true}
        maxFontSizeMultiplier={1.4}
        className="w-full bg-surface-paper border-2 border-text-obsidian rounded-md px-4 py-3.5 text-text-obsidian font-semibold"
        placeholderTextColor="#6B7280"
        {...props}
      />
    </View>
  );
}
