/**
 * Generic debounced catalog search cell — modeled on clinical's
 * InvestigationSearchCell. Renders results as a plain mapped list, not a
 * FlatList: this component always sits inside an outer form ScrollView, and
 * results are already capped to ~20 rows by the API call, so there's
 * nothing to virtualize — a FlatList here would nest a VirtualizedList
 * inside a same-orientation ScrollView, which RN warns against.
 */
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

export interface CatalogOption {
  id: number;
  label: string;
  price: string;
}

interface CatalogSearchFieldProps {
  placeholder: string;
  search: (query: string) => Promise<CatalogOption[]>;
  onPick: (option: CatalogOption) => void;
}

export function CatalogSearchField({ placeholder, search, onPick }: CatalogSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function handleQueryChange(text: string) {
    setQuery(text);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await search(text.trim()));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }

  return (
    <View className="gap-1">
      <TextInput
        value={query}
        onChangeText={handleQueryChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      {open && (loading || results.length > 0) ? (
        <View className="rounded-lg border border-border bg-popover overflow-hidden">
          {loading ? (
            <View className="p-3">
              <ActivityIndicator size="small" />
            </View>
          ) : (
            results.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  onPick(item);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                className="flex-row items-center justify-between px-3 py-2.5 border-b border-border active:bg-accent"
              >
                <Text className="text-sm text-popover-foreground flex-1" numberOfLines={1}>
                  {item.label}
                </Text>
                <Text className="text-sm text-muted-foreground">₹{item.price}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
