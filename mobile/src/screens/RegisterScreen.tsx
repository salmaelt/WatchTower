import React, { useState } from "react";
import { View, Text, TextInput, Button, Pressable, Alert, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import DismissKeyboard from "../components/DismissKeyboard";

export default function RegisterScreen() {
  const [username, setU] = useState("");
  const [email, setE] = useState("");
  const [password, setP] = useState("");
  const [confirm, setC] = useState("");
  const { register } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const redirectTo = route.params?.redirectTo as { tab?: string; screen: string; params?: any } | undefined;

  const onSubmit = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don’t match", "Please re-enter your password.");
      return;
    }
    try {
      await register(username.trim(), email.trim(), password);
      if (redirectTo) {
        (navigation as any).navigate(redirectTo.tab ?? "MapTab", {
          screen: redirectTo.screen,
          params: redirectTo.params,
        });
      } else {
        (navigation as any).navigate("ProfileTab", { screen: "Profile" });
      }
    } catch (e: any) {
      Alert.alert("Registration failed", e?.response?.data || e.message);
    }
  };

  return (
    <DismissKeyboard>
      <View style={s.container}>
        <Text style={s.title}>Create your account</Text>

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setU}
          autoCapitalize="none"
          style={s.input}
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setE}
          autoCapitalize="none"
          keyboardType="email-address"
          style={s.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setP}
          secureTextEntry
          style={s.input}
        />
        <TextInput
          placeholder="Confirm password"
          value={confirm}
          onChangeText={setC}
          secureTextEntry
          style={s.input}
        />

        <Button title="Create account" onPress={onSubmit} />

        <View style={{ height: 12 }} />
        <Text style={s.muted}>Already have an account?</Text>
        <Pressable onPress={() => (navigation as any).navigate("Login", { redirectTo })}>
          <Text style={s.link}>Log in here</Text>
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
  muted: { textAlign: "center", opacity: 0.7, marginTop: 4 },
  link: { textAlign: "center", fontWeight: "600", marginTop: 6 },
});