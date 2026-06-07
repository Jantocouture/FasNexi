import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, FlatList, Image } from 'react-native';
import { useOnboardingStore } from '../store/onboardingStore';
import { submitStyleProfile } from '../../api/styleProfileClient';
import { fetchFeed } from '../../api/feedClient';

export default function PreviewScreen({ navigation }: any) {
  const state = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [feedPreview, setFeedPreview] = useState<any[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const pollingRef = useRef({ attempts: 0, active: false });

  const finish = async () => {
    setLoading(true);
    try {
      const payload = {
        userId: null,
        archetypes: state.archetypes,
        bodyShape: state.bodyShape,
        measurements: state.measurements,
        fitPreference: state.fitPreference,
        occasionPriorities: state.occasionPriorities,
        colorPrefs: state.colorPrefs,
        favoriteDesigners: state.favoriteDesignerIds,
        budgetBand: state.budgetBand,
        sustainabilityPriority: state.sustainabilityPriority,
        wardrobeItems: state.wardrobeItems?.map((w) => ({ imageUrl: w.imageUrl, category: w.category, tags: w.tags }))
      };

      const resp = await submitStyleProfile(payload as any);
      // expect resp: { styleProfileId, feedJobId, wardrobeItems, feedPreview }
      setProfileId(resp.styleProfileId || null);
      setFeedPreview(Array.isArray(resp.feedPreview) ? resp.feedPreview : []);

      useOnboardingStore.getState().reset();
      Alert.alert('Success', 'Style DNA saved. Preview your feed below.');

      // start polling if preview empty
      if ((!resp.feedPreview || resp.feedPreview.length === 0) && resp.styleProfileId) {
        startPolling(resp.styleProfileId);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', String(err));
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (pid: string) => {
    if (pollingRef.current.active) return;
    pollingRef.current.active = true;
    pollingRef.current.attempts = 0;
    const maxAttempts = 12; // ~24s with 2s interval
    const intervalMs = 2000;

    const tick = async () => {
      if (!pollingRef.current.active) return;
      if (pollingRef.current.attempts >= maxAttempts) {
        pollingRef.current.active = false;
        return;
      }
      try {
        const res = await fetchFeed(pid);
        if (res.items && res.items.length > 0) {
          setFeedPreview(res.items.slice(0, 3));
          pollingRef.current.active = false;
          return;
        }
      } catch (err) {
        console.warn('preview poll error', err);
      }
      pollingRef.current.attempts += 1;
      setTimeout(tick, intervalMs);
    };
    setTimeout(tick, intervalMs);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preview & Confirmation</Text>
      <Text>Archetypes: {state.archetypes.join(', ')}</Text>
      <Text>Body: {state.bodyShape}</Text>
      <Text>Wardrobe Items: {(state.wardrobeItems || []).length}</Text>
      {loading ? <ActivityIndicator /> : <Button accessibilityLabel="finish" title="Finish — Start Exploring" onPress={finish} />}

      {feedPreview && feedPreview.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 18, marginBottom: 8 }}>Your Feed Preview</Text>
          <FlatList
            data={feedPreview}
            keyExtractor={(item, idx) => item.id || String(idx)}
            horizontal
            renderItem={({ item }) => (
              <View style={styles.previewCard}>
                {item.payload && item.payload.imageUrl ? (
                  <Image source={{ uri: item.payload.imageUrl }} style={styles.previewImage} />
                ) : (
                  <View style={[styles.previewImage, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text>{item.payload?.title || 'Outfit'}</Text>
                  </View>
                )}
                <Text numberOfLines={2} style={{ width: 140 }}>{item.payload?.title}</Text>
              </View>
            )}
          />
          <Button title="View full feed" onPress={() => navigation.navigate('Feed', { profileId })} />
        </View>
      )}

      {(!feedPreview || feedPreview.length === 0) && profileId && (
        <View style={{ marginTop: 12 }}>
          <Text>We’re fetching your personalized feed — this may take a moment.</Text>
          <Button title="Open full feed" onPress={() => navigation.navigate('Feed', { profileId })} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 20, marginBottom: 12 },
  previewCard: { width: 150, marginRight: 12 },
  previewImage: { width: 140, height: 140, borderRadius: 8, marginBottom: 6 },
});
