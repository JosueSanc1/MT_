import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,   //importamos componentes
  Text,
  Alert,
  Image
} from 'react-native';
import {openDatabase} from 'react-native-sqlite-storage';  //importamos librerias
import { ScrollView } from 'react-native-gesture-handler';
import { useAuth } from './AuthContext'; 
import { useNavigation } from '@react-navigation/native';
let db = openDatabase({name: 'UserDatabase5.db'});
const Login =({navigation})=> {  //creamos contantes para la validacion de datos
  const [nombre, setNombre] = useState('');
  const [contraseña, setCostraseña] = useState('');
  const { dispatch } = useAuth();


  const handleLogin = () => {
    db.transaction((txn) => {
      const correoLowerCase = nombre.toLowerCase();
      const contraseñaLowerCase = contraseña.toLowerCase();

      txn.executeSql(
        'SELECT * FROM usuarios WHERE LOWER(correo)=? AND LOWER(password)=?',
        [correoLowerCase, contraseñaLowerCase],
        (tx, result) => {
          if (result.rows.length > 0) {
            const user = result.rows.item(0);
            dispatch({
              type: 'SET_USER',
              payload: { token: user.token, id: user.id, nombre: user.nombre },
            });
  
            // Redirigir según el rol
            if (user.rol_movil_id === 1) {
              Alert.alert('Inicio de sesión exitoso como Operador');
              navigation.navigate('Menú Operador', { userToken: user.token, userID: user.id, userNombre: user.nombre });
            } else if (user.rol_movil_id === 2) {
              Alert.alert('Inicio de sesión exitoso como Administrador');
              navigation.navigate('Menú', { userToken: user.token, userID: user.id, userNombre: user.nombre});
            } else {
              // Otros roles o manejar de alguna otra manera
              Alert.alert('Rol no reconocido');
            }
          } else {
            Alert.alert('Inicio de sesión fallido');
          }
        }
      );
    });
  
    // Validación local, si es necesario
    // ...
  
  };
    

  return (
    //diseño//
   <ScrollView>
     <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Ingenio Madre Tierra</Text>                           
        <Image
          source= {require('../src/img/logo-menu-2.png')}
          style={styles.headerImage}
        />
      </View>
      <Text> 


      </Text>
      <Text>
        

         </Text>
      <Text> </Text>
      <Text></Text>
      <Text> </Text>
      <Text> </Text>
      <Text> </Text>
      <Text> </Text>
    <View style={styles.formContainer}>
    <View style={styles.inputContainer}>
      <Text style={styles.headerBienvenido}>BIENVENIDOS</Text>
      <Text style={styles.header}>INICIO DE SESIÓN</Text>
        <Text style={styles.label}>Usuario:</Text>
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          onChangeText={(text) => setNombre(text)}
          value={nombre}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Contraseña:</Text>
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          secureTextEntry
          onChangeText={(text) => setCostraseña(text)}
          value={contraseña}
        />
      </View>
      <Button title="Iniciar Sesión" onPress={handleLogin} />
    </View>
    </View>
      
   </ScrollView>
  );
}

export default Login;
 
//estilos//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: 'green',
    flexDirection: 'row',
    paddingVertical: 20,
    width: '100%',
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
  headerBienvenido: {
    fontSize: 25,
    marginBottom: 5,
    textAlign: 'center',
    marginBottom:5,
    marginTop:20
  },
  header: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: 'center',
    marginBottom:20,    
  },
  inputContainer: {
    marginBottom: 30,
    marginStart:15    
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    width: 300,
    height: 40,
    borderColor: 'green',
    borderWidth: 1,
    paddingLeft: 10,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: 350,
    height: 400
  },
});



