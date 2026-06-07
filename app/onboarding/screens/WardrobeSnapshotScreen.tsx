import React from 'react';
import { View, Text, Button, FlatList, Image, StyleSheet } from 'react-native';
import { useOnboardingStore } from '../store/onboardingStore';
import type { WardrobeItem } from '../types';
import uuid from 'react-native-uuid';

export default function WardrobeSnapshotScreen({ navigation }: any) {
  const wardrobeItems = useOnboardingStore((s) => s.wardrobeItems);
  const addWardrobeItem = useOnboardingStore((s) => s.addWardrobeItem);
  const next = useOnboardingStore((s) => s.next);
  const prev = useOnboardingStore((s) => s.prev);

  // NOTE: replace with real signed upload flow / Cloudinary integration
  const mockUpload = async () => {
    const item: WardrobeItem = { id: String(uuid.v4()), imageUrl: 'https://placehold.co/200x200', category: 'top', tags: [] };
    addWardrobeItem(item);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload 1–5 wardrobe items (1 required)</Text>
      <FlatList data={wardrobeItems} keyExtractor={(i) => i.id!} renderItem={({ item }) => <Image source={{ uri: item.imageUrl }} style={styles.thumb} />} horizontal />
      <Button title="Mock Upload Image" onPress={mockUpload} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Button title="Back" onPress={() => { prev(); navigation.goBack(); }} />
        <Button title="Next" onPress={() => { if ((wardrobeItems || []).length < 1) return alert('Upload at least 1 item'); next(); navigation.navigate('Preview'); }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 18, marginBottom: 12 },
  thumb: { width: 100, height: 100, marginRight: 8, borderRadius: 8 },
});
