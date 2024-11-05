import React, { useState, useEffect } from 'react';
import { ScrollView, Button, Alert, Image, View, Text, StyleSheet, StatusBar } from 'react-native';
import { TextInput } from 'react-native-paper';
import * as ImagePicker from 'react-native-image-picker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFetchBlob from 'rn-fetch-blob';
import { useAuth } from '../Configuracion/AuthContext';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { openDatabase } from 'react-native-sqlite-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export default function InformeInspeccionScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const db = openDatabase({ name: 'PruebaDetalleFinal11.db' });
  const [pdfPath, setPdfPath] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [areas, setAreas] = useState([]);
  const [fechaHallazgo, setFechaHallazgo] = useState(new Date());
  const [hallazgo, setHallazgo] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [hallazgos, setHallazgos] = useState([]);
  const [imageBase64, setImageBase64] = useState('');
  const [showDatePickerHallazgo, setShowDatePickerHallazgo] = useState(false);
  const [isProcessComplete, setIsProcessComplete] = useState(false);
  const [isGeneralDataLocked, setIsGeneralDataLocked] = useState(false);
  const [areaName, setAreaName] = useState('');


  const fetchAreas = () => {
    db.transaction((txn) => {
      txn.executeSql(
        'SELECT * FROM area',
        [],
        (tx, results) => {
          const fetchedAreas = [];
          for (let i = 0; i < results.rows.length; i++) {
            fetchedAreas.push(results.rows.item(i));
          }
          setAreas(fetchedAreas);
          if (fetchedAreas.length > 0) {
            setSelectedAreaId(fetchedAreas[0].id);
          }
        },
        (error) => {
          console.error('Error al obtener áreas:', error);
        }
      );
    });
  };

  useEffect(() => {
    fetchAreas();
    createTables();  // Asegurarnos de que las tablas estén creadas al cargar la vista
  }, []);

  // Crear las tablas si no existen
  const createTables = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS ReporteSSO (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_bd INTEGER,
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
          id_bd INTEGER,
          idreporte INTEGER,
          hallazgo TEXT,
          recomendacion TEXT,
          hallazgo_foto TEXT,
          estado TEXT,
          sincronizado TEXT,
          fecha_correccion TEXT,
          correccion_foto TEXT,
          FOREIGN KEY (idreporte) REFERENCES ReporteSSO (id)
        );`
      );
    }, (error) => {
      console.error('Error al crear las tablas:', error);
    }, () => {
      console.log('Tablas creadas exitosamente');
    });
  };

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
    let options = { mediaType: 'photo', includeBase64: true, maxWidth: 750,
    maxHeight: 750,
    quality: 0.1, };
    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.assets) {
        setImageBase64(response.assets[0].base64);
      }
    });
  };

  const takePhoto = () => {
    let options = { mediaType: 'photo', includeBase64: true, maxWidth: 750,
      maxHeight: 750,
      quality: 0.1,};
    ImagePicker.launchCamera(options, (response) => {
      if (response.assets) {
        setImageBase64(response.assets[0].base64);
      }
    });
  };

  const handleAreaChange = (itemValue) => {
    setSelectedAreaId(itemValue);
    const selectedAreaName = areas.find(area => area.id === itemValue)?.nombre;
    setAreaName(selectedAreaName);
  };

  const handleAddHallazgo = () => {
    if (!hallazgo || !recomendacion || !imageBase64) {
      Alert.alert('Error', 'Debe completar todos los campos de hallazgo, recomendación y seleccionar una foto.');
      return;
    }

    const newHallazgo = { hallazgo, recomendacion, imageBase64 };
    setHallazgos([...hallazgos, newHallazgo]);
    setHallazgo('');
    setRecomendacion('');
    setImageBase64('');

    setIsGeneralDataLocked(true);
  };

  const resetForm = () => {
    // Reiniciar los estados para limpiar la pantalla y reiniciar el formulario
    setPdfPath('');
    setSelectedAreaId(areas.length > 0 ? areas[0].id : null);
    setFechaHallazgo(new Date());
    setHallazgo('');
    setRecomendacion('');
    setHallazgos([]);
    setImageBase64('');
    setIsGeneralDataLocked(false);
    setIsProcessComplete(false);
  };

  const handleGeneratePDF = async () => {
    const informesDir = `${RNFetchBlob.fs.dirs.DownloadDir}/ReporteSSO`;
     const imageSourceBase64 = "data:image/png;base64,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";
    const fileName = `ReporteSSO_${areaName}`;
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
                <td rowspan="4" style="width: 10%;"><img src="${imageSourceBase64}" alt="Logo" class="logo"></td>
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
                <td class="left-align" style="width: 50%;">AREA: ${areaName}</td>
                <td class="left-align" style="width: 25%;">FECHA DE HALLAZGO: ${fechaHallazgo.toLocaleDateString()}</td>
                <td class="left-align" style="width: 25%;">FECHA DE CORRECCIÓN: </td>
            </tr>
            <tr>
                <td class="left-align">RESPONSABLE INSPECCIÓN: ${user.nombre}</td>
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

    const options = { html: htmlContent, fileName: 'Informe', directory: informesDir };

    try {
      const pdfFile = await RNHTMLtoPDF.convert(options);
      setPdfPath(pdfFile.filePath);
      const destinationPath = `${informesDir}/ReporteSSO_${areaName}.pdf`;



      const pdfBase64 = await RNFetchBlob.fs.readFile(pdfFile.filePath, 'base64');

      db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO ReporteSSO (reporte, responsable, fecha_hallazgo, area, estado, sincronizado) VALUES (?, ?, ?, ?, ?, ?)`,
          [pdfBase64, user.id, fechaHallazgo.toISOString(), selectedAreaId, 'PDC', 'N'],
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

      
              
       // Mover el archivo PDF a la carpeta de informes
       RNFetchBlob.fs.isDir(informesDir).then((isDir) => {
        if (!isDir) {
          // Crear carpeta si no existe
          RNFetchBlob.fs.mkdir(informesDir).then(() => {
            RNFetchBlob.fs.mv(pdfFile.filePath, destinationPath).then(() => {
              console.log('PDF movido exitosamente.');
            }).catch((error) => {
              console.error('Error al mover el PDF:', error);
            });
          }).catch((error) => {
            console.error('Error al crear la carpeta de informes:', error);
          });
        } else {
          RNFetchBlob.fs.mv(pdfFile.filePath, destinationPath).then(() => {
            console.log('PDF movido exitosamente.');
          }).catch((error) => {
            console.error('Error al mover el PDF:', error);
          });
        }
      }).catch((error) => {
        console.error('Error al verificar la carpeta de informes:', error);
      });

      // Confirmación al usuario
      Alert.alert(
        'ÉXITO',
        'Informe Creado y Hallazgos guardados.',
        [{ text: 'Ok' }],
        { cancelable: false }
      );


      setIsProcessComplete(true);

      // Reiniciar el formulario para hacer otro reporte
      resetForm();

    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al generar el PDF');
    }
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Ingenio Madre Tierra</Text>
        <Image
          source={require('../../src/img/logo-menu-2.png')}
          style={styles.headerImage}
        />
      </View>
      <StatusBar backgroundColor="green" barStyle="light-content" />
      <Text style={styles.headerTitle}></Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Datos Generales</Text>
        <Picker
          selectedValue={selectedAreaId}
          onValueChange={(itemValue) => handleAreaChange(itemValue)}
          style={styles.picker}
          enabled={!isGeneralDataLocked}
        >
          {areas.map((area) => (
            <Picker.Item key={area.id} label={area.nombre} value={area.id} />
          ))}
        </Picker>
        <View style={styles.datePickerContainer}>
          <Button title={`Fecha de Hallazgo: ${fechaHallazgo.toLocaleDateString()}`} onPress={() => setShowDatePickerHallazgo(true)} color="green" disabled={isGeneralDataLocked} />
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
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hallazgos y Recomendaciones</Text>
        <TextInput label="Hallazgo" value={hallazgo} onChangeText={setHallazgo} style={styles.input} mode="outlined" multiline numberOfLines={3} theme={{ colors: { primary: 'green' } }} />
        <TextInput label="Recomendación" value={recomendacion} onChangeText={setRecomendacion} style={styles.input} mode="outlined" multiline numberOfLines={3} theme={{ colors: { primary: 'green' } }} />
        <View style={{ flex: 1, flexDirection: 'row', marginBottom: 20 }}>  
          <View style={{ flex: 1, marginRight: 5 }}>
            <Button title='Seleccionar Foto' onPress={pickImageFromLibrary} color="green" />
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Button title='Tomar Foto' onPress={takePhoto} color="green" />
          </View>
        </View>
        {imageBase64 && (
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <Image source={{ uri: `data:image/png;base64,${imageBase64}` }} style={{ width: 200, height: 200 }} />
          </View>
        )}
        <Button title="Agregar Hallazgo" onPress={handleAddHallazgo} color="green" />
        <Text>  </Text>
        <Button title="Generar PDF" onPress={handleGeneratePDF} color="green" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'green',
    flexDirection: 'row',
    paddingVertical: 5,
    width: '105%',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    marginBottom: 80,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  visualizarButton: {
    backgroundColor: 'green',
    padding: 10,
    margin: 5,
  },
  headerImage: {
    width: 100,
    height: 80,
    marginLeft: 10,
  },
  header: {
    fontSize: 24,
    marginBottom: 100,
  },
  container: {
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'gray',
    marginBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'green',
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    marginBottom: 10,
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 20
  },
  button: {
    flex: 1,
    marginRight: 5
  },
});
