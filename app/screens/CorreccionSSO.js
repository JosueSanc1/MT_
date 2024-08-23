import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function SeguimientoReportesScreen({ reportes }) {
  if (!reportes) {
    return (
      <View style={styles.container}>
        <Text>No hay reportes en seguimiento.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reportes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reporteItem}>
            <Text style={styles.title}>{item.titulo}</Text>
            <Text>Área: {item.area}</Text>
            <Text>Fecha de Hallazgo: {item.fechaHallazgo}</Text>
            <Text>Responsable: {item.responsable}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  reporteItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
});
