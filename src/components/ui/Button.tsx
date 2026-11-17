import { Pressable, PressableProps, Text } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'text';
  className?: string;
}

export default function Button({ 
  title, 
  variant = 'primary', 
  className = '', 
  ...props 
}: ButtonProps) {
  
  const baseClasses = "w-full py-4 border-2 border-text-obsidian rounded-md active:translate-y-[2px] active:translate-x-[2px] active:shadow-none";
  
  const variantStyles = {
    primary: "bg-text-obsidian shadow-brutal",
    secondary: "bg-surface-paper shadow-brutal",
    text: "bg-transparent border-0 active:translate-y-0 active:translate-x-0"
  };

  const textStyles = {
    primary: "text-center text-text-sand text-base font-extrabold uppercase tracking-widest",
    secondary: "text-center text-text-obsidian text-base font-extrabold uppercase tracking-widest",
    text: "text-center text-text-stone font-bold uppercase underline tracking-wider"
  };

  return (
    <Pressable 
      className={`${baseClasses} ${variantStyles[variant]} ${className}`}
      accessibilityRole="button"
      {...props}
    >
      <Text 
        allowFontScaling={true}
        maxFontSizeMultiplier={1.3}
        className={textStyles[variant]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
