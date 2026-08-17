import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, type BadgeVariant, Card, EmptyState, InlineError } from "../../../components/ui";
import { useReviews } from "../hooks";
import type { GmbReviewReplyStatus } from "../../../types/reputation";

const REPLY_BADGE: Record<GmbReviewReplyStatus, { label: string; variant: BadgeVariant }> = {
  none: { label: "No reply", variant: "outline" },
  ai_drafted: { label: "AI draft pending", variant: "secondary" },
  posted: { label: "Replied", variant: "success" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons key={i} name={i < rating ? "star" : "star-outline"} size={14} color="#f59e0b" />
      ))}
    </View>
  );
}

/** Read-only for v1 — surfaces the AI draft / posted reply if present, no reply composer. */
export function ReviewsTab({ locationId }: { locationId: number }) {
  const reviews = useReviews({ location: locationId });

  if (reviews.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (reviews.isError) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <InlineError message="Couldn't load reviews." />
      </View>
    );
  }

  if (!reviews.data || reviews.data.length === 0) {
    return <EmptyState icon="star-outline" title="No reviews yet" />;
  }

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {reviews.data.map((r) => {
        const badge = REPLY_BADGE[r.reply_status];
        return (
          <Card key={r.id}>
            <View className="flex-row items-center justify-between gap-2 mb-1.5">
              <Text className="text-sm font-semibold text-foreground flex-1" numberOfLines={1}>
                {r.reviewer_display_name || "Anonymous"}
              </Text>
              <Badge label={badge.label} variant={badge.variant} />
            </View>
            <View className="flex-row items-center gap-2 mb-2">
              <Stars rating={r.rating} />
              {r.create_time ? (
                <Text className="text-xs text-muted-foreground">
                  {new Date(r.create_time).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
            {r.comment ? <Text className="text-sm text-foreground">{r.comment}</Text> : null}
            {r.reply_text ? (
              <View className="mt-3 rounded-lg bg-secondary p-3">
                <Text className="text-xs font-semibold text-secondary-foreground mb-1">Your reply</Text>
                <Text className="text-sm text-secondary-foreground">{r.reply_text}</Text>
              </View>
            ) : r.ai_draft_text ? (
              <View className="mt-3 rounded-lg bg-muted p-3">
                <Text className="text-xs font-semibold text-muted-foreground mb-1">AI draft (not posted)</Text>
                <Text className="text-sm text-foreground">{r.ai_draft_text}</Text>
              </View>
            ) : null}
          </Card>
        );
      })}
    </ScrollView>
  );
}
