import React from 'react';
import { View, Text, Button, StyleSheet, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../store/onboardingStore';

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const reset = useOnboardingStore((s) => s.reset);

  return (
    <ImageBackground source={{ uri: 'https://placehold.co/800x600' }} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Let's discover your Style DNA</Text>
        <Text style={styles.subtitle}>Personalized fashion recommendations start here.</Text>
        <Button title="Get Started" onPress={() => navigation.navigate('Archetype' as any)} />
        <Button title="Skip" onPress={() => { reset(); navigation.navigate('Preview' as any); }} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { padding: 24, backgroundColor: 'rgba(255,255,255,0.85)' },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { marginBottom: 16 },
});
