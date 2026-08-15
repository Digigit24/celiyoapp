import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabStrip, type TabStripItem } from "../../../components/ui";
import { AssistantSettingsTab } from "../components/tabs/AssistantSettingsTab";

type Tab = "assistant";

const TABS: TabStripItem<Tab>[] = [{ key: "assistant", label: "Assistant" }];

export function SettingsScreen() {
  const [tab, setTab] = useState<Tab>("assistant");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <View className="py-2.5 border-b border-border bg-card">
        <TabStrip tabs={TABS} activeKey={tab} onChange={setTab} />
      </View>
      {tab === "assistant" ? <AssistantSettingsTab /> : null}
    </SafeAreaView>
  );
}
