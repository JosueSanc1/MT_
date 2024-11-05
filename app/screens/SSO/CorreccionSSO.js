import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, StatusBar } from 'react-native';
import { openDatabase } from 'react-native-sqlite-storage';

const db = openDatabase({ name: 'PruebaDetalleFinal11.db' });

export default function ListarReportesScreen({ navigation }) {
  const [reportes, setReportes] = useState([]);

  const verDatosGuardados = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM ReporteSSO',
        [],
        (tx, results) => {
          const rows = results.rows;
          let data = [];

          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i));
          }

          console.log("Datos guardados en ReporteDesechos:", data);
        },
        (tx, error) => {
          console.log("Error al consultar la tabla ReporteDesechos:", error);
        }
      );
    });
  };
       // useEffect para ejecutar la consulta cuando la vista se carga
  useEffect(() => {
    verDatosGuardados(); // Llamar la función para ver los datos guardados cuando el componente se monta
  }, []);

  // Obtener los reportes con estado "PDC"
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM ReporteSSO WHERE estado = "PDC"',
        [],
        (tx, results) => {
          const rows = results.rows;
          let data = [];

          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i));
          }

          setReportes(data);
        },
        (tx, error) => {
          console.error("Error al obtener reportes con estado PDC", error);
        }
      );
    });
  }, []);

  // Navegar a la pantalla de corrección
  const handleSelectReport = (reporte) => {
    navigation.navigate('CorreccionScreen', { reporte });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="green" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Ingenio Madre Tierra</Text>
        <Image
          source={require('../../src/img/logo-menu-2.png')}
          style={styles.headerImage}
        />
      </View>
      
      {/* Título */}
      <Text style={styles.title}>Agregar Correccion</Text>
      
      {/* Lista de reportes */}
      <FlatList
        data={reportes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.reportItem} onPress={() => handleSelectReport(item)}>
            <Text style={styles.reportText}>ID: {item.id}</Text>
            <Text style={styles.reportText}>Área: {item.area}</Text>
            <Text style={styles.reportText}>Fecha de Hallazgo: {item.fecha_hallazgo}</Text>
          </TouchableOpacity>
        )}
      />
      
      {reportes.length === 0 && <Text style={styles.noReportsText}>No hay reportes con estado "PDC".</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'green',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '112%',
    position: 'absolute',
    top: 0,  // Esto coloca el header en la parte superior de la pantalla
    zIndex: 1, // Asegura que esté encima del resto del contenido
  },
  headerText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  headerImage: {
    width: 80,
    height: 60,
  },
  container: {
    flex: 1,
    paddingTop: 80,  // Ajuste para que el contenido no quede oculto debajo del header
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'gray',
  },
  reportItem: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    elevation: 3, // Sombra para dar efecto de elevación
  },
  reportText: {
    fontSize: 16,
    color: '#333',
  },
  noReportsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
});
