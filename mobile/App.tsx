import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ShoppingCart, Package, Truck, TrendingUp, ListTodo } from 'lucide-react-native';

import KasirScreen from './src/screens/KasirScreen';
import ProdukScreen from './src/screens/ProdukScreen';
import PembelianScreen from './src/screens/PembelianScreen';
import LaporanScreen from './src/screens/LaporanScreen';
import BelanjaScreen from './src/screens/BelanjaScreen';

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
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E2E8F0',
            borderTopWidth: 1,
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
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
