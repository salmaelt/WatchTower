import React from "react";
import { View, Text, Button, TextInput, FlatList } from "react-native";
import { getReport, upvoteReport } from "../api/reports";
import { addComment, listComments, upvoteComment } from "../api/comments";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ReportDetailScreen({ route }: any) {
  const id = route.params.id as number;
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:["report", id], queryFn:()=>getReport(id) });
  const { data: comments } = useQuery({ queryKey:["comments", id], queryFn:()=>listComments(id) });

  const [text, setText] = React.useState("");
  const r = data?.properties;

  return (
    <View style={{ padding:16, gap:12 }}>
      <Text style={{ fontWeight:"bold" }}>{r?.type}</Text>
      <Text>{r?.description}</Text>
      <Text>{r?.upvotes} upvotes</Text>
      <Button title={r?.upvotedByMe ? "Un/upvote" : "Upvote"} onPress={async ()=>{ await upvoteReport(id); qc.invalidateQueries({ queryKey:["report", id]}); }} />

      <FlatList
        data={comments ?? []}
        keyExtractor={(c)=>String(c.id)}
        renderItem={({item}) => (
          <View style={{ paddingVertical:6 }}>
            <Text>{item.username}: {item.commentText}</Text>
            <Text>{item.upvotes} upvotes</Text>
            <Button title="Upvote" onPress={async ()=> { await upvoteComment(item.id); qc.invalidateQueries({ queryKey:["comments", id]}); }} />
          </View>
        )}
      />

      <TextInput placeholder="Write a comment…" value={text} onChangeText={setText} style={{ borderWidth:1, padding:8 }} />
      <Button title="Post" onPress={async ()=> { await addComment(id, text); setText(""); qc.invalidateQueries({ queryKey:["comments", id]}); }} />
    </View>
  );
}