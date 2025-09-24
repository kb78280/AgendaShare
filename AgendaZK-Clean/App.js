import React from 'react';
import { StatusBar } from 'expo-status-bar';
import DrawerNavigator from './navigation/DrawerNavigator';

export default function App() {
  return (
    <>
      <DrawerNavigator />
      <StatusBar style="light" backgroundColor="#2196F3" />
    </>
  );
}
