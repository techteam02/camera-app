import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/FontAwesome';
import { friendsData } from './utils/DemoData';
import { images } from './assets/images/image';
import { PanGestureHandler } from 'react-native-gesture-handler';

const FriendsList = ({ onAddFriend, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addedFriends, setAddedFriends] = useState([]);

  const filteredFriends = friendsData.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFriend = (friend) => {
    if (!addedFriends.includes(friend.id)) {
      onAddFriend(friend);
      setAddedFriends([...addedFriends, friend.id]);
    }
  };

  const handleGestureEvent = (event) => {
    if (event.nativeEvent.translationY > 50) {
      onClose();
    }
  };

  return (
    <PanGestureHandler onGestureEvent={handleGestureEvent}>
      <ImageBackground
        source={images.BG}
        style={styles.backgroundImage}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Friends</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="times" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBarContainer}>
          <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search friends..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.friendItem} onPress={() => handleAddFriend(item)}>
              <Text style={styles.friendName}>
                {addedFriends.includes(item.id) ? `${item.name} (Added)` : item.name}
              </Text>
              {!addedFriends.includes(item.id) && (
                <View style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </ImageBackground>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    height: hp('40%'),
    width: '100%',
    justifyContent: 'center',
    resizeMode: 'cover',
    borderTopLeftRadius: wp('5%'),
    borderTopRightRadius: wp('5%'),
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
    paddingHorizontal: wp('5%'),
  },
  title: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.7)',
    borderRadius: wp('5%'),
    paddingHorizontal: wp('2.5%'),
    marginBottom: hp('2%'),
    marginHorizontal: wp('5%'),
  },
  searchIcon: {
    marginRight: wp('2.5%'),
  },
  searchBar: {
    flex: 1,
    height: hp('5%'),
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  friendName: {
    fontSize: wp('4%'),
    flex: 1,
    color: '#000'
  },
  addButton: {
    backgroundColor: '#4a9c2d',
    borderRadius: wp('1%'),
    paddingVertical: hp('0.7%'),
    paddingHorizontal: wp('2.5%'),
  },
  addButtonText: {
    color: 'white',
    fontSize: wp('3.5%'),
  },
});

export default FriendsList;