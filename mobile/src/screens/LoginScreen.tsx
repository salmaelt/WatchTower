import React from "react";
import { View, TextInput, Button } from "react-native";
import { login } from "../api/auth";

export default function LoginScreen({ navigation }: any) {
  const [usernameOrEmail, setU] = React.useState("");
  const [password, setP] = React.useState("");

  return (
    <View style={{ padding:16, gap:12 }}>
      <TextInput placeholder="Username or Email" value={usernameOrEmail} onChangeText={setU} style={{ borderWidth:1, padding:8 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setP} style={{ borderWidth:1, padding:8 }} />
      <Button title="Login" onPress={async ()=> { await login(usernameOrEmail, password); navigation.replace("Map"); }} />
    </View>
  );
}