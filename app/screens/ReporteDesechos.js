import React, { useState,useEffect } from 'react';
import { ScrollView, View, Alert,StyleSheet } from 'react-native';
import { Text, TextInput, Button, Appbar, Card, Title, Divider, Menu} from 'react-native-paper';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFetchBlob from 'rn-fetch-blob';
import moment from 'moment';
import { useAuth } from './AuthContext';
import axios from 'axios';

import { openDatabase } from 'react-native-sqlite-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

let db = openDatabase({ name: 'PruebaDetalleFinal11.db' });
// Definimos el color institucional
const INSTITUTIONAL_GREEN = 'green'; // Reemplaza con el código exacto del color verde institucional

const ReporteDesechos = () => {
  const { user } = useAuth();
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [Responsable, setResponsable] = useState('');
  const [Proceso, setProceso]=useState('');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [evaluationData, setEvaluationData] = useState([]);
  const [pdfPath, setPdfPath] = useState('');
  const [currentRow, setCurrentRow] = useState({
    ubicacion: '',
    suficientes: '',
    rotulados: '',
    tapados: '',
    limpios: '',
    ordenados: '',
    recoleccionFrecuente: '',
    carton: '',
    plasticos: '',
    metales: '',
    organicos: '',
    electronicos: '',
    inorganicos: '',
    porcentajeTotal: '',  // nuevo campo
    observacion: '',    // nuevo campo
  });
  const [isInfoGeneralEditable, setIsInfoGeneralEditable] = useState(true);
  
  const handleInputChange = (field, value) => {
    setCurrentRow((prevRow) => {
      const updatedRow = { ...prevRow, [field]: value };
  
      // Actualizar el porcentaje total cada vez que cambie un campo
      const nuevoPorcentajeTotal = calcularPorcentajeTotal(updatedRow);
      updatedRow.porcentajeTotal = nuevoPorcentajeTotal;
  
      return updatedRow;
    });
  };
  const verDatosGuardados = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM ReporteDesechos',
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

  const handleInputChange2 = (field, value) => {
    // Verificar si el valor es vacío y establecerlo a 0 en ese caso
    let numericValue = value === '' ? 0 : Number(value);
  
    // Validar si el número es mayor a 100
    if (numericValue > 100) {
      numericValue = 100;
      alert('El valor no puede ser mayor a 100');
    }
  
    // Asegurarnos de que no haya NaN
    if (isNaN(numericValue)) {
      numericValue = 0;
    }
  
    setCurrentRow((prevRow) => {
      const updatedRow = { ...prevRow, [field]: numericValue.toString() }; // Convertir a string
  
      // Actualizar el porcentaje total
      const nuevoPorcentajeTotal = calcularPorcentajeTotal(updatedRow);
      updatedRow.porcentajeTotal = nuevoPorcentajeTotal;
  
      return updatedRow;
    });
  };
  
  
  

  const handleAddRow = () => {
    if (evaluationData.length < 20) {
      setEvaluationData([...evaluationData, currentRow]);
      setCurrentRow({
        ubicacion: '',
        suficientes: '',
        rotulados: '',
        tapados: '',
        limpios: '',
        ordenados: '',
        recoleccionFrecuente: '',
        carton: '',
        plasticos: '',
        metales: '',
        organicos: '',
        electronicos: '',
        inorganicos: '',
        porcentajeTotal: '',  // limpiar el nuevo campo
        observacion: '',    // limpiar el nuevo campo
      });
    } else {
      Alert.alert('Límite de filas', 'No se pueden agregar más de 20 filas.');
    }
    setIsInfoGeneralEditable(false);
  };
  const fetchCatalogos = async () => {
   
      loadLocalData();
    
  };

  const loadLocalData = () => {
    return new Promise((resolve, reject) => {
      db.transaction(txn => {
        txn.executeSql('SELECT * FROM area', [], (_, result) => {
          const localAreas = result.rows.raw();
          setAreas(localAreas);
        });

        txn.executeSql('SELECT * FROM tipo_inspeccion', [], (_, result) => {
          const localTiposInspeccion = result.rows.raw();
          setTiposInspeccion(localTiposInspeccion);
        });
      }, reject, resolve);
    });
  };

  useEffect(() => {
    const loadCatalogos = async () => {
      await fetchCatalogos();
    };

    loadCatalogos();
    db.transaction(txn => {
      txn.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='table_informes'",
        [],
        (tx, res) => {
          if (res.rows.length === 0) {
            txn.executeSql('DROP TABLE IF EXISTS table_informes', []);
            txn.executeSql(
              'CREATE TABLE IF NOT EXISTS table_informes(id INTEGER PRIMARY KEY AUTOINCREMENT, reporte TEXT,fecha DATE, user_created_id INT, usuario_movil_id INT, area_id INT, tipo_inspeccion_id INT, estado NVARCHAR(50))',
              []
            );
          }
        },
      );
    })
  }, []);
  const handleAreaChange = (itemValue) => {
    setSelectedArea(itemValue);
    const selectedAreaName = areas.find(area => area.id === itemValue)?.nombre;
    setProceso(selectedAreaName);
  };

  const calcularPorcentajeTotal = () => {
    const totalCampos = 12; // Número total de campos (Suficientes, Rotulados, etc.)
  
    // Convertir cada valor a número, si está vacío o es null, será 0
    const suficientes = parseInt(currentRow.suficientes) || 0;
    const rotulados = parseInt(currentRow.rotulados) || 0;
    const tapados = parseInt(currentRow.tapados) || 0;
    const limpios = parseInt(currentRow.limpios) || 0;
    const ordenados = parseInt(currentRow.ordenados) || 0;
    const recoleccionFrecuente = parseInt(currentRow.recoleccionFrecuente) || 0;
    const carton = parseInt(currentRow.carton) || 0;
    const plasticos = parseInt(currentRow.plasticos) || 0;
    const metales = parseInt(currentRow.metales) || 0;
    const organicos = parseInt(currentRow.organicos) || 0;
    const electronicos = parseInt(currentRow.electronicos) || 0;
    const inorganicos = parseInt(currentRow.inorganicos) || 0;
  
    // Sumar todos los valores
    const totalSum = suficientes + rotulados + tapados + limpios + ordenados + recoleccionFrecuente +
                     carton + plasticos + metales + organicos + electronicos + inorganicos;
  
    // Calcular el promedio basado en la cantidad de campos
    const porcentajeTotal = (totalSum / (totalCampos * 100)) * 100;
  
    return porcentajeTotal.toFixed(2); // Retorna el valor con dos decimales
  };
  
 
  
  // Crear las tablas
  const createTables = () => {
    db.transaction(tx => {
      // Crear tabla ReporteDesechos
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS ReporteDesechos (
          idreporte INTEGER PRIMARY KEY AUTOINCREMENT,
          reporte TEXT,
          responsable TEXT,
          proceso TEXT,
          observacion TEXT,
          fecha TEXT,
          user_created_id INTEGER,
          usuario_movil_id INTEGER,
          estado NVARCHAR(50)
        );`,
        [],
        () => console.log('Tabla ReporteDesechos creada correctamente'),
        error => console.log('Error al crear tabla ReporteDesechos', error)
      );
  
      // Crear tabla DetalleReporteDesechos
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS DetalleReporteDesechos (
          id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
          idreporte INTEGER,
          ubicaciones TEXT,
          suficientes INTEGER,
          rotulados INTEGER,
          tapados INTEGER,
          limpios INTEGER,
          ordenados INTEGER,
          recoleccion_frecuente INTEGER,
          carton INTEGER,
          plasticos INTEGER,
          metales INTEGER,
          organicos INTEGER,
          electronicos INTEGER,
          Inorganicos INTEGER,
          porcentaje_total INTEGER,
          observacion TEXT,
          estado Text,
          FOREIGN KEY (idreporte) REFERENCES ReporteDesechos(idreporte)
        );`,
        [],
        () => console.log('Tabla DetalleReporteDesechos creada correctamente'),
        error => console.log('Error al crear tabla DetalleReporteDesechos', error)
      );
    });
  };
  
  // Ejecutar la creación de las tablas al iniciar
  createTables();


  


  const handleGeneratePDF = async () => {
    const formattedDate = moment().format('YYYYMMDD_HHmmss');
    const formattedFecha = moment(fecha).format('DD/MM/YYYY');
    const informesDir = `${RNFetchBlob.fs.dirs.DownloadDir}/Desechos`;
    const fileName = `ReporteDesechos_${formattedDate}`;
     const imageSourceBase64 = "data:image/png;base64,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";

    const maxRows = 13;

    const htmlContent = `
      <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Desechos</title>
    <style>
         @page {
                size: Letter landscape; /* Definir la orientación en el CSS */
                margin: 20px;
              }
        body {
            font-size: 8px;
            margin: 0;
            padding: 10px;
            box-sizing: border-box;
        }
        .contenedor {
            border: 1px solid #000;
            display: flex;
            flex-direction: column;
            width: 100%;
            box-sizing: border-box;
        }
        .header, .row {
            display: flex;
            border: 1px solid #000;
            border-collapse: collapse;
        }
        .header {
            height: 60px;
        }
        .image {
            width: 15%;
            border-right: 1px solid #000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .image img {
            max-height: 50px;
            max-width: 50px;
        }
        .title {
            width: 65%;
            text-align: center;
            border-right: 1px solid #000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 10px;
        }
        .info {
            width: 20%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 2px;
            box-sizing: border-box;
        }
        .info-line {
            margin: 0;
            border-bottom: 1px solid #000;
            padding: 2px 0;
            text-align: left;
            padding-left: 5px;
        }
        .row {
            height: 30px;
        }
        .column {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-right: 1px solid #000;
            padding: 2px;
            box-sizing: border-box;
            text-align: center;
            width: 90px;
        }
        .column:last-child {
            border-right: none;
        }
        .no {
            width: 25px;
            border-right: 1px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .ubicaciones {
            width: 100px;
            border-right: 1px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .evaluation, .classification {
            display: flex;
            flex-direction: column;
            border-right: 1px solid #000;
            text-align: center;
            flex: 1;
        }
        .evaluation-header, .classification-header {
            border-bottom: 1px solid #000;
            flex: 1;
        }
        .evaluation-items, .classification-items {
            display: flex;
            flex: 1;
        }
        .evaluation-item, .classification-item {
            flex: 1;
            text-align: center;
            border-right: 1px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 2px;
        }
        .evaluation-item:last-child, .classification-item:last-child {
            border-right: none;
        }
        .observaciones {
            display: flex;
            flex-direction: column;
            height: 100px;
        }
        .observaciones-content {
            flex: 1;
            border-top: 1px solid #000;
            padding: 5px;
            box-sizing: border-box;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        .firmas {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
        }
        .firmas div {
            text-align: center;
            flex: 1;
        }
        .firma-line {
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
            margin-left: 20px;
            margin-right: 20px;
        }
        .special-row .column {
            width: 33.33%;
            border-right: 1px solid #000;
        }
    </style>
</head>
<body>
    <div class="contenedor">
        <!-- Primera fila -->
        <div class="header">
            <div class="image">
                <img src="${imageSourceBase64}" alt="Imagen">
            </div>
            <div class="title">
                Para Manejo de Desechos
            </div>
            <div class="info">
                <div class="info-line">Código: 1-IN-M-R-002</div>
                <div class="info-line">Versión: 5</div>
                <div class="info-line">Fecha: ${formattedFecha}</div>
                <div class="info-line">Página 1 de 1</div>
            </div>
        </div>
        <!-- Segunda fila -->
        <div class="row special-row">
            <div class="column">Proceso: ${Proceso}</div>
            <div class="column">Responsable: ${Responsable}</div>
            <div class="column">Fecha: ${formattedFecha}</div>
        </div>
        <!-- Cuarta fila -->
        <div class="row">
            <div class="no">No.</div>
            <div class="ubicaciones">Ubicaciones</div>
            <div class="evaluation">
                <div class="evaluation-header">Evaluación de Toneles</div>
                <div class="evaluation-items">
                    <div class="evaluation-item">Suficientes</div>
                    <div class="evaluation-item">Rotulados</div>
                    <div class="evaluation-item">Tapados</div>
                    <div class="evaluation-item">Limpios</div>
                    <div class="evaluation-item">Ordenados</div>
                    <div class="evaluation-item">Recolección Frecuente</div>
                </div>
            </div>
            <div class="classification">
                <div class="classification-header">Clasificación de Desechos</div>
                <div class="classification-items">
                    <div class="classification-item">Cartón</div>
                    <div class="classification-item">Plásticos</div>
                    <div class="classification-item">Metales</div>
                    <div class="classification-item">Orgánicos</div>
                    <div class="classification-item">Electrónicos</div>
                    <div class="classification-item">Inorgánicos</div>
                </div>
            </div>
            <!-- Nueva columna de Porcentaje Total -->
            <div class="column">Porcentaje Total</div>
            <!-- Nueva columna de Observaciones -->
            <div class="column">Observaciones</div>
        </div>
        <!-- Filas adicionales -->
        ${Array.from({ length: maxRows }).map((_, index) => {
            const evaluation = evaluationData[index] || {};
            return `
                <div class="row">
                    <div class="no">${index + 1}</div>
                    <div class="ubicaciones">${evaluation.ubicacion || ''}</div>
                    <div class="evaluation">
                        <div class="evaluation-items">
                            <div class="evaluation-item">${evaluation.suficientes || ''}</div>
                            <div class="evaluation-item">${evaluation.rotulados || ''}</div>
                            <div class="evaluation-item">${evaluation.tapados || ''}</div>
                            <div class="evaluation-item">${evaluation.limpios || ''}</div>
                            <div class="evaluation-item">${evaluation.ordenados || ''}</div>
                            <div class="evaluation-item">${evaluation.recoleccionFrecuente || ''}</div>
                        </div>
                    </div>
                    <div class="classification">
                        <div class="classification-items">
                            <div class="classification-item">${evaluation.carton || ''}</div>
                            <div class="classification-item">${evaluation.plasticos || ''}</div>
                            <div class="classification-item">${evaluation.metales || ''}</div>
                            <div class="classification-item">${evaluation.organicos || ''}</div>
                            <div class="classification-item">${evaluation.electronicos || ''}</div>
                            <div class="classification-item">${evaluation.inorganicos || ''}</div>
                        </div>
                    </div>
                    <!-- Dato dinámico para Porcentaje Total -->
                    <div class="column">${evaluation.porcentajeTotal || ''}</div>
                    <!-- Dato dinámico para Observaciones -->
                    <div class="column">${evaluation.observacion || ''}</div>
                </div>
            `;
          }).join('')}
        <!-- Observaciones -->
        <div class="observaciones">
          <div class="observaciones-title">OBSERVACIONES:</div>
          <div class="observaciones-content">${observaciones || ''}</div>
        </div>
        <!-- Rango y criterio de calificación -->
        <div class="rango-criterio">
          <div>Rango y criterio de calificación:</div>
          <div>01–50% Malo</div>
          <div>51–70% Regular</div>
          <div>71–90% Bueno</div>
          <div>91–100% Excelente</div>
        </div>
        <!-- Firmas -->
        <div class="firmas">
          <div>
            <div class="firma-line"></div>
            RESPONSABLE DE INSPECCIÓN
          </div>
          <div>
            <div class="firma-line"></div>
            POR ENTERADO
          </div>
        </div>
    </div>
</body>
</html>
    `;


    const options = {
      html: htmlContent,
      fileName: fileName,
      orientation: 'landscape',
      directory: 'Documents',
    };

    try {
      const pdfFile = await RNHTMLtoPDF.convert(options);
      setPdfPath(pdfFile.filePath);

      const pdfBase64 = await RNFetchBlob.fs.readFile(pdfFile.filePath, 'base64');
      const detalles = evaluationData.map(row => ({
        ubicacion: row.ubicacion,
        suficientes: row.suficientes || 0,
        rotulados: row.rotulados || 0,
        tapados: row.tapados || 0,
        limpios: row.limpios || 0,
        ordenados: row.ordenados || 0,
        recoleccionFrecuente: row.recoleccionFrecuente || 0,
        carton: row.carton || 0,
        plasticos: row.plasticos || 0,
        metales: row.metales || 0,
        organicos: row.organicos || 0,
        electronicos: row.electronicos || 0,
        inorganicos: row.inorganicos || 0,
        porcentajeTotal: row.porcentajeTotal || 0,
        observacion: row.observacion || ''
      }));
      const destinationPath = `${informesDir}/ReporteDesechos_${formattedDate}.pdf`;

      db.transaction(tx => {
        // Insertar en la tabla ReporteDesechos
        tx.executeSql(
          `INSERT INTO ReporteDesechos (reporte,responsable, proceso, observacion, fecha, user_created_id, usuario_movil_id, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?,?)`,
          [
            pdfBase64, // el reporte en base64
            Responsable,
            selectedArea,
            observaciones,
            formattedFecha,
            user.id,
            user.id,
            "N",
          ],
          (tx, results) => {
            const idReporte = results.insertId; // Obtener el ID del reporte insertado
            
            // Insertar cada detalle en la tabla DetalleReporteDesechos
            detalles.forEach(detalle => {
              tx.executeSql(
                `INSERT INTO DetalleReporteDesechos (idReporte, ubicaciones, suficientes, rotulados, tapados, limpios, ordenados, recoleccion_frecuente, carton, plasticos, metales, organicos, electronicos, inorganicos, porcentaje_total, observacion, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                 [
                  idReporte, // Clave foránea
                  detalle.ubicacion || '', // Asegurar que no sea undefined
                  detalle.suficientes || 0,
                  detalle.rotulados || 0,
                  detalle.tapados || 0,
                  detalle.limpios || 0,
                  detalle.ordenados || 0,
                  detalle.recoleccionFrecuente || 0,
                  detalle.carton || 0,
                  detalle.plasticos || 0,
                  detalle.metales || 0,
                  detalle.organicos || 0,
                  detalle.electronicos || 0,
                  detalle.inorganicos || 0,
                  detalle.porcentajeTotal || 0,
                  detalle.observacion || '',
                  "N", // Asegurar que no sea undefined
                ],
                () => console.log('Detalle insertado correctamente'),
                error => console.log('Error al insertar detalle', error)
              );
            });
          },
          error => console.log('Error al insertar reporte', error)
        );
      });

      

      RNFetchBlob.fs.isDir(informesDir).then((isDir) => {
        if (!isDir) {
          RNFetchBlob.fs.mkdir(informesDir).then(() => {
            RNFetchBlob.fs.mv(pdfFile.filePath, destinationPath).then(() => {
              Alert.alert(
                'ÉXITO',
                'Informe guardado en la carpeta de Desechos.',
                [{ text: 'Ok' }],
                { cancelable: false }
              );
            }).catch((error) => {
              console.error('Error al mover el PDF:', error);
            });
          }).catch((error) => {
            console.error('Error al crear la carpeta de Desechos:', error);
          });
        } else {
          RNFetchBlob.fs.mv(pdfFile.filePath, destinationPath).then(() => {
            Alert.alert(
              'ÉXITO',
              'Reporte guardado en la carpeta de Desechos',
              [{ text: 'Ok' }],
              { cancelable: false }
            );
          }).catch((error) => {
            console.error('Error al mover el PDF:', error);
          });
        }
      }).catch((error) => {
        console.error('Error al verificar la carpeta de informes:', error);
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Appbar.Header style={{ backgroundColor: INSTITUTIONAL_GREEN }}>
        <Appbar.Content title="Reporte de Desechos" color="white" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Title style={{ color: INSTITUTIONAL_GREEN }}>Información General</Title>
            <Divider style={{ marginVertical: 10, backgroundColor: INSTITUTIONAL_GREEN }} />
            <TextInput
              label="Fecha"
              value={moment(fecha).format('DD/MM/YYYY')}
              onFocus={() => isInfoGeneralEditable && setShowDatePicker(true)}
              style={{ marginBottom: 10 }}
              mode="outlined"
              editable={isInfoGeneralEditable}
            />
            <Picker
              style={styles.input}
              selectedValue={selectedArea}
              onValueChange={(itemValue) => handleAreaChange(itemValue)}
              enabled={isInfoGeneralEditable}
            >
              <Picker.Item label='Seleccione un Proceso' value="" />
              {areas.map((area) => (
                <Picker.Item key={area.id} label={area.nombre} value={area.id} />
              ))}
            </Picker>
            <TextInput
              label="Responsable"
              value={setResponsable}
              onChangeText={isInfoGeneralEditable ? setResponsable : null}
              style={{ marginBottom: 10 }}
              mode="outlined"
              editable={isInfoGeneralEditable}
            />
          </Card.Content>
        </Card>

        {/* Sección de Datos de Evaluación */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Title style={{ color: INSTITUTIONAL_GREEN }}>Datos de Evaluación</Title>
            <Divider style={{ marginVertical: 10, backgroundColor: INSTITUTIONAL_GREEN }} />
            {/* Campos de evaluación */}
            <TextInput
              label="Ubicación"
              value={currentRow.ubicacion}
              onChangeText={(value) => handleInputChange('ubicacion', value)}
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Suficientes"
              value={currentRow.suficientes}
              onChangeText={(value) => handleInputChange2('suficientes', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Rotulados"
              value={currentRow.rotulados}
              onChangeText={(value) => handleInputChange2('rotulados', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Tapados"
              value={currentRow.tapados}
              onChangeText={(value) => handleInputChange2('tapados', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Limpios"
              value={currentRow.limpios}
              onChangeText={(value) => handleInputChange2('limpios', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Ordenados"
              value={currentRow.ordenados}
              onChangeText={(value) => handleInputChange2('ordenados', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Recolección Frecuente"
              value={currentRow.recoleccionFrecuente}
              onChangeText={(value) => handleInputChange2('recoleccionFrecuente', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Cartón"
              value={currentRow.carton}
              onChangeText={(value) => handleInputChange2('carton', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Plásticos"
              value={currentRow.plasticos}
              onChangeText={(value) => handleInputChange2('plasticos', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Metales"
              value={currentRow.metales}
              onChangeText={(value) => handleInputChange2('metales', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Orgánicos"
              value={currentRow.organicos}
              onChangeText={(value) => handleInputChange2('organicos', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Electrónicos"
              value={currentRow.electronicos}
              onChangeText={(value) => handleInputChange2('electronicos', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Inorgánicos"
              value={currentRow.inorganicos}
              onChangeText={(value) => handleInputChange2('inorganicos', value)}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
              mode="outlined"
            />
            <TextInput
              label="Porcentaje Total"
              value={currentRow.porcentajeTotal}
              style={{ marginBottom: 10 }}
              mode="outlined"
              editable={false} // Esto hace que sea de solo lectura
              />
              <TextInput
                label="Observaciones"
                value={currentRow.observacion}
                onChangeText={(value) => handleInputChange('observacion', value)}
                style={{ marginBottom: 10 }}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

            <TextInput
              label="Observaciones Generales"
              value={observaciones}
              onChangeText={setObservaciones}
              style={{ marginBottom: 10 }}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleAddRow}
          style={{ marginBottom: 20, backgroundColor: INSTITUTIONAL_GREEN }}
        >
          Guardar Fila
        </Button>
        <Button
          mode="contained"
          onPress={handleGeneratePDF}
          style={{ backgroundColor: INSTITUTIONAL_GREEN }}
        >
          Generar PDF
        </Button>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={fecha}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setFecha(selectedDate);
            }
          }}
        />
      )}
    </>
  );
};
const styles = StyleSheet.create({

  input: {
    height: 50, // Ajuste para mayor alineación con otros campos
    borderColor: '#C4C4C4', // Color gris claro para los bordes
    borderWidth: 1, // Mismo ancho de borde
    borderRadius: 5, // Bordes redondeados para que coincidan con el estilo del formulario
    marginBottom: 10, // Espacio inferior para separar los elementos
    paddingHorizontal: 15, // Espacio interno para el texto
    marginHorizontal: 20, // Margen lateral consistente
    justifyContent: 'center', // Centrar el contenido verticalmente
    backgroundColor: 'white', // Fondo blanco para que se vea limpio
  },
 
 
});


export default ReporteDesechos;
