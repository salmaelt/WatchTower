import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type Props = {
  title: string;
  onPress?: () => void;                    // controlled mode (use with 'loading')
  onPressAsync?: () => Promise<any>;       // auto mode (manages its own loading)
  loading?: boolean;                       // controlled mode: show spinner
  disabled?: boolean;                      // externally disable button
  variant?: "primary" | "danger" | "outline";
  fullWidth?: boolean;
  style?: ViewStyle;
  onLoadingChange?: (loading: boolean) => void; // lets parent disable inputs
};

export default function LoadingButton({
  title,
  onPress,
  onPressAsync,
  loading,
  disabled,
  variant = "primary",
  fullWidth = true,
  style,
  onLoadingChange,
}: Props) {
  const [internalLoading, setInternalLoading] = useState(false);

  const isAuto = !!onPressAsync;
  const isLoading = loading ?? (isAuto && internalLoading) ?? false;
  const isDisabled = !!disabled || !!isLoading;

  const handlePress = useCallback(async () => {
    if (isDisabled) return;

    if (!isAuto) {
      onPress?.();
      return;
    }

    try {
      setInternalLoading(true);
      onLoadingChange?.(true);
      await onPressAsync!();
    } finally {
      setInternalLoading(false);
      onLoadingChange?.(false);
    }
  }, [isDisabled, isAuto, onPress, onPressAsync, onLoadingChange]);

  const variantStyles = useMemo(() => {
    switch (variant) {
      case "danger":
        return { base: s.btnDanger, disabled: s.btnDangerDisabled, text: s.textLight };
      case "outline":
        return { base: s.btnOutline, disabled: s.btnOutlineDisabled, text: s.textDark };
      default:
        return { base: s.btnPrimary, disabled: s.btnPrimaryDisabled, text: s.textLight };
    }
  }, [variant]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.btnBase,
        variantStyles.base,
        fullWidth && s.fullWidth,
        isDisabled && variantStyles.disabled,
        pressed && !isDisabled && { opacity: 0.9 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
    >
      {isLoading ? <ActivityIndicator /> : <Text style={[s.btnText, variantStyles.text]}>{title}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btnBase: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: { alignSelf: "stretch" },

  // Variants
  btnPrimary: { pallette.green },
  btnPrimaryDisabled: { backgroundColor: "#aac3ff" },

  btnDanger: { backgroundColor: "#e15656" },
  btnDangerDisabled: { backgroundColor: "#f1a6a6" },

  btnOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#ccc" },
  btnOutlineDisabled: { opacity: 0.6 },

  btnText: { fontWeight: "700", fontSize: 16 },
  textLight: { color: "#fff" },
  textDark: { color: "#222" },
});
