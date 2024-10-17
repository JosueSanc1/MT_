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
  const db = openDatabase({ name: 'PruebaDetalleFinal11.db' });
  const { user } = useAuth();
  
  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  // Obtener informes no sincronizados
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

  // Obtener detalles de un informe específico que no estén sincronizados
  const getUnsyncedDetails = (reportId) => {
    return new Promise((resolve, reject) => {
      db.transaction((txn) => {
        txn.executeSql(
          'SELECT * FROM DetalleInforme WHERE idInforme = ? AND estado != "S"',
          [reportId],
          (_, result) => {
            const details = [];
            for (let i = 0; i < result.rows.length; ++i) {
              details.push(result.rows.item(i));
            }
            resolve(details);
          },
          (_, error) => {
            console.error('Error al obtener detalles no sincronizados del informe:', error);
            reject(error);
          }
        );
      });
    });
  };

  // Sincronizar informes y detalles en un solo nodo
  const syncReportsAndDetailsWithServer = async (reports) => {
    const apiUrl = 'http://100.10.10.198:3000/api/v1/uploadReportes';
  
    // Preparar los datos combinados de informes y detalles
    const dataToSync = [];
    for (const report of reports) {
      const reportDetails = await getUnsyncedDetails(report.id);
      const details = reportDetails.map((detail) => ({
        descripcion: detail.descripcion,
        foto1: detail.foto1, // Fotos en base64
        foto2: detail.foto2,
      }));

      dataToSync.push({
        id: report.id,
        reporte: report.reporte,
        user_created_id: report.user_created_id,
        syncronizado: report.fecha,
        usuario_movil_id: report.usuario_movil_id,
        area_id: report.area_id,
        tipo_inspeccion_id: report.tipo_inspeccion_id,
        detalles: details, // Añadimos los detalles al reporte
      });
    }

    try {
      const response = await RNFetchBlob.fetch(
        'POST',
        apiUrl,
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        JSON.stringify({ reportes: dataToSync }) // Se envían reportes y detalles juntos
      );
  
      const responseText = await response.text();
      console.log('Respuesta completa del servidor:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (error) {
        console.error('Error al analizar la respuesta JSON:', error);
        throw new Error('Error en la sincronización de datos');
      }

      if (responseData.status === 200) {
        console.log('Sincronización exitosa de reportes y detalles:', responseData);
      } else {
        console.error('Error en la sincronización:', responseData);
        throw new Error('Error en la sincronización de datos');
      }
    } catch (error) {
      console.error('Error en la sincronización de datos:', error);
      throw error;
    }
  };

  // Marcar informes como sincronizados en la base de datos
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

  // Marcar detalles como sincronizados en la base de datos
  const markDetailsAsSynced = (reports) => {
    return new Promise((resolve, reject) => {
      db.transaction((txn) => {
        const reportIds = reports.map((report) => report.id);
        const placeholders = Array(reportIds.length).fill('?').join(',');
  
        txn.executeSql(
          `UPDATE DetalleInforme SET estado = "S" WHERE report_id IN (${placeholders})`,
          reportIds,
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

  // Manejar la sincronización completa de informes y detalles en un solo nodo
  const handleSyncReports = async () => {
    try {
      // Obtener informes no sincronizados
      const unsyncedReports = await getUnsyncedReports();
  
      if (unsyncedReports.length === 0) {
        Alert.alert('Información', 'No hay informes para sincronizar.');
        return;
      }

      // Sincronizar informes y detalles en una sola petición
      await syncReportsAndDetailsWithServer(unsyncedReports);
  
      // Marcar detalles como sincronizados en la base de datos
      await markDetailsAsSynced(unsyncedReports);

      // Marcar informes como sincronizados en la base de datos
      await markReportsAsSynced(unsyncedReports);
  
      Alert.alert('Éxito', 'Informes y detalles sincronizados correctamente.');
    } catch (error) {
      console.error('Error durante la sincronización:', error);
      Alert.alert('Error', 'Hubo un error durante la sincronización.');
    }
  };

  const menuItems = [
    { text: 'Usuarios', imageSource: require('../../src/img/group_681494.png'), screenName: 'Usuarios' },
    {text: 'Reportes', imageSource: require('../../src/img/inspeccion.png'), screenName: 'Menu Inspeccion'},
    {text: 'Desechos', imageSource: require('../../src/img/desechos.png'), screenName: 'Menu Desechos'},
    {text: 'sso', imageSource: require('../../src/img/casco.png'), screenName: 'SSO'},
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
      <Text style={styles.header}>MENÚ</Text>

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
