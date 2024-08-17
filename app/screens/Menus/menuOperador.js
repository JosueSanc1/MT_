import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import { openDatabase } from 'react-native-sqlite-storage';
import moment from 'moment';
import { useAuth } from '../AuthContext';




const { width } = Dimensions.get('window');

export default function MenuScreen({ navigation }) {
  const db = openDatabase({ name: 'MadreTierraProduccion100.db' });
  const { user } = useAuth();
  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  const handleSyncReports = async () => {
    try {
      
      // Obtener informes no sincronizados de la base de datos
      const unsyncedReports = await getUnsyncedReports();

      if (unsyncedReports.length === 0) {
        Alert.alert('Información', 'No hay informes para sincronizar.');
        return;
      }

      // Preparar los datos para enviar al servidor
      const reportsToSync = unsyncedReports.map((report) => ({
        id: report.id,
        reporte: report.reporte,
        user_created_id: report.user_created_id,
        syncronizado: report.fecha,
        usuario_movil_id: report.usuario_movil_id,
        area_id: report.area_id,
        tipo_inspeccion_id: report.tipo_inspeccion_id,
      }));

      // Realizar la sincronización con el servidor
      await syncReportsWithServer(reportsToSync);

      // Marcar los informes como sincronizados en la base de datos
      await markReportsAsSynced(unsyncedReports);

      Alert.alert('Éxito', 'Informes sincronizados correctamente.');
      console.log;
    } catch (error) {
      console.error('Error durante la sincronización:', error);
      Alert.alert('Error', 'Hubo un error durante la sincronización.');
    }
  };

  const getUnsyncedReports = () => {
    return new Promise((resolve, reject) => {
      db.transaction((txn) => {
        txn.executeSql(
          'SELECT * FROM table_informes WHERE estado != "S"',
          [],
          (_, result) => {
            const reports = [];
            for (let i = 0; i < result.rows.length; ++i) {
              reports.push(result.rows.item(i));
            }
            resolve(reports);
          },
          (_, error) => {
            console.error('Error al obtener informes no sincronizados:', error);
            reject(error);
          }
        );
      });
    });
  };

  const syncReportsWithServer = async (reports) => {
    const apiUrl = 'https://gdidev.sistemasmt.com.gt/api/v1/uploadReportes';
    

    try {
      const response = await RNFetchBlob.fetch(
        'POST',
        apiUrl,
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        JSON.stringify({ reportes: reports })
      );

      const responseText = await response.text();

      console.log('Respuesta del servidor:', responseText);

    // Intentar analizar la respuesta como JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error('Error al analizar la respuesta JSON:', error);
      throw new Error('Error en la sincronización');
    }

      if (responseData.status === 200) {
        console.log('Sincronización exitosa:', responseData);
      } else {
        console.error('Error en la sincronización:', responseData);
        throw new Error('Error en la sincronización');
      }
    } catch (error) {
      console.error('Error en la sincronización:', error);
      throw error;
    }
  };

  const markReportsAsSynced = (reports) => {
    return new Promise((resolve, reject) => {
      db.transaction((txn) => {
        const reportIds = reports.map((report) => report.id);
        const placeholders = Array(reportIds.length).fill('?').join(',');

        txn.executeSql(
          `UPDATE table_informes SET estado = "S" WHERE id IN (${placeholders})`,
          reportIds,
          (_, result) => {
            resolve(result);
          },
          (_, error) => {
            console.error('Error al marcar informes como sincronizados:', error);
            reject(error);
          }
        );
      });
    });
  };

  const menuItems = [
    { text: 'Crear Informes', imageSource: require('../../src/img/reporte.png'), screenName: 'Crear Informes' },
    { text: 'Informes', imageSource: require('../../src/img/listaReporte.png'), screenName: 'Informes' },
    {
      text: 'Sincronizar Reportes',
      imageSource: require('../../src/img/sincronizar.png'),
      onPress: handleSyncReports,
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
      <Text style={styles.header}>Menú</Text>

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

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.goBack()}
        >
          <Image source={require('../../src/img/exit.png')} style={styles.buttonImage} />
          <Text style={styles.buttonText}>Salir</Text>
        </TouchableOpacity>
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