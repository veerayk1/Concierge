import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/auth/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';

/**
 * App root.
 *
 * Order matters:
 *   - GestureHandlerRootView wraps everything so React Navigation's
 *     swipe gestures and the screen transitions work natively.
 *   - SafeAreaProvider exposes safe-area insets to all child screens
 *     (notch / Dynamic Island / home indicator).
 *   - AuthProvider hydrates the JWT from SecureStore BEFORE the
 *     navigator decides whether to render the Login stack or the Tabs
 *     stack.
 *   - RootNavigator owns the switch between unauthenticated and
 *     authenticated stacks.
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
