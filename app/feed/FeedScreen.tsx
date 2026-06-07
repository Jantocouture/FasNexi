import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, Image, Alert } from 'react-native';
import { fetchFeed } from '../api/feedClient';

export default function FeedScreen({ route }: any) {
  const { profileId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!profileId) return;
    const load = async () => {
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
    load();
  }, [profileId]);

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
      {loading ? <ActivityIndicator /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.payload?.imageUrl ? <Image source={{ uri: item.payload.imageUrl }} style={styles.thumb} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.payload?.title}</Text>
                <Text numberOfLines={2}>{item.payload?.description || ''}</Text>
              </View>
            </View>
          )}
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
