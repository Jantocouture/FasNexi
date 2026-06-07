import React from 'react';
import { View, Text, Button, Switch, StyleSheet } from 'react-native';
import { useOnboardingStore } from '../store/onboardingStore';

export default function LifestyleScreen({ navigation }: any) {
  const sustainabilityPriority = useOnboardingStore((s) => s.sustainabilityPriority);
  const setField = useOnboardingStore((s) => s.setField);
  const next = useOnboardingStore((s) => s.next);
  const prev = useOnboardingStore((s) => s.prev);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lifestyle & Preferences (optional)</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
        <Text style={{ flex: 1 }}>Sustainability priority</Text>
        <Switch value={!!sustainabilityPriority} onValueChange={(v) => setField('sustainabilityPriority', v)} />
      </View>
      <Button title="Back" onPress={() => { prev(); navigation.goBack(); }} />
      <Button title="Next" onPress={() => { next(); navigation.navigate('WardrobeSnapshot'); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 18, marginBottom: 8 },
});
