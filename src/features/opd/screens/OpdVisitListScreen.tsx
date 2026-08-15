import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Badge, EmptyState, Input, ListItem } from "../../../components/ui";
import type { OpdStackParamList } from "../../../navigation/OpdStack";
import { useQueue, useTodayVisits, useVisits } from "../hooks";
import type { VisitListItem, VisitStatus } from "../../../types/opd";

type Props = NativeStackScreenProps<OpdStackParamList, "OpdVisitList">;
type Tab = "today" | "queue" | "all";

const STATUS_VARIANT: Record<VisitStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  waiting: "warning",
  called: "default",
  in_consultation: "default",
  completed: "success",
  cancelled: "secondary",
  no_show: "destructive",
};

function VisitRow({ visit, onPress }: { visit: VisitListItem; onPress: () => void }) {
  return (
    <ListItem
      title={visit.patient_name}
      subtitle={`${visit.visit_number} · Dr. ${visit.doctor_name ?? "—"}`}
      leftIcon="person-outline"
      onPress={onPress}
      right={<Badge label={visit.status.replace("_", " ")} variant={STATUS_VARIANT[visit.status]} />}
    />
  );
}

export function OpdVisitListScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>("today");
  const [query, setQuery] = useState("");

  const today = useTodayVisits();
  const queue = useQueue();
  const all = useVisits(tab === "all" ? { search: query || undefined, ordering: "-visit_date" } : undefined);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "today", label: "Today" },
    { key: "queue", label: "Queue" },
    { key: "all", label: "All" },
  ];

  function goTo(id: number) {
    navigation.navigate("OpdVisitDetail", { visitId: id });
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-3">
        <View className="flex-row gap-2">
          {tabs.map((t) => (
            <Text
              key={t.key}
              onPress={() => setTab(t.key)}
              className={[
                "px-3 py-1.5 rounded-full text-sm font-medium overflow-hidden",
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
              ].join(" ")}
            >
              {t.label}
            </Text>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("NewOpdVisit")}
          className="h-9 w-9 items-center justify-center rounded-full bg-primary"
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </Pressable>
      </View>

      {tab === "all" ? (
        <View className="px-4 pt-3 pb-1">
          <Input placeholder="Search visit number or patient…" leftIcon="search-outline" value={query} onChangeText={setQuery} />
        </View>
      ) : null}

      {tab === "today" ? (
        today.isLoading ? (
          <ActivityIndicator className="mt-6" />
        ) : (
          <FlatList
            data={today.data ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <VisitRow visit={item} onPress={() => goTo(item.id)} />}
            ListEmptyComponent={<EmptyState icon="medkit-outline" title="No visits today" />}
          />
        )
      ) : null}

      {tab === "queue" ? (
        queue.isLoading ? (
          <ActivityIndicator className="mt-6" />
        ) : (
          <FlatList
            data={[
              ...(queue.data?.in_consultation ?? []),
              ...(queue.data?.called ?? []),
              ...(queue.data?.waiting ?? []),
            ]}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <VisitRow visit={item} onPress={() => goTo(item.id)} />}
            ListEmptyComponent={<EmptyState icon="people-outline" title="Queue is empty" />}
          />
        )
      ) : null}

      {tab === "all" ? (
        all.isLoading ? (
          <ActivityIndicator className="mt-6" />
        ) : (
          <FlatList
            data={all.data?.results ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <VisitRow visit={item} onPress={() => goTo(item.id)} />}
            ListEmptyComponent={<EmptyState icon="medkit-outline" title="No visits found" />}
          />
        )
      ) : null}
    </View>
  );
}
