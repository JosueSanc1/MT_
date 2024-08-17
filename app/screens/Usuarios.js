// Usuarios.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { openDatabase } from 'react-native-sqlite-storage';

const db = openDatabase({ name: 'UserDatabase5.db' });

const Usuarios = () => {
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    getDataFromDatabase();
  }, []);

  const getDataFromDatabase = () => {
    db.transaction((txn) => {
      txn.executeSql('SELECT * FROM usuarios', [], (tx, res) => {
        var temp = [];
        for (let i = 0; i < res.rows.length; i++) {
          temp.push(res.rows.item(i));
        }
        setUserList(temp);
      });
    });
  };

  const toggleShowPassword = (index) => {
    const updatedUserList = [...userList];
    updatedUserList[index].showPassword = !updatedUserList[index].showPassword;
    setUserList(updatedUserList);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={userList}
        renderItem={({ item, index }) => (
          <View style={styles.userItem}>
            <Text style={styles.itemText}>{'Nombre: ' + item.nombre}</Text>
            <Text style={styles.itemText}>{'Correo: ' + item.correo}</Text>
            <Text style={styles.itemText}>
              {item.showPassword ? 'Contraseña: ' + item.password : 'Contraseña: *****'}
            </Text>
            <TouchableOpacity onPress={() => toggleShowPassword(index)} style={styles.toggleButton}>
              <Text style={styles.toggleButtonText}>
                {item.showPassword ? 'Ocultar Contraseña' : 'Mostrar Contraseña'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userItem: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  toggleButton: {
    backgroundColor: '#3498db',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Usuarios;
