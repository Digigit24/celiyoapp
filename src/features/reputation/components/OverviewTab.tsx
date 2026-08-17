import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Card, InlineError } from "../../../components/ui";
// Cross-feature reuse: this is the app's only horizontal gauge/meter
// component. Built for the dashboard, but generic (no dashboard-specific
// data shape) — reused here instead of adding a second progress-bar
// implementation or a new charting dependency for one number. Flagged as a
// judgment call since no other feature currently reaches into
// features/dashboard.
import { ProgressMeter } from "../../dashboard/components/widgets";
import { useLocationMetrics, useLocationScore } from "../hooks";
import type { GmbLocationMetricDay } from "../../../types/reputation";

function sumMetrics(days: GmbLocationMetricDay[]) {
  return days.reduce(
    (acc, d) => ({
      views_maps: acc.views_maps + d.views_maps,
      views_search: acc.views_search + d.views_search,
      calls: acc.calls + d.calls,
      direction_requests: acc.direction_requests + d.direction_requests,
    }),
    { views_maps: 0, views_search: 0, calls: 0, direction_requests: 0 }
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export function OverviewTab({ locationId }: { locationId: number }) {
  const score = useLocationScore(locationId);
  const metrics = useLocationMetrics(locationId, 7);

  const totals = metrics.data ? sumMetrics(metrics.data) : null;

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Card>
        <Text className="text-sm font-semibold text-foreground mb-3">Optimization score</Text>
        {score.isLoading ? (
          <ActivityIndicator />
        ) : score.isError ? (
          <InlineError message="Couldn't load the optimization score." />
        ) : score.data ? (
          <>
            <View className="flex-row items-end gap-2 mb-3">
              <Text className="text-4xl font-extrabold" style={{ color: scoreColor(score.data.score) }}>
                {score.data.score}
              </Text>
              <Text className="text-base text-muted-foreground mb-1">/ 100</Text>
            </View>
            <ProgressMeter
              label="Listing health"
              value={`${score.data.score}/100`}
              percent={score.data.score}
              color={scoreColor(score.data.score)}
            />
            {score.data.signals.some((s) => s.earned_points < s.max_points) ? (
              <View className="mt-4 gap-3">
                <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Top improvements
                </Text>
                {score.data.signals
                  .filter((s) => s.earned_points < s.max_points)
                  .slice(0, 3)
                  .map((s) => (
                    <View key={s.key} className="gap-0.5">
                      <Text className="text-sm font-medium text-foreground">{s.label}</Text>
                      {s.recommendation ? (
                        <Text className="text-xs text-muted-foreground">{s.recommendation}</Text>
                      ) : null}
                    </View>
                  ))}
              </View>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card>
        <Text className="text-sm font-semibold text-foreground mb-3">This week</Text>
        {metrics.isLoading ? (
          <ActivityIndicator />
        ) : metrics.isError ? (
          <InlineError message="Couldn't load performance metrics." />
        ) : totals ? (
          <View className="flex-row flex-wrap gap-4">
            <MetricStat label="Maps views" value={totals.views_maps} />
            <MetricStat label="Search views" value={totals.views_search} />
            <MetricStat label="Calls" value={totals.calls} />
            <MetricStat label="Directions" value={totals.direction_requests} />
          </View>
        ) : null}
        <Text className="text-[11px] text-muted-foreground mt-3">
          Google's data lags 2-3 days — figures may not include the most recent day(s).
        </Text>
      </Card>
    </ScrollView>
  );
}

function MetricStat({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 min-w-[45%] gap-0.5">
      <Text className="text-xl font-bold text-foreground">{value.toLocaleString("en-IN")}</Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}
