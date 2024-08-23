import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar, // Importa StatusBar
} from 'react-native';
import { useAuth } from '../AuthContext';

const { width } = Dimensions.get('window');

export default function MenuScreen({ navigation }) {
  const { user } = useAuth();

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  const menuItems = [
    { text: 'Crear Reporte', imageSource: require('../../src/img/ReporteDes.png'), screenName: 'ReporteSSO' },
    { text: 'Listas de Reportes', imageSource: require('../../src/img/ReportesDesechos.png'), screenName: 'CorreccionSSO' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="green" barStyle="light-content" />  
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Ingenio Madre Tierra</Text>
        <Image
          source={require('../../src/img/logo-menu-2.png')}
          style={styles.headerImage}
        />
      </View>
      <Text style={styles.subHeader}>Menú de Reportes de Desechos</Text>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuButton}
            onPress={() => navigateToScreen(item.screenName)}
          >
            <Image source={item.imageSource} style={styles.buttonImage} />
            <Text style={styles.buttonText}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',  // Fondo suave para un aspecto más moderno
  },
  headerContainer: {
    backgroundColor: 'green',  // Color del header ajustado
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',  // Mejora la distribución del contenido
  },
  headerText: {
    fontSize: 24,
    color: '#ECF0F1',  // Color de texto más claro
    fontWeight: 'bold',
  },
  headerImage: {
    width: 60,
    height: 60,
  },
  subHeader: {
    fontSize: 20,
    marginTop: 20,
    textAlign: 'center',
    color: 'green',  // Color de texto subheader ajustado
    fontWeight: '500',
  },
  menuContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuButton: {
    backgroundColor: '#FFFFFF',
    width: (width / 2) - 30,  // Ajuste del ancho para mejor alineación
    marginVertical: 10,
    paddingVertical: 20,
    borderRadius: 10,  // Redondeado de botones
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,  // Sombra para dar un toque elevado
  },
  buttonImage: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    color: 'green',  // Texto de botones en un color contrastante
    fontWeight: '500',
  },
});
