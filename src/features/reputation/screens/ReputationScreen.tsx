import React, { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState, InlineError, Select, TabStrip, type TabStripItem } from "../../../components/ui";
import { useAuth } from "../../../store/AuthContext";
import { useReputationConnections, useReputationLocations } from "../hooks";
import { OverviewTab } from "../components/OverviewTab";
import { ReviewsTab } from "../components/ReviewsTab";
import { QnaTab } from "../components/QnaTab";

type Tab = "overview" | "reviews" | "qna";

const TABS: TabStripItem<Tab>[] = [
  { key: "overview", label: "Overview" },
  { key: "reviews", label: "Reviews" },
  { key: "qna", label: "Q&A" },
];

/**
 * Read-only Reputation dashboard. No OAuth connect flow, no listing editor,
 * no post composer, no review-reply composer — those stay web-only (see
 * docs/GMB_INTEGRATION.md's "Suggested mobile IA" in the dghms repo). The one
 * exception is answering a Q&A question, which is cheap and ungated on the
 * backend; see QnaTab for that call.
 */
export function ReputationScreen() {
  const { can } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [locationId, setLocationId] = useState<number | null>(null);

  const connections = useReputationConnections();
  // A connection can exist but be revoked (previously connected, then
  // disconnected from the web app) — treat that the same as "never
  // connected" rather than showing an empty/broken dashboard.
  const activeConnections = useMemo(
    () => (connections.data ?? []).filter((c) => c.status !== "revoked" && c.google_account_id),
    [connections.data]
  );
  const hasConnection = activeConnections.length > 0;

  const locations = useReputationLocations(hasConnection);

  const activeLocation = useMemo(() => {
    if (!locations.data || locations.data.length === 0) return null;
    if (locationId) return locations.data.find((l) => l.id === locationId) ?? locations.data[0];
    return locations.data[0];
  }, [locations.data, locationId]);

  const currentConnection = useMemo(
    () => activeConnections.find((c) => c.id === activeLocation?.connection),
    [activeConnections, activeLocation]
  );

  if (connections.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (connections.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <InlineError message="Couldn't load Reputation. Try again shortly." />
      </View>
    );
  }

  if (!hasConnection) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <EmptyState
          icon="storefront-outline"
          title="Google Business Profile isn't connected"
          message="Ask an admin to connect it from the web app under Settings → Reputation."
        />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      {locations.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : locations.isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <InlineError message="Couldn't load locations." />
        </View>
      ) : !activeLocation ? (
        <EmptyState
          icon="business-outline"
          title="No locations synced yet"
          message="Locations sync automatically after connecting — check back soon."
        />
      ) : (
        <>
          {(locations.data?.length ?? 0) > 1 ? (
            <View className="px-4 pt-3">
              <Select
                label="Location"
                value={String(activeLocation.id)}
                onChange={(v) => setLocationId(Number(v))}
                options={(locations.data ?? []).map((l) => ({
                  value: String(l.id),
                  label: l.internal_label || l.title,
                }))}
              />
            </View>
          ) : null}

          {currentConnection?.status === "error" ? (
            <View className="px-4 pt-3">
              <InlineError
                message={
                  currentConnection.last_error ||
                  "There was a problem syncing this Google Business Profile connection."
                }
              />
            </View>
          ) : null}

          <View className="py-2.5 border-b border-border bg-card mt-3">
            <TabStrip tabs={TABS} activeKey={tab} onChange={setTab} />
          </View>

          {tab === "overview" ? <OverviewTab locationId={activeLocation.id} /> : null}
          {tab === "reviews" ? <ReviewsTab locationId={activeLocation.id} /> : null}
          {tab === "qna" ? (
            <QnaTab locationId={activeLocation.id} canAnswer={can("hms.reputation.answer_questions")} />
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
}
