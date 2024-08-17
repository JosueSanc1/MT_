import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity, //importamos componentes//
  FlatList,
  StyleSheet, Image, Alert
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native'; //importamos libreria
import { openDatabase } from 'react-native-sqlite-storage';
import { getDbConnection, inserUsuario } from '../../db';

let db = openDatabase({ name: 'UserDatabase5.db' }); //inicializamos base de datos

const CrudScreen = ({ }) => {
  const navigation = useNavigation();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [Contraseña, setCotraseña] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState('');

  useEffect(() => {
    db.transaction(txn => {
      txn.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='table_user'", //logica sql
        [],
        (tx, res) => {
          console.log('item:', res.rows.length);
          if (res.rows.length == 0) {
            txn.executeSql('DROP TABLE IF EXISTS table_user', []);
            txn.executeSql('CREATE TABLE IF NOT EXISTS table_user(user_id INTEGER PRIMARY KEY AUTOINCREMENT, Codigo_Usuario NVARCHAR(255), Nombre_Usuario NVARCHAR(255) not null, Contraseña NVARCHAR(255) not null, Correo_Electronico NVARCHAR(255) not null, Numero_de_Telefono NVARCHAR(20) not null, Rol NVARCHAR(50)not null)',
              [],);
          } 
          else {
            console.log('already created table');
          }
        },
      );
    });
  }, []);


  const GuardarUsuario = () => { //funcion para guardar Usuarios
    if (!codigo || !nombre || !Contraseña || !correo || !telefono || !rol) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
  
    // Otras validaciones, por ejemplo, para el formato del correo electrónico
    if (!isValidEmail(correo)) {
      Alert.alert('Error', 'El correo electrónico no es válido');
      return;
    }

    const lettersonlyRegex = /^[a-zA-z]+$/;
    if (!lettersonlyRegex.test(Contraseña)){
      Alert.alert('Error','La contraseña solo acepta letras como parametros');
      return;
    }
    


   db.transaction(txn =>{
    txn.executeSql(
      'INSERT INTO table_user (Codigo_Usuario, Nombre_Usuario, Contraseña, Correo_Electronico, Numero_de_Telefono, Rol) VALUES (?,?,?,?,?,?)',
      [codigo,nombre,Contraseña,correo,telefono,rol],
      (tex,res)=>{
        if(res.rowsAffected==1){
           Alert.alert(
        'Succes',
        'Usuario Creado',
        [
          {
            text: 'Ok',
            onPress: () => navigation.navigate('Usuarios'),

          }
        ],
        {
          cancelable: false
        }
      );
          navigation.goBack();
        }else{
          console.log(res);
        }
        
      },
      error => {
        console.log(error);
      },
    );
   });
   
  };
  const isValidEmail = email => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };


  const CodigoEntero = parseInt(codigo);

  async function createUsuario() {

    if (nombre == "") {
      setError('Se necesita que ingrese el codigo');
      return;
    }
    try {
      const db = await getDbConnection();
      await inserUsuario(db, codigo, nombre, Contraseña, correo, telefono, rol);
      Alert.alert(
        'Succes',
        'Usuario Creado',
        [
          {
            text: 'Ok',

          }
        ],
        {
          cancelable: false
        }
      );
      db.close();
    } catch (e) {
      setError(`Ocurrio un Error : ${e.message}`);
    }
  }


  const [userData, setUserData] = useState({
    codigo: '',
    nombre: '',
    contraseña: '',
    correo: '',
    telefono: '',
    rol: '',
  });

  const addUser = () => {
    Alert.alert(
      'Succes',
      'Usuario Creado',
      [
        {
          text: 'Ok',

        }
      ],
      {
        cancelable: false
      }
    );

    setUserData({
      codigo: '',
      nombre: '',
      contraseña: '',
      correo: '',
      telefono: '',
      rol: '',
    });
  };


  return (
      //estructura//
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Ingenio Madre Tierra</Text>

          <Image
            source={require('../src/img/logo-menu-2.png')}
            style={styles.headerImage}
          />
        </View>
        <Text style={styles.heading}></Text>
        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Código de Usuario:</Text>
            <TextInput
              style={styles.input}
              placeholder="Código de Usuario"
              onChangeText={txt => setCodigo(txt)}
              value={codigo}

            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nombre de Usuario:</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de Usuario"
              value={nombre}
              onChangeText={txt => setNombre(txt)}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contraseña:</Text>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={Contraseña}
              onChangeText={txt => setCotraseña(txt)
              }
              secureTextEntry
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Correo Electrónico:</Text>
            <TextInput
              style={styles.input}
              placeholder="Correo Electrónico"
              value={correo}
              onChangeText={txt => setCorreo(txt)}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Número de Teléfono:</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de Teléfono"
              value={telefono}
              onChangeText={txt => setTelefono(txt)
              }
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Rol:</Text>
            <TextInput
              style={styles.input}
              placeholder="Rol"
              value={rol}
              onChangeText={txt => setRol(txt)}
            />
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => { GuardarUsuario();}}
            >
              <Text style={styles.buttonText}>
                {'Agregar Usuario'}
              </Text>
            </TouchableOpacity>
              
          </View>
        </View>

      </View>
    </ScrollView>

  );
}
//diseño//

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  headerContainer: {
    backgroundColor: 'green',
    flexDirection: 'row',
    paddingVertical: 20,
    width: '105%',
    alignItems: 'center',
    position: 'absolute', // Posición absoluta
    top: 0, // Colocar en la parte superior
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',

  },
  headerImage: {
    width: 100, // Tamaño de la imagen
    height: 80, // Tamaño de la imagen
    marginLeft: 10, // Espacio entre el texto y la imagen

  },
  heading: {
    marginBottom: 100,
    fontSize: 20,
    fontWeight: 'bold',

  },
  formContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
  },
  buttonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: 'blue',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    flex: 0.48,
    textAlign: 'center', // Esto divide el espacio disponible en dos botones
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

});
export default CrudScreen;