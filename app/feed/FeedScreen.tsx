import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, Image, Alert, RefreshControl } from 'react-native';
import { fetchFeed } from '../api/feedClient';
import { subscribeToProfile, disconnectSocket } from '../api/socketClient';

export default function FeedScreen({ route }: any) {
  const { profileId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
    let unsubscribe: any;
    const setup = async () => {
      await load();
      if (!profileId) return;
      try {
        unsubscribe = await subscribeToProfile(profileId, (newItems: any[]) => {
          if (Array.isArray(newItems) && newItems.length > 0) {
            setItems(newItems);
          }
        });
      } catch (e) {
        console.warn('subscribe failed', e);
      }
    };
    setup();
    return () => {
      if (unsubscribe) unsubscribe();
      disconnectSocket();
    };
  }, [profileId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetchFeed(String(profileId));
      setItems(res.items || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load feed');
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
          ListEmptyComponent={<View style={styles.center}><Text>No items yet. We'll update in real time when they're ready.</Text></View>}
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
