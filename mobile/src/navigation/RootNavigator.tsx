import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { Text } from '@/components/Text';
import { colors, spacing, typography } from '@/design/tokens';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { MyAccountScreen } from '@/screens/MyAccountScreen';
import { MyPackagesScreen } from '@/screens/MyPackagesScreen';
import { MyRequestsScreen } from '@/screens/MyRequestsScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.white,
    card: colors.white,
    text: colors.neutral900,
    border: colors.neutral200,
    primary: colors.ink,
  },
};

export function RootNavigator() {
  const { user, hydrated } = useAuth();

  if (!hydrated) return <SplashScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <ResidentTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function ResidentTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.neutral400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { borderTopColor: colors.neutral200, paddingTop: 4 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon char="•" color={color} /> }}
      />
      <Tabs.Screen
        name="Packages"
        component={MyPackagesScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon char="◧" color={color} /> }}
      />
      <Tabs.Screen
        name="Requests"
        component={MyRequestsScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon char="✦" color={color} /> }}
      />
      <Tabs.Screen
        name="Account"
        component={MyAccountScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon char="◉" color={color} /> }}
      />
    </Tabs.Navigator>
  );
}

function TabIcon({ char, color }: { char: string; color: string }) {
  // Placeholder for the design team's chosen icon set (Lucide or
  // Phosphor for RN). Glyph fallback keeps the layout right.
  return <Text style={[typography.body, { color, fontSize: 18 }]}>{char}</Text>;
}

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    gap: spacing.lg,
  },
});
