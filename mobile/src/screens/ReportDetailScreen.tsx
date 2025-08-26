import React from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../auth/AuthContext";
import {
  deleteReport,
  getReport,
  removeUpvoteReport,
  upvoteReport,
  updateReport,
} from "../api/reports";
import {
  addComment,
  deleteComment,
  listComments,
  removeUpvoteComment,
  upvoteComment,
  CommentDto,
} from "../api/comments";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DismissKeyboard from "../components/DismissKeyboard";

export default function ReportDetailScreen({ route, navigation }: any) {
  const id = route.params.id as number;
  const qc = useQueryClient();
  const { user, requireAuth } = useAuth();

  const reportQ = useQuery({ queryKey: ["report", id], queryFn: () => getReport(id) });
  const commentsQ = useQuery({ queryKey: ["comments", id], queryFn: () => listComments(id) });

  const r = reportQ.data?.properties;
  const isOwner = !!user && r?.user?.id === user.id;

  // --- Mutations ---
  const toggleReportUpvote = useMutation({
    mutationFn: async () => {
      // decide route based on current state
      if (r?.upvotedByMe) return removeUpvoteReport(id);
      return upvoteReport(id);
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["report", id] });
      const prev = qc.getQueryData<any>(["report", id]);
      if (prev?.properties) {
        const props = prev.properties;
        const optimistic = {
          ...prev,
          properties: {
            ...props,
            upvotedByMe: !props.upvotedByMe,
            upvotes: props.upvotedByMe ? Math.max(0, props.upvotes - 1) : props.upvotes + 1,
          },
        };
        qc.setQueryData(["report", id], optimistic);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["report", id], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["report", id] }),
  });

  const updateReportDesc = useMutation({
    mutationFn: (description: string) => updateReport(id, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report", id] }),
  });

  const deleteReportMut = useMutation({
    mutationFn: () => deleteReport(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["report", id] });
      qc.removeQueries({ queryKey: ["comments", id] });
      navigation.goBack();
    },
  });

  const addCommentMut = useMutation({
    mutationFn: (text: string) => addComment(id, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", id] }),
  });

  const toggleCommentUpvote = useMutation({
    mutationFn: (c: CommentDto) => (c.upvotedByMe ? removeUpvoteComment(c.id) : upvoteComment(c.id)),
    onMutate: async (c) => {
      await qc.cancelQueries({ queryKey: ["comments", id] });
      const prev = qc.getQueryData<CommentDto[]>(["comments", id]) || [];
      const next = prev.map((x) =>
        x.id === c.id ? { ...x, upvotedByMe: !x.upvotedByMe, upvotes: x.upvotedByMe ? Math.max(0, x.upvotes - 1) : x.upvotes + 1 } : x
      );
      qc.setQueryData(["comments", id], next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["comments", id], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["comments", id] }),
  });

  const deleteCommentMut = useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", id] }),
  });

  // --- UI state ---
  const [editText, setEditText] = React.useState("");
  const [commentText, setCommentText] = React.useState("");

  React.useEffect(() => {
    if (r?.description) setEditText(r.description);
  }, [r?.description]);

  if (reportQ.isLoading) return <View style={{ padding: 16 }}><Text>Loading…</Text></View>;
  if (reportQ.isError || !r) return <View style={{ padding: 16 }}><Text>Failed to load report.</Text></View>;

  const confirmDeleteReport = () => {
    if (!requireAuth(navigation, { tab: "ReportsTab", screen: "ReportDetail", params: { id } })) return;
    if (!isOwner) return Alert.alert("Not allowed", "Only the owner can delete this report.");
    Alert.alert("Delete report?", "This will remove the report and all its comments.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteReportMut.mutate() },
    ]);
  };

  const postComment = () => {
    if (!requireAuth(navigation, { tab: "ReportsTab", screen: "ReportDetail", params: { id } })) return;
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");
    addCommentMut.mutate(text);
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <DismissKeyboard>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <Text style={{ fontSize: 18, fontWeight: "800" }}>{r.type}</Text>
          <Text style={{ opacity: 0.8 }}>
            by {r.user.username} • {new Date(r.occurredAt).toLocaleString()}
          </Text>

          {/* Upvote + counts */}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Pressable
              onPress={() => {
                if (!requireAuth(navigation, { tab: "ReportsTab", screen: "ReportDetail", params: { id } })) return;
                toggleReportUpvote.mutate();
              }}
              style={({ pressed }) => ({
                backgroundColor: r.upvotedByMe ? "#2a72ff" : "#eee",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: r.upvotedByMe ? "#fff" : "#222", fontWeight: "700" }}>
                {r.upvotedByMe ? "Upvoted" : "Upvote"} • {r.upvotes}
              </Text>
            </Pressable>

            {isOwner && (
              <Pressable
                onPress={confirmDeleteReport}
                style={({ pressed }) => ({
                  backgroundColor: "#e15656",
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Delete report</Text>
              </Pressable>
            )}
          </View>

          {/* Description (owner can edit) */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "700" }}>Description</Text>
            <TextInput
              multiline
              editable={isOwner}
              value={editText}
              onChangeText={setEditText}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 10,
                padding: 10,
                minHeight: 80,
                backgroundColor: isOwner ? "#fff" : "#f6f6f6",
              }}
            />
            {isOwner && (
              <Pressable
                onPress={() => {
                  const text = editText.trim();
                  if (!text) return Alert.alert("Validation", "Description cannot be empty.");
                  updateReportDesc.mutate(text);
                }}
                style={({ pressed }) => ({
                  backgroundColor: "#2a72ff",
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
              </Pressable>
            )}
          </View>

          {/* Comments */}
          <View style={{ flex: 1, marginTop: 8 }}>
            <Text style={{ fontWeight: "700", marginBottom: 8 }}>Comments</Text>

            <FlatList
              data={commentsQ.data ?? []}
              keyExtractor={(c) => String(c.id)}
              contentContainerStyle={{ paddingBottom: 80 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => {
                const canDelete = !!user && item.userId === user.id;
                return (
                  <View
                    style={{
                      padding: 10,
                      borderWidth: 1,
                      borderColor: "#eee",
                      borderRadius: 12,
                      backgroundColor: "#fff",
                    }}
                  >
                    <Text style={{ fontWeight: "700" }}>{item.username}</Text>
                    <Text style={{ marginTop: 4 }}>{item.commentText}</Text>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                      <Pressable
                        onPress={() => {
                          if (!requireAuth(navigation, { tab: "ReportsTab", screen: "ReportDetail", params: { id } })) return;
                          toggleCommentUpvote.mutate(item);
                        }}
                        style={({ pressed }) => ({
                          backgroundColor: item.upvotedByMe ? "#2a72ff" : "#eee",
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          opacity: pressed ? 0.9 : 1,
                        })}
                      >
                        <Text style={{ color: item.upvotedByMe ? "#fff" : "#222", fontWeight: "700" }}>
                          {item.upvotedByMe ? "Upvoted" : "Upvote"} • {item.upvotes}
                        </Text>
                      </Pressable>

                      {canDelete && (
                        <Pressable
                          onPress={() =>
                            Alert.alert("Delete comment?", "", [
                              { text: "Cancel", style: "cancel" },
                              { text: "Delete", style: "destructive", onPress: () => deleteCommentMut.mutate(item.id) },
                            ])
                          }
                          style={({ pressed }) => ({
                            backgroundColor: "#e15656",
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 8,
                            opacity: pressed ? 0.9 : 1,
                          })}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>Delete</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          </View>

          {/* Add comment composer */}
          <View
            style={{
              borderTopWidth: 1,
              borderColor: "#eee",
              paddingTop: 8,
              gap: 8,
            }}
          >
            <TextInput
              placeholder="Write a comment…"
              value={commentText}
              onChangeText={setCommentText}
              style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10 }}
            />
            <Pressable
              onPress={postComment}
              style={({ pressed }) => ({
                backgroundColor: "#2a72ff",
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Post comment</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </DismissKeyboard>
    </View>
  );
}
