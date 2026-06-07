import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, Image, Alert, RefreshControl } from 'react-native';
import { fetchFeed } from '../api/feedClient';

export default function FeedScreen({ route }: any) {
  const { profileId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const pollAttempts = useRef(0);
  const polling = useRef(false);

  const load = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const res = await fetchFeed(String(profileId));
      setItems(res.items || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [profileId]);

  // Polling: if no items, attempt to poll a few times to wait for background worker
  useEffect(() => {
    let abort = false;
    const startPolling = async () => {
      if (!profileId) return;
      if (polling.current) return;
      polling.current = true;
      pollAttempts.current = 0;
      const maxAttempts = 10; // ~20s with 2s interval
      const intervalMs = 2000;
      while (!abort && pollAttempts.current < maxAttempts) {
        if (items && items.length > 0) break;
        await new Promise((r) => setTimeout(r, intervalMs));
        try {
          const res = await fetchFeed(String(profileId));
          if (res.items && res.items.length > 0) {
            setItems(res.items);
            break;
          }
        } catch (err) {
          console.warn('poll error', err);
        }
        pollAttempts.current += 1;
      }
      polling.current = false;
    };

    if ((!items || items.length === 0) && profileId) startPolling();
    return () => { abort = true; };
  }, [profileId, items]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  if (!profileId) {
    return (
      <View style={styles.center}>
        <Text>No profile specified.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Feed</Text>
      {loading && items.length === 0 ? <ActivityIndicator /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.payload?.imageUrl ? <Image source={{ uri: item.payload.imageUrl }} style={styles.thumb} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.payload?.title}</Text>
                <Text numberOfLines={2}>{item.payload?.description || ''}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<View style={styles.center}><Text>No items yet. We'll keep looking — try pulling to refresh.</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, marginBottom: 12 },
  card: { flexDirection: 'row', marginBottom: 12, borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 8 },
  thumb: { width: 80, height: 80, marginRight: 12, borderRadius: 6 },
  cardTitle: { fontWeight: '600' },
});
