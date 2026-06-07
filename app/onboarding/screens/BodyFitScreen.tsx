import React from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { useOnboardingStore } from '../store/onboardingStore';

const bodyShapes = ['Rectangle','Hourglass','Pear','Apple','Inverted Triangle'];

export default function BodyFitScreen({ navigation }: any) {
  const bodyShape = useOnboardingStore((s) => s.bodyShape);
  const setField = useOnboardingStore((s) => s.setField);
  const next = useOnboardingStore((s) => s.next);
  const prev = useOnboardingStore((s) => s.prev);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select your body shape</Text>
      {bodyShapes.map((s) => (
        <TouchableOpacity key={s} style={[styles.item, bodyShape === s && styles.selected]} onPress={() => setField('bodyShape', s)}>
          <Text>{s}</Text>
        </TouchableOpacity>
      ))}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        <Button title="Back" onPress={() => { prev(); navigation.goBack(); }} />
        <Button title="Next" onPress={() => { if (!bodyShape) return alert('Choose a body shape'); next(); navigation.navigate('Lifestyle'); }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, marginBottom: 12 },
  item: { padding: 12, borderWidth: 1, marginBottom: 8, borderRadius: 8 },
  selected: { borderColor: '#D4AF37', borderWidth: 2 },
});
