import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RNFetchBlob from 'rn-fetch-blob';
import { openDatabase } from 'react-native-sqlite-storage';
import { useAuth } from '../AuthContext';
const db = openDatabase({ name: 'PruebaDetalleFinal11.db', location: 'default' });

const { width } = Dimensions.get('window');

export default function MenuDesechos() {
  const navigation = useNavigation();
  const [unsyncedReports, setUnsyncedReports] = useState([]);
  const [unsyncedDetails, setUnsyncedDetails] = useState([]);
  const { user } = useAuth()
  useEffect(() => {
    fetchUnsyncedData(); // Llama a la función al cargar el componente
  }, []);

  const fetchUnsyncedData = async () => {
    const reports = await getUnsyncedReports();
    const details = await getUnsyncedDetails();
    setUnsyncedReports(reports);
    setUnsyncedDetails(details);
  };

  // Función para obtener reportes no sincronizados
  const getUnsyncedReports = () => {
    return new Promise((resolve, reject) => {
      db.transaction((txn) => {
        txn.executeSql(
          'SELECT * FROM ReporteDesechos WHERE estado != "S"',
          [],
          (_, result) => {
            const reports = [];
            for (let i = 0; i < result.rows.length; ++i) {
              reports.push(result.rows.item(i));
            }
            resolve(reports);
          },
          (_, error) => {
            console.error('Error al obtener reportes no sincronizados:', error);
            reject(error);
          }
        );
      });
    });
  };

  // Función para obtener detalles no sincronizados
  const getUnsyncedDetails = () => {
    return new Promise((resolve, reject) => {
      db.transaction((txn) => {
        txn.executeSql(
          'SELECT * FROM DetalleReporteDesechos WHERE estado != "S"',
          [],
          (_, result) => {
            const details = [];
            for (let i = 0; i < result.rows.length; ++i) {
              details.push(result.rows.item(i));
            }
            resolve(details);
          },
          (_, error) => {
            console.error('Error al obtener detalles no sincronizados:', error);
            reject(error);
          }
        );
      });
    });
  };

  // Función para sincronizar los reportes y detalles con el servidor
  const syncReportsWithServer = async () => {
    const apiUrl = 'http://100.10.10.198:3000/api/v1/uploadReportesDesechos';

    try {
      const response = await RNFetchBlob.fetch(
        'POST',
        apiUrl,
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`, // Suponiendo que ya tienes el token de usuario
        },
        JSON.stringify({
          reportes: unsyncedReports,
          detalles: unsyncedDetails,
        })
      );

      const responseData = response.json();
      if (responseData.status === 200) {
        console.log('Sincronización exitosa:', responseData);
        Alert.alert('Sincronización completada', 'Los reportes y detalles se sincronizaron con éxito.');
        await markReportsAsSynced();
        await markDetailsAsSynced();
      } else {
        console.error('Error en la sincronización:', responseData);
        Alert.alert('Error', 'No se pudo completar la sincronización.');
      }
    } catch (error) {
      console.error('Error al sincronizar:', error);
      Alert.alert('Error', 'Ocurrió un error durante la sincronización.');
    }
  };

  // Función para marcar reportes como sincronizados
  const markReportsAsSynced = () => {
    return new Promise((resolve, reject) => {
      db.transaction((txn) => {
        txn.executeSql(
          'UPDATE ReporteDesechos SET estado = "S" WHERE estado != "S"',
          [],
          (_, result) => {
            resolve(result);
          },
          (_, error) => {
            console.error('Error al marcar reportes como sincronizados:', error);
            reject(error);
          }
        );
      });
    });
  };

  // Función para marcar detalles como sincronizados
  const markDetailsAsSynced = () => {
    return new Promise((resolve, reject) => {
      db.transaction((txn) => {
        txn.executeSql(
          'UPDATE DetalleReporteDesechos SET estado = "S" WHERE estado != "S"',
          [],
          (_, result) => {
            resolve(result);
          },
          (_, error) => {
            console.error('Error al marcar detalles como sincronizados:', error);
            reject(error);
          }
        );
      });
    });
  };

  // Función para manejar la sincronización
  const handleSyncReports = async () => {
    try {
      if (unsyncedReports.length === 0 && unsyncedDetails.length === 0) {
        Alert.alert('Sin datos', 'No hay reportes o detalles pendientes de sincronización.');
        return;
      }

      await syncReportsWithServer();
    } catch (error) {
      console.error('Error en la sincronización:', error);
    }
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  // Menú de reportes de desechos
  const menuItems = [
    { text: 'Crear Reporte', imageSource: require('../../src/img/ReporteDes.png'), screenName: 'Reporte Desechos' },
    { text: 'Listas de Reportes', imageSource: require('../../src/img/listaReporte.png'), screenName: 'Lista de Reportes' },
    {
      text: 'Sincronizar Reportes',
      imageSource: require('../../src/img/sincronizar.png'),
      onPress: handleSyncReports, // Llamada directa a la función de sincronización
    },
    
  ];
  const handleMenuItemPress = (screenName, onPress) => {
    if (onPress) {
      onPress(); // Ejecutar la función personalizada si está definida
    } else {
      navigateToScreen(screenName); // Navegar a la pantalla si no hay función personalizada
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Ingenio Madre Tierra</Text>
        <Image
          source={require('../../src/img/logo-menu-2.png')}
          style={styles.headerImage}
        />
      </View>
      <Text> </Text>
      <Text style={styles.header}>Menu de Reportes de Desechos</Text>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
          key={index}
          style={styles.menuButton}
          onPress={() => handleMenuItemPress(item.screenName, item.onPress)}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: 'green',
    flexDirection: 'row',
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    marginBottom:10,
    top: 0,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  headerImage: {
    width: 100,
    height: 80,
    marginLeft: 10,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuButton: {
    backgroundColor: 'white',
    width: (width / 2) - 16,
    margin: 8,
    padding: 10,
    borderRadius: 5,
    borderColor: 'black',
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonImage: {
    width: 50,
    height: 50,
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
  },
});