import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { useAuth } from '../AuthContext';
import RNFetchBlob from 'rn-fetch-blob';
import { openDatabase } from 'react-native-sqlite-storage';

const { width } = Dimensions.get('window');

// Abrir la base de datos
const db = openDatabase({ name: 'MadreTierraProduccion102.db' });

export default function MenuScreen({ navigation }) {
  const { user } = useAuth();

  // Obtener reportes no sincronizados
  const getUnsyncedReports = () => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM ReporteSSO WHERE sincronizado = "SPC"',
          [],
          (tx, results) => {
            const reports = [];
            for (let i = 0; i < results.rows.length; i++) {
              reports.push(results.rows.item(i));
            }
            resolve(reports);
          },
          (error) => {
            console.error('Error al obtener reportes no sincronizados:', error);
            reject(error);
          }
        );
      });
    });
  };

  // Obtener detalles no sincronizados de un reporte
  const getUnsyncedDetails = (reportId) => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM DetalleSSO WHERE idreporte = ? AND sincronizado = "SPC"',
          [reportId],
          (tx, results) => {
            const details = [];
            for (let i = 0; i < results.rows.length; i++) {
              details.push(results.rows.item(i));
            }
            resolve(details);
          },
          (error) => {
            console.error('Error al obtener detalles no sincronizados:', error);
            reject(error);
          }
        );
      });
    });
  };

  // Marcar reportes como sincronizados
  const markReportsAsSynced = (reportIds) => {
    db.transaction((tx) => {
      const placeholders = reportIds.map(() => '?').join(',');
      tx.executeSql(
        `UPDATE ReporteSSO SET sincronizado = "S" WHERE id IN (${placeholders})`,
        reportIds
      );
    });
  };

  // Marcar detalles como sincronizados
  const markDetailsAsSynced = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE DetalleSSO SET sincronizado = "S" WHERE sincronizado = "N"',
        []
      );
    });
  };

  // Actualizar el campo id_bd en la base de datos local
  const updateIdBdInLocalDb = (reporteProcesado) => {
    db.transaction((tx) => {
      reporteProcesado.forEach((reporte) => {
        tx.executeSql(
          `UPDATE ReporteSSO SET id_bd = ? WHERE id = ?`,
          [reporte.id_bd, reporte.id],
          (_, result) => {
            console.log(`Reporte con id ${reporte.id} actualizado con id_bd ${reporte.id_bd}`);
          },
          (error) => {
            console.error('Error al actualizar id_bd en la base de datos local', error);
          }
        );
      });
    });
  };

  // Sincronizar reportes y detalles con el servidor
  const syncReportsWithServer = async () => {
    const apiUrl = 'http://100.10.10.198:3000/api/v1/uploadReportesSso';

    try {
      // Obtener reportes no sincronizados
      const unsyncedReports = await getUnsyncedReports();

      if (unsyncedReports.length === 0) {
        Alert.alert('Sincronización', 'No hay reportes para sincronizar.');
        return;
      }

      // Obtener detalles de cada reporte
      const unsyncedDetails = await Promise.all(
        unsyncedReports.map(async (report) => {
          const details = await getUnsyncedDetails(report.id);
          return {
            reporte: report,
            detalles: details,
          };
        })
      );

      // Enviar datos al servidor
      const response = await RNFetchBlob.fetch(
        'POST',
        apiUrl,
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        JSON.stringify({
          reportes: unsyncedReports,
          detalles: unsyncedDetails.flatMap((report) => report.detalles),
        })
      );

      const responseText = await response.text();
      const responseData = JSON.parse(responseText);

      if (responseData.status === 200) {
        console.log('Sincronización exitosa:', responseData);

        // Actualizar el campo id_bd en la base de datos local
        if (responseData.reporte_procesado && responseData.reporte_procesado.length > 0) {
          updateIdBdInLocalDb(responseData.reporte_procesado);
        }

        // Marcar reportes y detalles como sincronizados
        markReportsAsSynced(unsyncedReports.map((r) => r.id));
        markDetailsAsSynced();
        Alert.alert('Éxito', 'Reportes sincronizados correctamente.');
      } else {
        console.error('Error en la sincronización:', responseData);
        throw new Error('Error en la sincronización');
      }
    } catch (error) {
      console.error('Error en la sincronización:', error);
      Alert.alert('Error', 'Hubo un problema durante la sincronización.');
    }
  };

  // Descargar reportes desde el servidor
  const downloadReportsWithServer = async () => {
    const apiUrl = 'http://100.10.10.198:3000/api/v1/getReportesSso';

    try {
      const response = await RNFetchBlob.fetch(
        'GET',
        apiUrl,
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        }
      );

      const responseData = await response.json();

      if (responseData.code === 200 && responseData.status === 200) {
        db.transaction((tx) => {
          responseData.reportes.forEach((reporte) => {
            tx.executeSql(
              `INSERT OR REPLACE INTO ReporteSSO (id_bd, responsable, area, reporte, fecha_hallazgo, estado, sincronizado) 
               VALUES (?, ?, ?, ?, ?, ?, 'SPC')`,
              [reporte.id, reporte.user_movil_id, reporte.area_movil_id, reporte.reporte, reporte.fecha, reporte.estado_reporte]
            );
          });

          responseData.detalles.forEach((detalle) => {
            tx.executeSql(
              `INSERT OR REPLACE INTO DetalleSSO (id_bd, idreporte, hallazgo, recomendacion, hallazgo_foto, estado, sincronizado, fecha_correccion, correccion_foto) 
               VALUES (?, ?, ?, ?, ?, ?, 'SPC', ?, ?)`,
              [detalle.id, detalle.reporte_sso_id, detalle.hallazgo, detalle.recomendacion, detalle.hallazgo_foto, detalle.estado_reporte, detalle.fecha_correccion, detalle.correccion_foto]
            );
          });
        });

        Alert.alert('Éxito', 'Reportes descargados y guardados correctamente.');
      } else {
        console.error('Error en la descarga:', responseData);
        throw new Error('Error en la descarga');
      }
    } catch (error) {
      console.error('Error en la sincronización:', error);
      Alert.alert('Error', 'Hubo un problema durante la descarga.');
    }
  };

  // Navegar a otra pantalla
  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  const menuItems = [
    { text: 'Crear Reporte', imageSource: require('../../src/img/ReporteDes.png'), screenName: 'ReporteSSO' },
    { text: 'Listas de Reportes', imageSource: require('../../src/img/ReportesDesechos.png'), screenName: 'CorreccionSSO' },
    {
      text: 'Sincronizar Reportes',
      imageSource: require('../../src/img/sincronizar.png'),
      onPress: syncReportsWithServer,
    },
    {
      text: 'Descargar Reportes',
      imageSource: require('../../src/img/DescargarReporte.png'),
      onPress: downloadReportsWithServer,
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="green" barStyle="light-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Ingenio Madre Tierra</Text>
        <Image
          source={require('../../src/img/logo_menu_2.jpg')}
          style={styles.headerImage}
        />
      </View>
      <Text style={styles.subHeader}>Menú de Reportes SSO</Text>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuButton}
            onPress={() => (item.onPress ? item.onPress() : navigateToScreen(item.screenName))}
          >
            <Image source={item.imageSource} style={styles.buttonImage} />
            <Text style={styles.buttonText}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    backgroundColor: 'green',
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 24,
    color: '#ECF0F1',
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
    color: 'green',
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
    width: (width / 2) - 30,
    marginVertical: 10,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonImage: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    color: 'green',
    fontWeight: '500',
  },
});
