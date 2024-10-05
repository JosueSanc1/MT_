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

  // Sincronización de reportes y detalles
  const handleSyncReports = async () => {
    try {
      // Obtener reportes y detalles no sincronizados
      const unsyncedReports = await getUnsyncedReports();
      const unsyncedDetails = await getUnsyncedDetails();

      if (unsyncedReports.length === 0) {
        Alert.alert('Información', 'No hay informes para sincronizar.');
        return;
      }

      // Preparar los datos de reportes
      const reportsToSync = unsyncedReports.map((report) => ({
        id: report.IdReporte,
        reporte: report.Reporte,
        responsable: report.Responsable,
        proceso: report.Proceso,
        observacion: report.Observacion,
        fecha: report.Fecha,
        user_created_id: report.user_created_id,
        usuario_movil_id: report.usuario_movil_id,
      }));

      // Preparar los datos de detalles
      const detailsToSync = unsyncedDetails.map((detail) => ({
        id_detalle: detail.IdDetalle,
        id_reporte: detail.IdReporte,
        ubicaciones: detail.Ubicaciones,
        suficientes: detail.Suficientes,
        rotulados: detail.Rotulados,
        tapados: detail.Tapados,
        limpios: detail.Limpios,
        ordenados: detail.Ordenados,
        recoleccion_frecuente: detail.RecoleccionFrecuente,
        carton: detail.Carton,
        plasticos: detail.Plasticos,
        metales: detail.Metales,
        organicos: detail.Organicos,
        electronicos: detail.Electronicos,
        inorganicos: detail.Inorganicos,
        porcentaje_total: detail.porcentajeTotal,
        observacion: detail.Observacion,
      }));

      // Sincronizar ambos con el servidor
      await syncReportsWithServer(reportsToSync, detailsToSync);

      // Marcar como sincronizados en la base de datos
      await markReportsAsSynced(unsyncedReports);
      await markDetailsAsSynced(unsyncedDetails);

      Alert.alert('Éxito', 'Informes y detalles sincronizados correctamente.');
    } catch (error) {
      console.error('Error durante la sincronización:', error);
      Alert.alert('Error', 'Hubo un error durante la sincronización.');
    }
  };

  // Obtener reportes no sincronizados
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
            console.error('Error al obtener informes no sincronizados:', error);
            reject(error);
          }
        );
      });
    });
  };

  // Obtener detalles no sincronizados
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

  // Sincronizar con el servidor
  const syncReportsWithServer = async (reports, details) => {
    const apiUrl = 'https://gdidev.sistemasmt.com.gt/api/v1/uploadReportes';

    try {
      const response = await RNFetchBlob.fetch(
        'POST',
        apiUrl,
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        JSON.stringify({ reportes: reports, detalles: details })
      );

      const responseText = await response.text();
      const responseData = JSON.parse(responseText);

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

  // Marcar reportes como sincronizados
  const markReportsAsSynced = (reports) => {
    return new Promise((resolve, reject) => {
      db.transaction((txn) => {
        const reportIds = reports.map((report) => report.IdReporte);
        const placeholders = Array(reportIds.length).fill('?').join(',');

        txn.executeSql(
          `UPDATE ReporteDesechos SET estado = "S" WHERE IdReporte IN (${placeholders})`,
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

  // Marcar detalles como sincronizados
  const markDetailsAsSynced = (details) => {
    return new Promise((resolve, reject) => {
      db.transaction((txn) => {
        const detailIds = details.map((detail) => detail.IdDetalle);
        const placeholders = Array(detailIds.length).fill('?').join(',');

        txn.executeSql(
          `UPDATE DetalleReporteDesechos SET estado = "S" WHERE IdDetalle IN (${placeholders})`,
          detailIds,
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

  // Menú de reportes de desechos
  const menuItems = [
    { text: 'Crear Reporte', imageSource: require('../../src/img/ReporteDes.png'), screenName: 'Reporte Desechos' },
    { text: 'Listas de Reportes', imageSource: require('../../src/img/ReportesDesechos.png'), screenName: 'Lista de Reportes' },
    {
      text: 'Sincronizar Reportes',
      imageSource: require('../../src/img/sincronizar.png'),
      onPress: syncReportsWithServer,
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
    marginBottom: 10,
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
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonImage: {
    width: 90,
    height: 90,
  },
  buttonText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
