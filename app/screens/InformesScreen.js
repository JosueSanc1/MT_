import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, BackHandler } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import PDFView from 'react-native-pdf';
import Share from 'react-native-share';
import { Appbar } from 'react-native-paper';

export default function VisualizarInformesScreen() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);

  useEffect(() => {
    const informesDir = `${RNFetchBlob.fs.dirs.DownloadDir}/Informes`;

    RNFetchBlob.fs.exists(informesDir)
      .then((exists) => {
        if (!exists) {
          return RNFetchBlob.fs.mkdir(informesDir);
        }
        return Promise.resolve();
      })
      .then(() => {
        return RNFetchBlob.fs.ls(informesDir);
      })
      .then((files) => {
        const pdfFiles = files.filter((file) => file.toLowerCase().endsWith('.pdf'));
        setPdfFiles(pdfFiles);
      })
      .catch((error) => {
        console.error('Error al leer archivos en la carpeta "inspeccion":', error);
      });
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (selectedPdf) {
        setSelectedPdf(null);
        return true; // Prevenir que el evento de retroceso se propague más allá
      }
      return false; // Permitir que el evento de retroceso se maneje por defecto
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [selectedPdf]);

  const renderPdfItem = ({ item }) => (
    <TouchableOpacity
      style={styles.pdfItem}
      onPress={() => setSelectedPdf(item)}
    >
      <View style={styles.previewContainer}>
        <Image source={require('../src/img/archivo-pdf.png')} style={styles.previewImage} />
      </View>
      <Text style={styles.pdfTitle}>{item}</Text>
    </TouchableOpacity>
  );

  const handleSharePDF = (pdfFileName) => {
    const pdfPath = `${RNFetchBlob.fs.dirs.DownloadDir}/Informes/${pdfFileName}`;
    const options = {
      type: 'application/pdf',
      url: `file://${pdfPath}`,
    };

    Share.open(options)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Lista de Reportes" titleStyle={styles.headerTitle} />
        <Image
          source={require('../src/img/logo_menu_2.jpg')} // Asegúrate de que la ruta sea correcta
          style={styles.logo}
        />
      </Appbar.Header>
      {selectedPdf ? (
        <View style={styles.pdfView}>
          <PDFView
            source={{ uri: `${RNFetchBlob.fs.dirs.DownloadDir}/Informes/${selectedPdf}`, cache: true }}
            style={styles.pdfView}
          />
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => handleSharePDF(selectedPdf)}
          >
            <Text style={styles.shareButtonText}>Compartir PDF</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pdfFiles}
          keyExtractor={(item) => item}
          renderItem={renderPdfItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#008000', // Color verde para el encabezado
    flexDirection: 'row',
    alignItems: 'center', // Centrar verticalmente
    justifyContent: 'space-between', // Espacio entre el texto y el logo
    paddingHorizontal: 10,
  },
  logo: {
    width: 50,
    height: 50,
    marginLeft: 10, // Espacio a la izquierda
  },
  headerTitle: {
    color: 'white', // Texto del encabezado en blanco
  },
  pdfView: {
    flex: 1,
  },
  pdfItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fondo blanco para los elementos de la lista
  },
  previewContainer: {
    marginRight: 10,
  },
  previewImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  pdfTitle: {
    fontSize: 16,
    color: '#333',
  },
  shareButton: {
    backgroundColor: '#008000',
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  shareButtonText: {
    color: 'white',
  },
  listContainer: {
    paddingBottom: 20,
  },
});
