import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, BackHandler } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import PDFView from 'react-native-pdf';
import Share from 'react-native-share';
import { Appbar, Card, Title } from 'react-native-paper';

export default function VisualizarInformesScreen() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);

  useEffect(() => {
    const informesDir = `${RNFetchBlob.fs.dirs.DownloadDir}/Desechos`;

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
        console.error('Error al leer archivos en la carpeta "Desechos":', error);
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
      <Text>{item}</Text>
    </TouchableOpacity>
  );

  const handleSharePDF = (pdfFileName) => {
    const pdfPath = `${RNFetchBlob.fs.dirs.DownloadDir}/Desechos/${pdfFileName}`;
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
      <Appbar.Header style={{ backgroundColor: '#008000' }}>
        <Appbar.BackAction onPress={() => setSelectedPdf(null)} />
        <Appbar.Content title="Lista de Reportes" />
      </Appbar.Header>
      {selectedPdf ? (
        <View style={styles.pdfView}>
          <PDFView
            source={{ uri: `${RNFetchBlob.fs.dirs.DownloadDir}/Desechos/${selectedPdf}`, cache: true }}
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdfView: {
    flex: 1,
  },
  pdfItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewContainer: {
    marginRight: 10,
  },
  previewImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  shareButton: {
    backgroundColor: '#008000',
    padding: 10,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
  },
});
