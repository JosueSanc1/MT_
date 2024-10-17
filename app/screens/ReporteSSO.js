import React, { useState, useEffect } from 'react';
import { ScrollView, Button, Alert, Image, View, Text, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import * as ImagePicker from 'react-native-image-picker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFetchBlob from 'rn-fetch-blob';
import { useAuth } from './AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { openDatabase } from 'react-native-sqlite-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export default function InformeInspeccionScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const db = openDatabase({ name: 'MadreTierraProduccion102.db' });
  const [pdfPath, setPdfPath] = useState('');
  const [area, setArea] = useState('');
  const [responsable, setResponsable] = useState('');
  const [fechaHallazgo, setFechaHallazgo] = useState(new Date());
  const [hallazgo, setHallazgo] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [hallazgos, setHallazgos] = useState([]);
  const [imageBase64, setImageBase64] = useState('');
  const [showDatePickerHallazgo, setShowDatePickerHallazgo] = useState(false);
  const [isProcessComplete, setIsProcessComplete] = useState(false);

  const verDatosGuardados = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM DetalleSSO WHERE estado = "Terminado" ',
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

  
  useEffect(() => { 
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS ReporteSSO (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reporte TEXT,
          responsable INTEGER,
          fecha_hallazgo TEXT,
          area TEXT,
          estado TEXT,
          sincronizado TEXT
        );`
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS DetalleSSO (
          id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
          IdReporte INTEGER,
          hallazgo TEXT,
          recomendacion TEXT,
          hallazgo_foto TEXT,
          estado TEXT,
          sincronizado TEXT,
          correccion TEXT,
          correccion_foto TEXT,
          FOREIGN KEY (IdReporte) REFERENCES ReporteSSO (id)
        );`
      );
    });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBeforeRemove = (e) => {
        if (!isProcessComplete) {
          e.preventDefault();
          Alert.alert(
            "Proceso Incompleto",
            "Debe finalizar el proceso generando el PDF antes de salir.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Salir sin guardar",
                style: "destructive",
                onPress: () => navigation.dispatch(e.data.action),
              },
            ]
          );
        }
      };

      navigation.addListener('beforeRemove', onBeforeRemove);

      return () => navigation.removeListener('beforeRemove', onBeforeRemove);
    }, [isProcessComplete, navigation])
  );

  const pickImageFromLibrary = () => {
    let options = { mediaType: 'photo', includeBase64: true };
    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.assets) {
        setImageBase64(response.assets[0].base64);
      }
    });
  };

  const takePhoto = () => {
    let options = { mediaType: 'photo', includeBase64: true };
    ImagePicker.launchCamera(options, (response) => {
      if (response.assets) {
        setImageBase64(response.assets[0].base64);
      }
    });
  };

  const handleAddHallazgo = () => {
    const newHallazgo = { hallazgo, recomendacion, imageBase64 };
    setHallazgos([...hallazgos, newHallazgo]);
    setHallazgo('');
    setRecomendacion('');
    setImageBase64('');
  };

  const handleGeneratePDF = async () => {
    const hallazgosHTML = hallazgos
      .map(
        (h) => `
          <tr>
            <td rowspan="2">${h.hallazgo}</td>
            <td rowspan="2">${h.recomendacion}</td>
            <td style="width: 25%;">Hallazgo</td>
            <td style="width: 25%;"></td>
          </tr>
          <tr>
            <td style="width: 25%; text-align: center;"><img src="data:image/png;base64,${h.imageBase64}" alt="Evidencia" class="evidence-image"></td>
            <td style="width: 25%;"></td>
          </tr>
        `
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
                <td rowspan="4" style="width: 10%;"><img src="" alt="Logo" class="logo"></td>
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
                <td class="left-align" style="width: 25%;">FECHA DE CORRECCION: ${fechaHallazgo.toLocaleDateString()}</td>
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
                <th colspan="2" style="width: 50%;">EVIDENCIA</th>
            </tr>  
            ${hallazgosHTML}
            ${Array(5 - hallazgos.length)
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

    const options = { html: htmlContent, fileName: 'Informe_Inspeccion', directory: 'Documents' };

    try {
      const pdfFile = await RNHTMLtoPDF.convert(options);
      setPdfPath(pdfFile.filePath);
      const pdfBase64 = await RNFetchBlob.fs.readFile(pdfFile.filePath, 'base64');

      db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO ReporteSSO (reporte, responsable, fecha_hallazgo, area, estado, sincronizado) VALUES (?, ?, ?, ?, ?, ?)`,
          [pdfBase64, user.id, fechaHallazgo.toISOString(), area, 'PDC', 'N'],
          (_, results) => {
            const idReporte = results.insertId;
            hallazgos.forEach((h) => {
              tx.executeSql(
                `INSERT INTO DetalleSSO (IdReporte, hallazgo, recomendacion, hallazgo_foto, estado, sincronizado) VALUES (?, ?, ?, ?, 'PDC', 'N')`,
                [idReporte, h.hallazgo, h.recomendacion, h.imageBase64]
              );
            });
          }
        );
      });

      setIsProcessComplete(true); // Marcar como finalizado el proceso
      Alert.alert('Éxito', `PDF generado en: ${pdfFile.filePath}`);
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al generar el PDF');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reporte SSO</Text>
      <TextInput label="Área" value={area} onChangeText={setArea} style={styles.input} theme={{ colors: { primary: 'green' } }} />
      <TextInput label="Responsable de Inspección" value={responsable} onChangeText={setResponsable} style={styles.input} theme={{ colors: { primary: 'green' } }} />
      <View style={styles.datePickerContainer}>
        <Button title={`Fecha de Hallazgo: ${fechaHallazgo.toLocaleDateString()}`} onPress={() => setShowDatePickerHallazgo(true)} color="green" />
        {showDatePickerHallazgo && (
          <DateTimePicker
            value={fechaHallazgo}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePickerHallazgo(false);
              if (selectedDate) setFechaHallazgo(selectedDate);
            }}
          />
        )}
      </View>
      <TextInput label="Hallazgo" value={hallazgo} onChangeText={setHallazgo} style={styles.input} theme={{ colors: { primary: 'green' } }} />
      <TextInput label="Recomendación" value={recomendacion} onChangeText={setRecomendacion} style={styles.input} theme={{ colors: { primary: 'green' } }} />
      <View style={styles.buttonContainer}>
        <Button title="Seleccionar Imagen" onPress={pickImageFromLibrary} color="green" />
        <Button title="Tomar Foto" onPress={takePhoto} color="green" />
      </View>
      {imageBase64 && (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Image source={{ uri: `data:image/png;base64,${imageBase64}` }} style={{ width: 200, height: 200 }} />
        </View>
      )}
      <Button title="Agregar Hallazgo" onPress={handleAddHallazgo} color="green" />
      <Button title="Generar PDF" onPress={handleGeneratePDF} color="green" />
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});
