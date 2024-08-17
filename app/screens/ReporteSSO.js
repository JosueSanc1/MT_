import React, { useState } from 'react';
import { View, ScrollView, Button, Alert } from 'react-native';
import { TextInput } from 'react-native-paper';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFetchBlob from 'rn-fetch-blob';

export default function InformeInspeccionScreen() {
  const [area, setArea] = useState('');
  const [responsable, setResponsable] = useState('');
  const [fechaHallazgo, setFechaHallazgo] = useState('');
  const [fechaCorreccion, setFechaCorreccion] = useState('');
  const [hallazgo, setHallazgo] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [imageBase64, setImageBase64] = useState(''); // Aquí debes agregar la imagen en base64

  const handleGeneratePDF = async () => {
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
                padding: 5px;
            }
            .logo {
                width: 100%;
                height: auto;
            }
            .center-align {
                text-align: center;
                white-space: nowrap;
            }
            .left-align {
                text-align: left;
                padding-left: 10px;
            }
            .main-table td {
                height: 100px;
            }
            .image {
                max-width: 100%;
                max-height: 100px;
                display: block;
                margin: 0 auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <table class="header-table">
                <tr>
                    <td rowspan="4" style="width: 10%;"><img src="data:image/png;base64,${imageBase64}" alt="Logo" class="logo"></td>
                    <td rowspan="4" colspan="7" class="center-align" style="width: 75%;">INFORME DE INSPECCION</td>
                    <td style="width: 15%;">Código: 1-RH-G-R-017</td>
                </tr>
                <tr>
                    <td style="width: 15%;">Versión: 3</td>
                </tr>
                <tr>
                    <td style="width: 15%;">Fecha: ${new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                    <td style="width: 15%;">Página: 1 de 1</td>
                </tr>
            </table>
            <table class="header-table">
                <tr>
                    <td class="left-align" style="width: 50%;">AREA: ${area}</td>
                    <td class="left-align" style="width: 25%;">FECHA DE HALLAZGO: ${fechaHallazgo}</td>
                    <td class="left-align" style="width: 25%;">FECHA DE CORRECCION: ${fechaCorreccion}</td>
                </tr>
                <tr>
                    <td class="left-align" style="width: 50%;">RESPONSABLE INSPECCION: ${responsable}</td>
                    <td class="left-align" style="width: 25%;">*TIPO DE INSPECCION: SSO</td>
                    <td class="left-align" style="width: 25%;">*TIPO DE INSPECCION: SSO</td>
                </tr>
            </table>
            <table class="main-table">
                <tr>
                    <th style="width: 25%;">HALLAZGOS</th>
                    <th style="width: 25%;">RECOMENDACIÓN</th>
                    <th style="width: 25%;">EVIDENCIA</th>
                    <th style="width: 25%;">CORRECCION</th>
                </tr>
                <tr>
                    <td>${hallazgo}</td>
                    <td>${recomendacion}</td>
                    <td class="center-align">
                        <img src="data:image/png;base64,${imageBase64}" alt="Evidencia" class="image">
                    </td>
                    <td> </td>
                </tr>
                <!-- Filas adicionales en blanco -->
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    `;

    const options = {
      html: htmlContent,
      fileName: 'Informe_Inspeccion',
      directory: 'Documents',
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
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <TextInput
        label="Área"
        value={area}
        onChangeText={setArea}
        style={{ marginBottom: 10 }}
      />
      <TextInput
        label="Responsable de Inspección"
        value={responsable}
        onChangeText={setResponsable}
        style={{ marginBottom: 10 }}
      />
      <TextInput
        label="Fecha de Hallazgo"
        value={fechaHallazgo}
        onChangeText={setFechaHallazgo}
        style={{ marginBottom: 10 }}
      />
      <TextInput
        label="Fecha de Corrección"
        value={fechaCorreccion}
        onChangeText={setFechaCorreccion}
        style={{ marginBottom: 10 }}
      />
      <TextInput
        label="Hallazgo"
        value={hallazgo}
        onChangeText={setHallazgo}
        style={{ marginBottom: 10 }}
      />
      <TextInput
        label="Recomendación"
        value={recomendacion}
        onChangeText={setRecomendacion}
        style={{ marginBottom: 10 }}
      />
      <Button title="Generar PDF" onPress={handleGeneratePDF} />
    </ScrollView>
  );
}
