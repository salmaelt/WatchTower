import React from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView } from "react-native";
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
import LoadingButton from "../components/LoadingButton";

export default function ReportDetailScreen({ route, navigation }: any) {
  const id = route.params.id as number;
  const qc = useQueryClient();
  const { user, requireAuth } = useAuth();

  // Safe area + header for navbar clearance
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const kbdOffset = Platform.select({
    ios: headerHeight + insets.top,
    android: 0,
    default: 0,
  }) as number;

  // Data
  const reportQ = useQuery({ queryKey: ["report", id], queryFn: () => getReport(id) });
  const commentsQ = useQuery({ queryKey: ["comments", id], queryFn: () => listComments(id) });

  const r = reportQ.data?.properties;
  const isOwner = !!user && r?.user?.id === user.id;

  // Mutations
  const toggleReportUpvote = useMutation({
    mutationFn: async () => (r?.upvotedByMe ? removeUpvoteReport(id) : upvoteReport(id)),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["report", id] });
      const prev = qc.getQueryData<any>(["report", id]);
      if (prev?.properties) {
        const props = prev.properties;
        qc.setQueryData(["report", id], {
          ...prev,
          properties: {
            ...props,
            upvotedByMe: !props.upvotedByMe,
            upvotes: props.upvotedByMe ? Math.max(0, props.upvotes - 1) : props.upvotes + 1,
          },
        });
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
        x.id === c.id
          ? {
              ...x,
              upvotedByMe: !x.upvotedByMe,
              upvotes: x.upvotedByMe ? Math.max(0, x.upvotes - 1) : x.upvotes + 1,
            }
          : x
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

  // UI state
  const [editText, setEditText] = React.useState("");
  const [commentText, setCommentText] = React.useState("");
  const [descBusy, setDescBusy] = React.useState(false);
  const [commentBusy, setCommentBusy] = React.useState(false);
  const [descFocused, setDescFocused] = React.useState(false);

  React.useEffect(() => {
    if (r?.description) setEditText(r.description);
  }, [r?.description]);

  if (reportQ.isLoading)
    return (
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          <Text>Loading…</Text>
        </View>
      </SafeAreaView>
    );

  if (reportQ.isError || !r)
    return (
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          <Text>Failed to load report.</Text>
        </View>
      </SafeAreaView>
    );

  const confirmDeleteReport = () => {
    if (!requireAuth(navigation, { tab: "ReportsTab", screen: "ReportDetail", params: { id } })) return;
    if (!isOwner) return Alert.alert("Not allowed", "Only the owner can delete this report.");
    Alert.alert("Delete report?", "This will remove the report and all its comments.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteReportMut.mutate() },
    ]);
  };

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
      {/* Header */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>{r.type}</Text>
        <Text style={{ opacity: 0.8 }}>
          by {r.user.username} • {new Date(r.occurredAt).toLocaleString()}
        </Text>
      </View>

      {/* Upvote + counts */}
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Pressable
          onPress={() => {
            if (!requireAuth(navigation, { tab: "ReportsTab", screen: "ReportDetail", params: { id } })) return;
            toggleReportUpvote.mutate();
          }}
          style={({ pressed }) => ({
            backgroundColor: r.upvotedByMe ? "#2a72ff" : "#eee",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
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
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Delete report</Text>
          </Pressable>
        )}
      </View>

      {/* Description (owner can update) */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "700" }}>Description</Text>
        <TextInput
          multiline
          editable={isOwner && !descBusy}
          value={editText}
          onChangeText={setEditText}
          onFocus={() => setDescFocused(true)}
          onBlur={() => setDescFocused(false)}
          textAlignVertical="top"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            padding: 12,
            minHeight: 100,
            backgroundColor: isOwner ? "#fff" : "#f6f6f6",
            opacity: descBusy ? 0.6 : 1,
          }}
        />
        {isOwner && (
          <LoadingButton
            title="Update description"
            variant="primary"
            onPressAsync={async () => {
              const text = editText.trim();
              if (!text) {
                Alert.alert("Validation", "Description cannot be empty.");
                return;
              }
              await updateReportDesc.mutateAsync(text);
            }}
            onLoadingChange={setDescBusy}
            fullWidth
          />
        )}
      </View>

      {/* Comments header */}
      <Text style={{ fontWeight: "700", marginTop: 8 }}>Comments</Text>
    </View>
  );

  const renderItem = ({ item }: { item: CommentDto }) => {
    const canDelete = !!user && item.userId === user.id;
    return (
      <View
        style={{
          marginHorizontal: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: "#eee",
          borderRadius: 12,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "700" }}>{item.username}</Text>
        <Text style={{ marginTop: 4 }}>{item.commentText}</Text>

        {/* Upvote & Delete only */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          <Pressable
            onPress={() => {
              if (!requireAuth(navigation, { tab: "ReportsTab", screen: "ReportDetail", params: { id } })) return;
              toggleCommentUpvote.mutate(item);
            }}
            style={({ pressed }) => ({
              backgroundColor: item.upvotedByMe ? "#2a72ff" : "#eee",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
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
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Delete</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#fafafa" }}>
      {/* Touch outside to dismiss keyboard (single child View to satisfy React.Children.only) */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          {/* Scrollable content */}
          <FlatList
            data={commentsQ.data ?? []}
            keyExtractor={(c) => String(c.id)}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              // Leave room for the composer when visible; shrink when hidden during description edit
              paddingBottom: (descFocused ? 12 : 12 + 72) + insets.bottom,
              paddingTop: 12,
            }}
          />

          {/* Sticky Composer – hidden while description is focused */}
          {!descFocused && (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={kbdOffset}
            >
              <View
                style={{
                  borderTopWidth: 1,
                  borderColor: "#eee",
                  paddingHorizontal: 12,
                  paddingTop: 12,
                  paddingBottom: 12 + insets.bottom,
                  gap: 8,
                  backgroundColor: "#fff",
                }}
              >
                <TextInput
                  placeholder="Write a comment…"
                  value={commentText}
                  onChangeText={setCommentText}
                  editable={!commentBusy}
                  multiline
                  textAlignVertical="top"
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 12,
                    padding: 10,
                    minHeight: 44,
                    maxHeight: 140,
                    opacity: commentBusy ? 0.6 : 1,
                  }}
                />
                <LoadingButton
                  title="Post comment"
                  variant="primary"
                  onPressAsync={async () => {
                    if (
                      !requireAuth(navigation, {
                        tab: "ReportsTab",
                        screen: "ReportDetail",
                        params: { id },
                      })
                    )
                      return;

                    const text = commentText.trim();
                    if (!text) return;

                    await addCommentMut.mutateAsync(text);
                    setCommentText("");
                  }}
                  onLoadingChange={setCommentBusy}
                  disabled={!commentText.trim()}
                  fullWidth
                />
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}


