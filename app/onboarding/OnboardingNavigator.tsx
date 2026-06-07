import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from './screens/WelcomeScreen';
import ArchetypeScreen from './screens/ArchetypeScreen';
import BodyFitScreen from './screens/BodyFitScreen';
import LifestyleScreen from './screens/LifestyleScreen';
import WardrobeSnapshotScreen from './screens/WardrobeSnapshotScreen';
import PreviewScreen from './screens/PreviewScreen';
import FeedScreen from '../feed/FeedScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Archetype" component={ArchetypeScreen} />
      <Stack.Screen name="BodyFit" component={BodyFitScreen} />
      <Stack.Screen name="Lifestyle" component={LifestyleScreen} />
      <Stack.Screen name="WardrobeSnapshot" component={WardrobeSnapshotScreen} />
      <Stack.Screen name="Preview" component={PreviewScreen} />
      <Stack.Screen name="Feed" component={FeedScreen} />
    </Stack.Navigator>
  );
}
