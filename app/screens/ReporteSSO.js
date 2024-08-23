import React, { useState } from 'react';
import { ScrollView, Button, Alert, Image, View, Text, StyleSheet, FlatList } from 'react-native';
import { TextInput } from 'react-native-paper';
import * as ImagePicker from 'react-native-image-picker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFetchBlob from 'rn-fetch-blob';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function InformeInspeccionScreen({ navigation }) {
  const [area, setArea] = useState('');
  const [responsable, setResponsable] = useState('');
  const [fechaHallazgo, setFechaHallazgo] = useState(new Date());
  const [hallazgo, setHallazgo] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [hallazgos, setHallazgos] = useState([]);
  const [imageBase64, setImageBase64] = useState('');
  const [showDatePickerHallazgo, setShowDatePickerHallazgo] = useState(false);
  const [estado, setEstado] = useState('En seguimiento'); // Estado para el reporte
  const [reportes, setReportes] = useState([]); // Almacenamiento de reportes

  const pickImageFromLibrary = () => {
    let options = {
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 600,
      maxHeight: 600,
      quality: 0.8,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        setImageBase64(response.assets[0].base64);
      }
    });
  };

  const takePhoto = () => {
    let options = {
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 600,
      maxHeight: 600,
      quality: 0.8,
    };

    ImagePicker.launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
      } else {
        setImageBase64(response.assets[0].base64);
      }
    });
  };

  const handleAddHallazgo = () => {
    if (hallazgos.length < 5) {
      const newHallazgo = {
        hallazgo,
        recomendacion,
        imageBase64,
      };
      setHallazgos([...hallazgos, newHallazgo]);
      // Limpiar los campos
      setHallazgo('');
      setRecomendacion('');
      setImageBase64('');
    } else {
      Alert.alert('Límite alcanzado', 'No puedes agregar más de 5 hallazgos.');
    }
  };

  const handleSaveReport = () => {
    const nuevoReporte = {
      id: Math.random().toString(36).substr(2, 9), // ID único
      area,
      responsable,
      fechaHallazgo: fechaHallazgo.toLocaleDateString(),
      estado,
      hallazgos
    };

    setReportes([...reportes, nuevoReporte]);

    // Limpiar campos después de guardar
    setArea('');
    setResponsable('');
    setFechaHallazgo(new Date());
    setHallazgos([]);
    setImageBase64('');
    Alert.alert('Reporte guardado', 'El reporte ha sido guardado en seguimiento.');
  };

  const handleGeneratePDF = async () => {
    const hallazgosHTML = hallazgos
      .map(
        (h) => `
      <tr>
        <td>${h.hallazgo}</td>
        <td>${h.recomendacion}</td>
        <td style="width: 25%; text-align: center;"><img src="data:image/png;base64,${h.imageBase64}" alt="Evidencia" class="evidence-image"></td>
      </tr>`
      )
      .join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Inspección</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            margin: 0 auto;
        }
        .header-table, .main-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td, .main-table th, .main-table td {
            border: 1px solid black;
            padding: 3px;
        }
        .logo {
            width: 50px;
            height: auto;
        }
        .center-align {
            text-align: center;
            font-size: 10px;
            white-space: nowrap;
        }
        .left-align {
            text-align: left;
            padding-left: 5px;
            font-size: 10px;
        }
        .main-table th, .main-table td {
            font-size: 10px;
        }
        .evidence-image {
            width: 125px;
            height: 125px;
        }
    </style>
</head>
<body>
    <div class="container">
        <table class="header-table">
            <tr>
                <td rowspan="4" style="width: 10%;"><img src="data:image/png;base64,${imageBase64}" alt="Logo" class="logo"></td>
                <td rowspan="4" colspan="7" class="center-align" style="width: 75%;">INFORME DE INSPECCIÓN</td>
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
                <td class="left-align" style="width: 50%;">AREA: ${area}</td>
                <td class="left-align" style="width: 25%;">FECHA DE HALLAZGO: ${fechaHallazgo.toLocaleDateString()}</td>
                <td class="left-align" style="width: 25%;">ESTADO: ${estado}</td>
            </tr>
            <tr>
                <td class="left-align">RESPONSABLE INSPECCIÓN: ${responsable}</td>
                <td class="left-align" colspan="2">*TIPO DE INSPECCIÓN: SSO</td>
            </tr>
        </table>
        <table class="main-table">
            <tr>
                <th style="width: 25%;">HALLAZGOS</th>
                <th style="width: 25%;">RECOMENDACIÓN</th>
                <th style="width: 50%;">EVIDENCIA</th>
            </tr>
            ${hallazgosHTML}
            ${Array(5 - hallazgos.length)
              .fill(
                `<tr>
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
      fileName: 'Informe_Inspeccion',
      directory: 'Documents',
      width: 595,
      height: 842,
    };

    try {
      const pdfFile = await RNHTMLtoPDF.convert(options);
      const filePath = pdfFile.filePath;
      Alert.alert('Éxito', `PDF generado en: ${filePath}`);
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al generar el PDF');
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reporte SSO</Text>
      <TextInput
        label="Área"
        value={area}
        onChangeText={setArea}
        style={styles.input}
        underlineColor="green"
        theme={{ colors: { primary: 'green' } }}
      />
      <TextInput
        label="Responsable de Inspección"
        value={responsable}
        onChangeText={setResponsable}
        style={styles.input}
        underlineColor="green"
        theme={{ colors: { primary: 'green' } }}
      />
      <View style={styles.datePickerContainer}>
        <Button
          title={`Fecha de Hallazgo: ${fechaHallazgo.toLocaleDateString()}`}
          onPress={() => setShowDatePickerHallazgo(true)}
          color={styles.button.color}
        />
        {showDatePickerHallazgo && (
          <DateTimePicker
            value={fechaHallazgo}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePickerHallazgo(false);
              if (selectedDate) {
                setFechaHallazgo(selectedDate);
              }
            }}
          />
        )}
      </View>
      <TextInput
        label="Hallazgo"
        value={hallazgo}
        onChangeText={setHallazgo}
        style={styles.input}
        underlineColor="green"
        theme={{ colors: { primary: 'green' } }}
      />
      <TextInput
        label="Recomendación"
        value={recomendacion}
        onChangeText={setRecomendacion}
        style={styles.input}
        underlineColor="green"
        theme={{ colors: { primary: 'green' } }}
      />
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button title="Seleccionar Imagen" onPress={pickImageFromLibrary} color={styles.button.color} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Tomar Foto" onPress={takePhoto} color={styles.button.color} />
        </View>
      </View>
      {imageBase64 ? (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Image
            source={{ uri: `data:image/png;base64,${imageBase64}` }}
            style={{ width: 200, height: 200 }}
          />
        </View>
      ) : null}
      <View style={styles.addButton}>
        <Button title="Agregar Hallazgo" onPress={handleAddHallazgo} color={styles.button.color} />
      </View>
      <View style={styles.saveButton}>
        <Button title="Guardar Reporte en Seguimiento" onPress={handleSaveReport} color={styles.button.color} />
      </View>
      <View style={styles.generateButton}>
        <Button title="Generar PDF" onPress={handleGeneratePDF} color={styles.button.color} />
      </View>
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
    textAlign: 'center',
    color: 'green',
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  button: {
    color: 'green',
  },
  datePickerContainer: {
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  addButton: {
    marginBottom: 20,
  },
  saveButton: {
    marginBottom: 20,
  },
  generateButton: {
    marginTop: 20,
  },
});
