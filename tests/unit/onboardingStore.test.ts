// Unit test stubs for onboarding store
import { act } from '@testing-library/react-native';
import { useOnboardingStore } from '../../app/onboarding/store/onboardingStore';

describe('onboarding store', () => {
  beforeEach(() => {
    act(() => {
      useOnboardingStore.getState().reset();
    });
  });

  it('advances steps and stores archetypes', () => {
    act(() => {
      useOnboardingStore.getState().setField('archetypes', ['Cultural Fusion'] as any);
      useOnboardingStore.getState().next();
    });
    const state = useOnboardingStore.getState();
    expect(state.step).toBe(2);
    expect(state.archetypes).toContain('Cultural Fusion');
  });
});
