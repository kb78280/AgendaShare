import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import des écrans
import AnneeScreen from '../screens/AnneeScreen';
import MoisScreen from '../screens/MoisScreen';
import SemaineScreen from '../screens/SemaineScreen';
import JourScreen from '../screens/JourScreen';
import ReminderScreen from '../screens/ReminderScreen';

const Tab = createBottomTabNavigator();

export default function DrawerNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator 
        initialRouteName="Mois"
        screenOptions={{
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#f8f9fa',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
          },
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen 
          name="Année" 
          component={AnneeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Mois" 
          component={MoisScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Semaine" 
          component={SemaineScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Jour" 
          component={JourScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="today-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Reminder" 
          component={ReminderScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="alarm-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
