import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useOnboardingStore } from '../store/onboardingStore';

export default function PreviewScreen({ navigation }: any) {
  const state = useOnboardingStore();
  const finish = async () => {
    try {
      // TODO: replace with real API client
      // await fetch('/api/style-profile', { method: 'POST', body: JSON.stringify(state) })
      useOnboardingStore.getState().reset();
      alert('Style DNA saved. Welcome to FasNexi!');
      navigation.navigate('Home' as any);
    } catch (err) {
      alert('Error saving profile.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preview & Confirmation</Text>
      <Text>Archetypes: {state.archetypes.join(', ')}</Text>
      <Text>Body: {state.bodyShape}</Text>
      <Text>Wardrobe Items: {(state.wardrobeItems || []).length}</Text>
      <Button title="Finish — Start Exploring" onPress={finish} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 20, marginBottom: 12 },
});
