import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { openDatabase } from 'react-native-sqlite-storage';

const db = openDatabase({ name: 'MadreTierraProduccion102.db' });

export default function ListarReportesScreen({ navigation }) {
  const [reportes, setReportes] = useState([]);

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
      <Text style={styles.title}>Reportes con Estado "PDC"</Text>
      <FlatList
        data={reportes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.reportItem} onPress={() => handleSelectReport(item)}>
            <Text style={styles.reportText}>ID: {item.id}</Text>
            <Text style={styles.reportText}>Área: {item.area}</Text>
            <Text style={styles.reportText}>Responsable: {item.responsable}</Text>
            <Text style={styles.reportText}>Fecha de Hallazgo: {item.fecha_hallazgo}</Text>
          </TouchableOpacity>
        )}
      />
      {reportes.length === 0 && <Text>No hay reportes con estado "PDC".</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'green',
  },
  reportItem: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  reportText: {
    fontSize: 16,
    color: '#333',
  },
});
