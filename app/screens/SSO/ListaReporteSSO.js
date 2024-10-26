import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, BackHandler } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import PDFView from 'react-native-pdf';
import Share from 'react-native-share';
import { Appbar } from 'react-native-paper';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

function ReportesScreen() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);

  useEffect(() => {
    const informesDir = `${RNFetchBlob.fs.dirs.DownloadDir}/ReporteSSO`;

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
        console.error('Error al leer archivos en la carpeta "ReporteSSO":', error);
      });
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (selectedPdf) {
        setSelectedPdf(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [selectedPdf]);

  const renderPdfItem = ({ item }) => (
    <TouchableOpacity style={styles.pdfItem} onPress={() => setSelectedPdf(item)}>
      <View style={styles.previewContainer}>
        <Image source={require('../../src/img/archivo-pdf.png')} style={styles.previewImage} />
      </View>
      <Text style={styles.pdfTitle}>{item}</Text>
    </TouchableOpacity>
  );

  const handleSharePDF = (pdfFileName) => {
    const pdfPath = `${RNFetchBlob.fs.dirs.DownloadDir}/ReporteSSO/${pdfFileName}`;
    Share.open({ type: 'application/pdf', url: `file://${pdfPath}` }).catch(console.error);
  };

  return (
    <View style={styles.container}>
      {selectedPdf ? (
        <View style={styles.pdfView}>
          <PDFView source={{ uri: `${RNFetchBlob.fs.dirs.DownloadDir}/ReporteSSO/${selectedPdf}`, cache: true }} style={styles.pdfView} />
          <TouchableOpacity style={styles.shareButton} onPress={() => handleSharePDF(selectedPdf)}>
            <Text style={styles.shareButtonText}>Compartir PDF</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={pdfFiles} keyExtractor={(item) => item} renderItem={renderPdfItem} contentContainerStyle={styles.listContainer} />
      )}
    </View>
  );
}

function CorreccionScreen() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);

  useEffect(() => {
    const informesDire = `${RNFetchBlob.fs.dirs.DownloadDir}/ReporteSSOCorregidos`;

    RNFetchBlob.fs.exists(informesDire)
      .then((exists) => {
        if (!exists) {
          return RNFetchBlob.fs.mkdir(informesDire);
        }
        return Promise.resolve();
      })
      .then(() => {
        return RNFetchBlob.fs.ls(informesDire);
      })
      .then((files) => {
        const pdfFiles = files.filter((file) => file.toLowerCase().endsWith('.pdf'));
        setPdfFiles(pdfFiles);
      })
      .catch((error) => {
        console.error('Error al leer archivos en la carpeta "ReporteSSOCorregidos":', error);
      });
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (selectedPdf) {
        setSelectedPdf(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [selectedPdf]);

  const renderPdfItem = ({ item }) => (
    <TouchableOpacity style={styles.pdfItem} onPress={() => setSelectedPdf(item)}>
      <View style={styles.previewContainer}>
        <Image source={require('../../src/img/archivo-pdf.png')} style={styles.previewImage} />
      </View>
      <Text style={styles.pdfTitle}>{item}</Text>
    </TouchableOpacity>
  );

  const handleSharePDF = (pdfFileName) => {
    const pdfPath = `${RNFetchBlob.fs.dirs.DownloadDir}/ReporteSSOCorregidos/${pdfFileName}`;
    Share.open({ type: 'application/pdf', url: `file://${pdfPath}` }).catch(console.error);
  };

  return (
    <View style={styles.container}>
      {selectedPdf ? (
        <View style={styles.pdfView}>
          <PDFView source={{ uri: `${RNFetchBlob.fs.dirs.DownloadDir}/ReporteSSOCorregidos/${selectedPdf}`, cache: true }} style={styles.pdfView} />
          <TouchableOpacity style={styles.shareButton} onPress={() => handleSharePDF(selectedPdf)}>
            <Text style={styles.shareButtonText}>Compartir PDF</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={pdfFiles} keyExtractor={(item) => item} renderItem={renderPdfItem} contentContainerStyle={styles.listContainer} />
      )}
    </View>
  );
}

export default function VisualizarInformesScreen() {
  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Lista de Reportes" titleStyle={styles.headerTitle} />
        <Image source={require('../../src/img/logo_menu_2.jpg')} style={styles.logo} />
      </Appbar.Header>

      <Tab.Navigator
        initialRouteName="Reportes"
        screenOptions={{
          tabBarActiveTintColor: '#fff',
          tabBarLabelStyle: { fontSize: 12 },
          tabBarStyle: { backgroundColor: '#008000' },
        }}
      >
        <Tab.Screen name="Reportes" component={ReportesScreen} />
        <Tab.Screen name="Corrección" component={CorreccionScreen} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#008000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  logo: {
    width: 50,
    height: 50,
    marginLeft: 10,
  },
  headerTitle: {
    color: 'white',
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
    backgroundColor: '#FFFFFF',
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
