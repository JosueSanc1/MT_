// StackOneNavigator.js
import { createStackNavigator } from "@react-navigation/stack";
import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import Login from "../screens/login";
import Menu from "../screens/Menus/menu";
import CrudScreen from "../screens/CrudScreen";
import CrearInformesScreen from "../screens/CrearInformesScreen";
import InformesScreen from "../screens/InformesScreen";
import Usuarios from "../screens/Usuarios"; //importamos los componentes
import MenuOperador from "../screens/Menus/menuOperador"
import MenuInspeccion from "../screens/Menus/MenuInspeccion"
import MenuDesechos from "../screens/Menus/MenuDesechos"
import ReporteDesechos from "../screens/ReporteDesechos"
import ListaReportes from "../screens/ListaReportes";
import SSO from "../screens/Menus/MenuSSO"
import ReporteSSO from "../screens/ReporteSSO";
import CorreccionSSO from "../screens/CorreccionSSO";
const Stack = createStackNavigator();

const StackOneNavigator = () => (
  <Stack.Navigator
    initialRouteName="login"
  >
    <Stack.Screen 
      name="Login" 
      component={Login} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Menú" 
      component={Menu} 
      options={{ headerShown: false }} // Ocultar el encabezado para la pantalla "Menú"
    />
    <Stack.Screen 
      name="Menú Operador" 
      component={MenuOperador} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="CRUD" 
      component={CrudScreen} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Crear Informes" 
      component={CrearInformesScreen} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Informes" 
      component={InformesScreen} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Usuarios" 
      component={Usuarios} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Menu Inspeccion" 
      component={MenuInspeccion} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Menu Desechos" 
      component={MenuDesechos} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Reporte Desechos" 
      component={ReporteDesechos} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Lista de Reportes" 
      component={ListaReportes} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="SSO" 
      component={SSO} 
      options={{ headerShown: false }} 
    />

    <Stack.Screen 
      name="ReporteSSO" 
      component={ReporteSSO} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="CorreccionSSO" 
      component={CorreccionSSO} 
      options={{ headerShown: false }} 
    />
  </Stack.Navigator>
);

export default StackOneNavigator;
