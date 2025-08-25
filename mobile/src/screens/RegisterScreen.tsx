import React from "react";
import { View, TextInput, Button } from "react-native";
import { register } from "../api/auth";

export default function RegisterScreen({ navigation }: any) {
  const [username, setU] = React.useState("");
  const [email, setE] = React.useState("");
  const [password, setP] = React.useState("");

  return (
    <View style={{ padding:16, gap:12 }}>
      <TextInput placeholder="Username" value={username} onChangeText={setU} style={{ borderWidth:1, padding:8 }} />
      <TextInput placeholder="Email" value={email} onChangeText={setE} style={{ borderWidth:1, padding:8 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setP} style={{ borderWidth:1, padding:8 }} />
      <Button title="Create account" onPress={async ()=> { await register(username, email, password); navigation.replace("Map"); }} />
    </View>
  );
}
