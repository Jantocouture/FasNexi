import React from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useOnboardingStore } from '../store/onboardingStore';
import type { Archetype } from '../types';

const archetypes: Archetype[] = [
  'Bold & Vibrant',
  'Elegant & Timeless',
  'Street & Urban',
  'Cultural Fusion',
  'Sustainable & Conscious',
  'Avant-Garde',
];

export default function ArchetypeScreen({ navigation }: any) {
  const selected = useOnboardingStore((s) => s.archetypes);
  const setField = useOnboardingStore((s) => s.setField);
  const next = useOnboardingStore((s) => s.next);

  const toggle = (a: Archetype) => {
    const exists = selected.includes(a);
    const nextSel = exists ? selected.filter(s => s !== a) : [...selected, a];
    setField('archetypes', nextSel);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose 2–3 Archetypes</Text>
      <FlatList
        data={archetypes}
        keyExtractor={(i) => i}
        numColumns={2}
        renderItem={({ item }) => {
          const active = selected.includes(item);
          return (
            <TouchableOpacity style={[styles.card, active && styles.active]} onPress={() => toggle(item)}>
              <Text>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />
      <Button title="Next" onPress={() => { if (selected.length >= 2) { next(); navigation.navigate('BodyFit'); } else alert('Select 2–3 archetypes'); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, marginBottom: 12 },
  card: { flex: 1, margin: 8, padding: 12, borderWidth: 1, borderRadius: 8, alignItems: 'center' },
  active: { borderColor: '#D4AF37', borderWidth: 2 },
});
