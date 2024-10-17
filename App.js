// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './app/screens/AuthContext';
import StackOneNavigator from './app/navigation/StackOneNavigator';
import axios from 'axios'; // Importa axios si aún no lo has hecho
import { openDatabase } from 'react-native-sqlite-storage';

const Stack = createStackNavigator();
const db = openDatabase({ name: 'UserDatabase5.db' });

const App = () => {
  useEffect(() => {
    // Llama a la función de descarga de usuarios al iniciar la aplicación
    syncDataWithWebService();
  }, []);

  const syncDataWithWebService = async () => {
    try {
      // Realiza la llamada al webservice para obtener usuarios
      
      const response = await axios.get('http://100.10.10.198:3000/api/v1/getUsuarios');
      
      // Procesa la respuesta y realiza acciones necesarias
      const responseData = response.data;

      if (responseData && Array.isArray(responseData.usuarios)) {
        const users = responseData.usuarios;
        
        // Almacena los usuarios en la base de datos SQLite
        saveDataToLocalDatabase(users);

        // Puedes también realizar otras acciones como almacenar en el estado global o en contexto si es necesario
      } else {
        console.error('La respuesta del servicio web no tiene la estructura esperada:', responseData);
      }
    } catch (error) {
      console.error('Error al sincronizar datos con el servicio web', error);
      // Puedes mostrar un mensaje de error al usuario
      // alert('Error al sincronizar datos con el servicio web');
    }
  };

 

  const saveDataToLocalDatabase = (users) => {
    db.transaction((txn) => {
      txn.executeSql('DROP TABLE IF EXISTS usuarios', []);
      txn.executeSql(
        'CREATE TABLE IF NOT EXISTS usuarios(id INTEGER PRIMARY KEY , codigo INT, nombre NVARCHAR(255), password NVARCHAR(255),correo NVARCHAR(255), telefono NVARCHAR(10),rol_movil_id INT, area_id INT, estado NVARCHAR(10), token NVARCHAR(255))',
        [],
        (tx, res) => {
          console.log('Tabla usuarios creada correctamente');
        }
      );

      users.forEach((user) => {
        txn.executeSql(
          'INSERT INTO usuarios (id, codigo, nombre, password, correo, telefono, rol_movil_id, area_id, estado, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [user.id, user.codigo, user.nombre, user.password, user.correo, user.telefono, user.rol_movil_id, user.area_id, user.estado, user.token],
          (tx, res) => {
            console.log('Datos insertados correctamente');
          },
          (tx, error) => {
            console.error('Error al insertar datos:', error);
          }
        );
      });
    });
  };

  return (
    <AuthProvider>
      <NavigationContainer>
        <StackOneNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
