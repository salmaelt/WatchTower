import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import DismissKeyboard from "../components/DismissKeyboard";
import LoadingButton from "../components/LoadingButton";

export default function LoginScreen() {
  const [usernameOrEmail, setU] = useState("");
  const [password, setP] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const redirectTo = route.params?.redirectTo as { tab?: string; screen: string; params?: any } | undefined;

  const handleLogin = async () => {
    const u = usernameOrEmail.trim();

    if (!u || !password) {
      Alert.alert("Missing details", "Please enter your username/email and password.");
      return;
    }

    try {
      await login(u, password);

      if (redirectTo) {
        (navigation as any).navigate(redirectTo.tab ?? "MapTab", {
          screen: redirectTo.screen,
          params: redirectTo.params,
        });
      } else {
        (navigation as any).navigate("ProfileTab", { screen: "Profile" });
      }
    } catch (e: any) {
      // Axios-style error object handling with ProblemDetails support
      const status = e?.response?.status as number | undefined;
      const data = e?.response?.data;
      const serverTitle = data?.title;
      const serverDetail = data?.detail;
      const fallbackMsg = e?.message || "Something went wrong.";

      if (status === 401) {
        // api_contracts: 401 invalid credentials
        Alert.alert("Invalid credentials", "Please check your username/email and password and try again.");
      } else if (status === 400) {
        // api_contracts: 400 validation
        Alert.alert("Validation error", serverTitle || serverDetail || fallbackMsg);
      } else if (status && status >= 500) {
        // api_contracts: server errors
        Alert.alert("Server error", "Please try again in a moment.");
      } else {
        // Other cases (network errors, unexpected)
        Alert.alert("Login failed", serverTitle || serverDetail || fallbackMsg);
      }
      // LoadingButton spinner is stopped via onLoadingChange(false)
    }
  };

  return (
    <DismissKeyboard>
      <View style={s.container}>
        <Text style={s.title}>Welcome back</Text>

        <TextInput
          placeholder="Username or email"
          value={usernameOrEmail}
          onChangeText={setU}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          style={[s.input, busy && s.inputDisabled]}
          placeholderTextColor="#666"
          returnKeyType="next"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setP}
          secureTextEntry
          editable={!busy}
          style={[s.input, busy && s.inputDisabled]}
          placeholderTextColor="#666"
          returnKeyType="done"
          onSubmitEditing={() => !busy && handleLogin()}
        />

        <LoadingButton
          title="Log in"
          onPressAsync={handleLogin}
          onLoadingChange={setBusy}  // disables inputs while loading
        />

        <View style={{ height: 12 }} />
        <Text style={s.muted}>Don’t have an account?</Text>
        <Pressable disabled={busy} onPress={() => (navigation as any).navigate("Register", { redirectTo })}>
          <Text style={[s.link, busy && { opacity: 0.5 }]}>Create one here</Text>
        </Pressable>
      </View>
    </DismissKeyboard>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fafafa",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, marginBottom: 10,
  },
  inputDisabled: { opacity: 0.6 },
  muted: { textAlign: "center", opacity: 0.7, marginTop: 4 },
  link: { textAlign: "center", fontWeight: "600", marginTop: 6 },
});
