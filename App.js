import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SeniorRegistrationScreen from './src/screens/SeniorRegistrationScreen';
import SeniorListScreen from './src/screens/SeniorListScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Import theme
import { theme } from './src/theme/theme';

// Import context providers
import { AuthProvider } from './src/context/AuthContext';
import { OfflineProvider } from './src/context/OfflineContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <OfflineProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#00af8f" />
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#00af8f',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Dashboard" 
                component={DashboardScreen}
                options={{ 
                  title: 'SCIMS Dashboard',
                  headerLeft: null,
                  gestureEnabled: false
                }}
              />
              <Stack.Screen 
                name="SeniorRegistration" 
                component={SeniorRegistrationScreen}
                options={{ title: 'Register Senior Citizen' }}
              />
              <Stack.Screen 
                name="SeniorList" 
                component={SeniorListScreen}
                options={{ title: 'Senior Citizens' }}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen}
                options={{ title: 'Profile' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </OfflineProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
