import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Button, Alert, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { openDatabase } from 'react-native-sqlite-storage';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as ImagePicker from 'react-native-image-picker';

const db = openDatabase({ name: 'MadreTierraProduccion102.db' });

export default function CorreccionScreen({ route }) {
  const { reporte } = route.params;
  const [detalles, setDetalles] = useState([]);
  const [correcciones, setCorrecciones] = useState({});

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM DetalleSSO WHERE IdReporte = ?',
        [reporte.id],
        (tx, results) => {
          const rows = results.rows;
          let data = [];
          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i));
          }
          setDetalles(data);
        },
        (tx, error) => {
          console.error('Error al obtener detalles del reporte:', error);
        }
      );
    });
  }, []);

  const handleCorreccionChange = (idDetalle, value, field) => {
    setCorrecciones((prev) => ({
      ...prev,
      [idDetalle]: { ...prev[idDetalle], [field]: value },
    }));
  };

  const handleGenerateCorrectedPDF = async () => {
    const fechaCorreccion = new Date().toLocaleDateString();

    const detallesHTML = detalles
      .map((detalle) => {
        const correccion = correcciones[detalle.id_detalle] || {};
        return `
          <tr>
            <td rowspan="2">${detalle.hallazgo}</td>
            <td rowspan="2">${detalle.recomendacion}</td>
            <td style="width: 25%;">Hallazgo</td>
            <td style="width: 25%;">Corrección</td>
          </tr>
          <tr>
            <td style="width: 25%; text-align: center;"><img src="data:image/png;base64,${detalle.hallazgo_foto}" class="evidence-image" /></td>
            <td style="width: 25%; text-align: center;"><img src="data:image/png;base64,${correccion.correccion_foto || ''}" class="evidence-image" /></td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Inspección Corregido</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .container { width: 100%; margin: 0 auto; }
        .header-table, .main-table { width: 100%; border-collapse: collapse; }
        .header-table td, .main-table th, .main-table td { border: 1px solid black; padding: 3px; }
        .logo { width: 50px; height: auto; }
        .center-align { text-align: center; font-size: 10px; white-space: nowrap; }
        .left-align { text-align: left; padding-left: 5px; font-size: 10px; }
        .main-table th, .main-table td { font-size: 10px; }
        .evidence-image { width: 125px; height: 125px; }
    </style>
</head>
<body>
    <div class="container">
        <table class="header-table">
            <tr>
                <td rowspan="4" style="width: 10%;"><img src="" alt="Logo" class="logo"></td>
                <td rowspan="4" colspan="7" class="center-align" style="width: 75%;">INFORME DE INSPECCIÓN CORREGIDO</td>
                <td class="left-align" style="width: 15%;">Código: 1-RH-G-R-017</td>
            </tr>
            <tr>
                <td class="left-align">Versión: 3</td>
            </tr>
            <tr>
                <td class="left-align">Fecha: ${new Date().toLocaleDateString()}</td>
            </tr>
            <tr>
                <td class="left-align">Página: 1 de 1</td>
            </tr>
        </table>
        <table class="header-table">
            <tr>
                <td class="left-align" style="width: 50%;">AREA: ${reporte.area}</td>
                <td class="left-align" style="width: 25%;">FECHA DE HALLAZGO: ${reporte.fecha_hallazgo}</td>
                <td class="left-align" style="width: 25%;">FECHA DE CORRECCIÓN: ${fechaCorreccion}</td>
            </tr>
            <tr>
                <td class="left-align">RESPONSABLE INSPECCIÓN: ${reporte.responsable}</td>
                <td class="left-align" colspan="2">*TIPO DE INSPECCIÓN: SSO</td>
            </tr>
        </table>
        <table class="main-table">
            <tr>
                <th style="width: 25%;">HALLAZGOS</th>
                <th style="width: 25%;">RECOMENDACIÓN</th>
                <th colspan="2" style="width: 50%;">EVIDENCIA</th>
            </tr>
            ${detallesHTML}
            ${Array(5 - detalles.length)
              .fill(
                `<tr>
                    <td style="height: 150px;"></td>
                    <td style="height: 150px;"></td>
                    <td style="height: 150px;"></td>
                    <td style="height: 150px;"></td>
                </tr>`
              )
              .join('')}
        </table>
    </div>
</body>
</html>
`;

    const options = {
      html: htmlContent,
      fileName: `ReporteSSO_Corregido_${reporte.id}`,
      directory: 'Documents',
    };

    try {
      const pdfFile = await RNHTMLtoPDF.convert(options);
      Alert.alert('Éxito', `PDF corregido generado en: ${pdfFile.filePath}`);
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al generar el PDF');
      console.error(error);
    }
  };

  const pickImageForCorrection = (idDetalle) => {
    let options = { mediaType: 'photo', includeBase64: true };
    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.assets) {
        setCorrecciones((prev) => ({
          ...prev,
          [idDetalle]: { ...prev[idDetalle], correccion_foto: response.assets[0].base64 },
        }));
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Corrección del Reporte</Text>
      <Text style={styles.subtitle}>Área: {reporte.area}</Text>
      <Text style={styles.subtitle}>Fecha de Hallazgo: {reporte.fecha_hallazgo}</Text>
      <Text style={styles.subtitle}>Responsable: {reporte.responsable}</Text>

      {detalles.map((detalle) => (
        <View key={detalle.id_detalle} style={styles.detalleContainer}>
          <Text style={styles.detalleTitle}>Detalle de Hallazgo</Text>
          <Text style={styles.label}>Hallazgo:</Text>
          <Text>{detalle.hallazgo}</Text>
          <Text style={styles.label}>Recomendación:</Text>
          <Text>{detalle.recomendacion}</Text>
          <Image
            source={{ uri: `data:image/png;base64,${detalle.hallazgo_foto}` }}
            style={styles.image}
          />
          <Text style={styles.label}>Corrección:</Text>
          <TextInput
            value={correcciones[detalle.id_detalle]?.correccion || ''}
            onChangeText={(value) => handleCorreccionChange(detalle.id_detalle, value, 'correccion')}
            style={styles.input}
            placeholder="Escribe la corrección"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => pickImageForCorrection(detalle.id_detalle)}
          >
            <Text style={styles.buttonText}>Subir Foto de Corrección</Text>
          </TouchableOpacity>
          {correcciones[detalle.id_detalle]?.correccion_foto && (
            <Image
              source={{ uri: `data:image/png;base64,${correcciones[detalle.id_detalle].correccion_foto}` }}
              style={styles.image}
            />
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.generateButton} onPress={handleGenerateCorrectedPDF}>
        <Text style={styles.generateButtonText}>Generar PDF Corregido</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  detalleContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detalleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  image: {
    width: 100,
    height: 100,
    marginVertical: 10,
    borderRadius: 10,
  },
  generateButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
