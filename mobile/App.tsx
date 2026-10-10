import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ShoppingCart, Package, Truck, TrendingUp, ListTodo } from 'lucide-react-native';

import KasirScreen from './src/screens/KasirScreen';
import ProdukScreen from './src/screens/ProdukScreen';
import PembelianScreen from './src/screens/PembelianScreen';
import LaporanScreen from './src/screens/LaporanScreen';
import BelanjaScreen from './src/screens/BelanjaScreen';

import { Theme } from './src/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            const iconSize = size || 22;
            if (route.name === 'Kasir') {
              return <ShoppingCart color={color} size={iconSize} />;
            } else if (route.name === 'Produk') {
              return <Package color={color} size={iconSize} />;
            } else if (route.name === 'Kulakan') {
              return <Truck color={color} size={iconSize} />;
            } else if (route.name === 'Laporan') {
              return <TrendingUp color={color} size={iconSize} />;
            } else if (route.name === 'Belanja') {
              return <ListTodo color={color} size={iconSize} />;
            }
          },
          tabBarActiveTintColor: Theme.colors.tertiary,
          tabBarInactiveTintColor: Theme.colors.textMuted,
          tabBarStyle: {
            backgroundColor: Theme.colors.neutral,
            borderTopColor: Theme.colors.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
            shadowColor: Theme.colors.primary,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Kasir" component={KasirScreen} />
        <Tab.Screen name="Produk" component={ProdukScreen} />
        <Tab.Screen name="Kulakan" component={PembelianScreen} />
        <Tab.Screen name="Laporan" component={LaporanScreen} />
        <Tab.Screen name="Belanja" component={BelanjaScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
