import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import des écrans
import AnneeScreen from '../screens/AnneeScreen';
import MoisScreen from '../screens/MoisScreen';
import SemaineScreen from '../screens/SemaineScreen';
import JourScreen from '../screens/JourScreen';
import ReminderScreen from '../screens/ReminderScreen';
import CorbeilleScreen from '../screens/CorbeilleScreen';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator 
        initialRouteName="Mois"
        screenOptions={{
          drawerActiveTintColor: '#2196F3',
          drawerInactiveTintColor: '#666',
          drawerStyle: {
            backgroundColor: '#f8f9fa',
            width: 250,
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
        <Drawer.Screen 
          name="Année" 
          component={AnneeScreen}
          options={{
            drawerIcon: ({ color }) => (
              <Ionicons name="calendar" size={20} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Mois" 
          component={MoisScreen}
          options={{
            drawerIcon: ({ color }) => (
              <Ionicons name="calendar-outline" size={20} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Semaine" 
          component={SemaineScreen}
          options={{
            drawerIcon: ({ color }) => (
              <Ionicons name="grid-outline" size={20} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Jour" 
          component={JourScreen}
          options={{
            drawerIcon: ({ color }) => (
              <Ionicons name="today-outline" size={20} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Reminder" 
          component={ReminderScreen}
          options={{
            drawerIcon: ({ color }) => (
              <Ionicons name="alarm-outline" size={20} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Corbeille" 
          component={CorbeilleScreen}
          options={{
            drawerIcon: ({ color }) => (
              <Ionicons name="trash-outline" size={20} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
