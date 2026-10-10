import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ShoppingCart, Package, Truck, TrendingUp, ListTodo } from 'lucide-react-native';

import KasirScreen from './src/screens/KasirScreen';
import ProdukScreen from './src/screens/ProdukScreen';
import PembelianScreen from './src/screens/PembelianScreen';
import LaporanScreen from './src/screens/LaporanScreen';
import BelanjaScreen from './src/screens/BelanjaScreen';
import { Theme } from './src/theme';

const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  
  // Memberikan ruang aman untuk 3 tombol sistem Android (Home, Back, Recent App) atau navigation gesture bar
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 8);
  const tabHeight = 60 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, focused }) => {
          const iconSize = 22;
          let IconComponent = ShoppingCart;
          if (route.name === 'Kasir') IconComponent = ShoppingCart;
          else if (route.name === 'Produk') IconComponent = Package;
          else if (route.name === 'Kulakan') IconComponent = Truck;
          else if (route.name === 'Laporan') IconComponent = TrendingUp;
          else if (route.name === 'Belanja') IconComponent = ListTodo;

          return (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <IconComponent
                color={focused ? '#2563EB' : '#64748B'}
                size={iconSize}
                strokeWidth={focused ? 2.4 : 1.9}
              />
            </View>
          );
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Kasir" component={KasirScreen} options={{ tabBarLabel: 'Kasir' }} />
      <Tab.Screen name="Produk" component={ProdukScreen} options={{ tabBarLabel: 'Produk' }} />
      <Tab.Screen name="Kulakan" component={PembelianScreen} options={{ tabBarLabel: 'Kulakan' }} />
      <Tab.Screen name="Laporan" component={LaporanScreen} options={{ tabBarLabel: 'Laporan' }} />
      <Tab.Screen name="Belanja" component={BelanjaScreen} options={{ tabBarLabel: 'Belanja' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <NavigationContainer>
        <MainTabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBoxActive: {
    backgroundColor: '#EFF6FF',
  },
});

