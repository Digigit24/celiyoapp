import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Badge, Button, Card, EmptyState, InlineError, Input, useToast } from "../../../components/ui";
import { useAnswerQuestion, useQuestions } from "../hooks";

/**
 * Read-only by default, plus a stretch-goal inline "Answer" box gated by
 * `canAnswer` (hms.reputation.answer_questions). Answering is the one write
 * action the GMB contract deliberately leaves ungated on mobile — it's a
 * single short text POST with no OAuth/consent-screen involvement, unlike
 * review replies or Local Posts, so the effort/risk to add it here was low.
 */
export function QnaTab({ locationId, canAnswer }: { locationId: number; canAnswer: boolean }) {
  const questions = useQuestions({ location: locationId });
  const answerMutation = useAnswerQuestion();
  const toast = useToast();
  const [openId, setOpenId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  if (questions.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (questions.isError) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <InlineError message="Couldn't load Q&A." />
      </View>
    );
  }

  if (!questions.data || questions.data.length === 0) {
    return <EmptyState icon="help-circle-outline" title="No questions yet" />;
  }

  function submitAnswer(questionId: number) {
    if (!draft.trim()) return;
    answerMutation.mutate(
      { id: questionId, text: draft.trim() },
      {
        onSuccess: () => {
          toast.show("Answer posted", "success");
          setOpenId(null);
          setDraft("");
        },
        onError: () => toast.show("Couldn't post the answer", "error"),
      }
    );
  }

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {questions.data.map((q) => (
        <Card key={q.id}>
          <View className="flex-row items-start justify-between gap-2 mb-1.5">
            <Text className="text-sm font-medium text-foreground flex-1">{q.text}</Text>
            <Badge label={q.is_answered ? "Answered" : "Unanswered"} variant={q.is_answered ? "success" : "warning"} />
          </View>
          <View className="flex-row items-center gap-3 mb-2">
            {q.author_display_name ? (
              <Text className="text-xs text-muted-foreground">{q.author_display_name}</Text>
            ) : null}
            <Text className="text-xs text-muted-foreground">
              {q.upvote_count} upvote{q.upvote_count === 1 ? "" : "s"}
            </Text>
          </View>

          {q.answers.length > 0 ? (
            <View className="gap-2 mt-1">
              {q.answers.map((a) => (
                <View key={a.id} className="rounded-lg bg-secondary p-3">
                  <Text className="text-xs font-semibold text-secondary-foreground mb-1">
                    {a.author_type === "owner" ? "Business" : "Other user"}
                  </Text>
                  <Text className="text-sm text-secondary-foreground">{a.text}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {canAnswer && !q.is_answered ? (
            openId === q.id ? (
              <View className="mt-3 gap-2">
                <Input placeholder="Write an answer…" value={draft} onChangeText={setDraft} />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      title="Cancel"
                      variant="outline"
                      onPress={() => {
                        setOpenId(null);
                        setDraft("");
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title="Post answer"
                      onPress={() => submitAnswer(q.id)}
                      loading={answerMutation.isPending && answerMutation.variables?.id === q.id}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View className="mt-3">
                <Button
                  title="Answer"
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => {
                    setOpenId(q.id);
                    setDraft("");
                  }}
                />
              </View>
            )
          ) : null}
        </Card>
      ))}
    </ScrollView>
  );
}
