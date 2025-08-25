import React from "react";
import { View, TextInput, Button, Text } from "react-native";
import dayjs from "dayjs";
import { createReport } from "../api/reports";

export default function ReportForm({ route, navigation }: any) {
  const { lat, lng } = route.params ?? {};
  const [type, setType] = React.useState("theft");
  const [description, setDescription] = React.useState("");
  const [occurredAt, setOccurredAt] = React.useState(dayjs().toISOString());

  return (
    <View style={{ padding:16, gap:12 }}>
      <Text>Type</Text>
      <TextInput value={type} onChangeText={setType} placeholder="type" style={{ borderWidth:1, padding:8 }} />
      <Text>Description</Text>
      <TextInput value={description} onChangeText={setDescription} placeholder="description" style={{ borderWidth:1, padding:8 }} multiline />
      <Button title="Submit" onPress={async () => {
        await createReport({ type, description, occurredAt, lat, lng });
        navigation.goBack();
      }} />
    </View>
  );
}