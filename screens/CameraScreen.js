import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert, Text, Platform, TouchableOpacity, Image, Modal, TouchableWithoutFeedback, ScrollView,Dimensions } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/FontAwesome6';
import Icon1 from 'react-native-vector-icons/FontAwesome';
import Icon2 from 'react-native-vector-icons/Ionicons';
import Icon3 from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import GalleryMenu from './GalleryMenu';
import { FILTERS } from './utils/Filters';
import { Image as FilterImage } from 'react-native-image-filter-kit';

const CameraScreen = ({ navigation }) => {
  const [hasPermissions, setHasPermissions] = useState({
    camera: false,
    microphone: false,
    gallery: false,
    location: false,
    music: false,
  });
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [flash, setFlash] = useState('off');
  const [allPermissionsRequested, setAllPermissionsRequested] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(90);
  const countdownInterval = useRef(null);
  const camera = useRef(null);
  const imageSource = require('./assets/images/ColorMode.png');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReLoop, setIsReLoop] = useState(false);
  const [isSlowMotionMode, setIsSlowMotionMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isBoomerangMode, setIsBoomerangMode] = useState(false);
  const [isGalleryMenuVisible, setIsGalleryMenuVisible] = useState(false);
  const boomerangFrames = useRef([]);
  const [specialMode, setSpecialMode] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [isFilterBarVisible, setIsFilterBarVisible] = useState(false);
  const [isSpecialMode, setIsSpecialMode] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    const setupCamera = async () => {
      try {
        if (allPermissionsRequested && hasPermissions.camera) {
          const availableDevices = await Camera.getAvailableCameraDevices();

          if (availableDevices.length > 0) {
            setDevices(availableDevices);
            setSelectedDevice(availableDevices.find(device => device.position === 'back'));
            setIsCameraInitialized(true);
          } else {
            Alert.alert('Error', 'No cameras found on this device.');
          }
        }
      } catch (error) {
        Alert.alert('Error', `Failed to set up camera: ${error.message}`);
      }
    };
    setupCamera();
  }, [allPermissionsRequested, hasPermissions.camera]);

  const requestPermissions = async () => {
    try {
      const permissions = [
        { type: 'camera', request: requestCameraPermission },
        { type: 'microphone', request: requestMicrophonePermission },
        { type: 'gallery', request: requestGalleryPermission },
        { type: 'location', request: requestLocationPermission },
        { type: 'music', request: requestMusicPermission },
      ];

      for (const { type, request } of permissions) {
        await request();
      }

      setAllPermissionsRequested(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    }
  };
   const handleGalleryImageSelect = (imageUri) => {
  console.log('Image selected in CameraScreen:', imageUri);
  navigation.navigate('Layout_Screen', { selectedImage: imageUri });
};

  const requestCameraPermission = async () => {
    try {
      const result = await Camera.requestCameraPermission();
      const isGranted = result === RESULTS.GRANTED || result === 'authorized';
      setHasPermissions(prev => ({ ...prev, camera: isGranted }));

      if (!isGranted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required for full functionality.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request camera permission. Please try again.');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const result = await request(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO
      );
      const isGranted = result === RESULTS.GRANTED || result === 'authorized';
      setHasPermissions(prev => ({ ...prev, microphone: isGranted }));

      if (!isGranted) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for full functionality.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request microphone permission. Please try again.');
    }
  };

  const requestGalleryPermission = async () => {
    try {
      let result;
      if (Platform.OS === 'ios') {
        result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      } else {
        result =
          Platform.Version >= 33
            ? await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES)
            : await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      }

      const isGranted = result === RESULTS.GRANTED || result === 'authorized';
      setHasPermissions(prev => ({ ...prev, gallery: isGranted }));

      if (!isGranted) {
        Alert.alert(
          'Permission Required',
          'Gallery permission is required for full functionality.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request gallery permission. Please try again.');
    }
  };

  const requestLocationPermission = async () => {
    try {
      const result = await request(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      );

      const isGranted = result === RESULTS.GRANTED || result === 'authorized';
      setHasPermissions(prev => ({ ...prev, location: isGranted }));

      if (!isGranted) {
        Alert.alert(
          'Permission Required',
          'Location permission is required for full functionality.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request location permission. Please try again.');
    }
  };

  const requestMusicPermission = async () => {
    try {
      let result;
      if (Platform.OS === 'ios') {
        result = await request(PERMISSIONS.IOS.MEDIA_LIBRARY);
      } else {
        result = Platform.Version >= 33
          ? await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO)
          : await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      }

      const isGranted = result === RESULTS.GRANTED || result === 'authorized';
      setHasPermissions(prev => ({ ...prev, music: isGranted }));

      if (!isGranted) {
        Alert.alert(
          'Permission Required',
          'Music library permission is required for full functionality.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request music library permission. Please try again.');
    }
  };

  const takePicture = async () => {
    if (camera.current == null) {
      Alert.alert('Camera not initialized', 'Camera is not ready yet.');
      return;
    }
    try {
      const { width, height } = Dimensions.get('window');
      const isPortrait = height > width;

      const photo = await camera.current.takePhoto({
        quality: 1,
        flash: flash,
        enableShutterSound: false,
        skipMetadata: false,
        enableAutoStabilization: true,
        outputOrientation: isPortrait ? 'portrait' : 'landscapeRight',
        photoCodec: 'png',
        format: 'png',
        imageType: 'original',
        ...(selectedFilter && selectedFilter.id !== 1 && { filter: selectedFilter.filterComponent }),
      });
    
      const imagePath = Platform.OS === 'ios' ? photo.path : `file://${photo.path}`;
      navigation.navigate('Layout_Screen', { selectedImage: imagePath });
    } catch (error) {
      Alert.alert('Error', `Failed to take picture: ${error.message}`);
    }
  };

  const flipCamera = () => {
    if (devices.length > 0) {
      const currentPosition = selectedDevice.position;
      const newDevice = devices.find(device => device.position !== currentPosition);
      setSelectedDevice(newDevice);
    }
  };

  const openGallery = () => {
  setIsGalleryMenuVisible(true);
  };

  const toggleFlash = () => {
    setFlash(currentFlash => {
      const newFlash = currentFlash === 'off' ? 'on' : currentFlash === 'on' ? 'auto' : 'off';
      return newFlash;
    });
  };

const startVideoRecording = async () => {
  if (camera.current == null) {
    Alert.alert('Camera not initialized', 'Camera is not ready yet.');
    return;
  }
  try {
    setIsRecording(true);
    setCountdown(90);
    countdownInterval.current = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          stopVideoRecording();
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    const options = {
      flash: flash,
      fileType: 'mp4',
      videoCodec: 'h264',
      videoBitRate: 8000000, // 8 Mbps for high quality
      fps: 30, // Keep 30 fps for all modes
      videoStabilizationMode: 'standard',
      audioQuality: 'high',
      audioBitRate: 128000,
      onRecordingFinished: (video) => {
        console.log('Video recording finished:', video);
        navigateToEditingScreen(video.path);
      },
      onRecordingError: (error) => {
        console.error('Video recording error:', error);
        Alert.alert('Error', 'Failed to record video. Please try again.');
        setIsRecording(false);
        clearInterval(countdownInterval.current);
        setCountdown(90);
      },
    };

    await camera.current.startRecording(options);
  } catch (error) {
    console.error('Error starting video recording:', error);
    Alert.alert('Error', 'Failed to start video recording. Please try again.');
    setIsRecording(false);
    clearInterval(countdownInterval.current);
    setCountdown(90);
  }
};

const stopVideoRecording = async () => {
  if (camera.current == null || !isRecording) return;
  try {
    console.log('Stopping video recording...');
    await camera.current.stopRecording();
    console.log('Video recording stopped successfully');
  } catch (error) {
    console.error('Error stopping video recording:', error);
    Alert.alert('Error', 'Failed to stop video recording. The video may still be saved.');
  } finally {
    setIsRecording(false);
    clearInterval(countdownInterval.current);
    setCountdown(90);
  }
};

const navigateToEditingScreen = (videoPath) => {
  console.log('Navigating to EditingScreen with video path:', videoPath);
  navigation.navigate('EditingScreen', { 
    media: { 
      uri: videoPath, 
      type: isSlowMotionMode ? 'slowMotionVideo' : 'video'
    }
  });
};

 const startBoomerangCapture = async () => {
  if (camera.current == null) {
    Alert.alert('Camera not initialized', 'Camera is not ready yet.');
    return;
  }
  try {
    setIsRecording(true);
    
    const options = {
      flash: flash,
      fileType: 'mp4',
      videoCodec: 'h264',
      videoBitRate: 8000000, // 8 Mbps for high quality
      fps: 30, // 30 fps for good quality and compatibility
      maxDuration: 1,
      videoStabilizationMode: 'standard',
      audioQuality: 'high',
      audioBitRate: 128000,
      onRecordingFinished: (video) => {
        processBoomerangVideo(video.path);
      },
      onRecordingError: (error) => {
        Alert.alert('Error', 'Failed to record boomerang video. Please try again.');
      },
       onRecordingFinished: (video) => {
      processBoomerangVideo(video.path);
    },
    };

    await camera.current.startRecording(options);
    
    setTimeout(() => {
      if (camera.current) {
        camera.current.stopRecording();
      }
      setIsRecording(false);
    }, 1000);
  } catch (error) {
    Alert.alert('Error', 'Failed to start boomerang recording. Please try again.');
    setIsRecording(false);
  }
};

  const processBoomerangVideo = async (videoPath) => {
  console.log('Processing boomerang video:', videoPath);
  // Here you would typically process the video to create the boomerang effect
  // For now, we'll just pass it as-is to the EditingScreen
  navigation.navigate('EditingScreen', { 
    media: { uri: videoPath, type: 'boomerang' }
  });
};

  const handleCameraPress = () => {
  if (isBoomerangMode) {
    startBoomerangCapture();
  } else if (isSlowMotionMode) {
    if (!isRecording) {
      startVideoRecording();
    } else {
      stopVideoRecording();
    }
  } else if (!isRecording) {
    takePicture();
  }
};

  const handleCameraLongPress = () => {
    if (!isRecording && !isBoomerangMode && !isSlowMotionMode) {
      startVideoRecording();
    }
  };

  const handlePressOut = () => {
    if (isRecording && !isSlowMotionMode) {
      stopVideoRecording();
    }
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const closeFilterBar = () => {
    if (isFilterBarVisible) {
      setIsFilterBarVisible(false);
    }
  };

  const enterSpecialMode = (mode) => {
    setIsSpecialMode(true);
    if (mode === 'slowMotion') {
      setIsSlowMotionMode(true);
      setIsBoomerangMode(false);
    } else if (mode === 'boomerang') {
      setIsBoomerangMode(true);
      setIsSlowMotionMode(false);
    }
  };

  const exitSpecialMode = () => {
    setIsSpecialMode(false);
    setIsSlowMotionMode(false);
    setIsBoomerangMode(false);
  };

  const FilterPreview = ({ filter, isSelected, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.filterPreview, isSelected && styles.selectedFilter]}>
      <View style={styles.filterPreviewImage}>
        <filter.filterComponent style={StyleSheet.absoluteFillObject}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'white' }]} />
        </filter.filterComponent>
      </View>
      <Text style={styles.filterText}>{filter.title}</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={closeFilterBar}>
      <View style={styles.container}>
        {allPermissionsRequested ? (
          hasPermissions.camera ? (
            isCameraInitialized && selectedDevice ? (
              <View style={styles.cameraContainer}>
                <Camera
                  ref={camera}
                  style={styles.camera}
                  device={selectedDevice}
                  isActive={true}
                  photo={true}
                  video={true}
                  audio={true}
                  flash={flash}
                />
                {selectedFilter && selectedFilter.id !== 1 && (
                  <View style={[StyleSheet.absoluteFillObject, { opacity: 0.5 }]}>
                    <selectedFilter.filterComponent style={StyleSheet.absoluteFillObject}>
                      <View style={StyleSheet.absoluteFillObject} />
                      </selectedFilter.filterComponent>
                  </View>
                )}
                
                <TouchableOpacity style={[styles.iconButton, styles.flashButton]} onPress={toggleFlash}>
                  {flash === 'on' && <Icon1 name="flash" size={24} color="white" />}
                  {flash === 'off' && <Icon2 name="flash-off" size={24} color="white" />}
                  {flash === 'auto' && <Icon3 name="flash-auto" size={24} color="white" />}
                </TouchableOpacity>

                
                <TouchableOpacity style={styles.imageButton} onPress={toggleModal}>
  <Image source={imageSource} style={styles.imageButtonIcon} />
</TouchableOpacity>
                
                {isRecording && (
                  <View style={styles.countdownContainer}>
                    <Text style={styles.countdownText}>{countdown}</Text>
                  </View>
                )}
                
               <TouchableOpacity style={[styles.iconButton, styles.galleryButton]} onPress={openGallery}>
  <Icon name="images" size={24} color="white" />
</TouchableOpacity>
                
             <TouchableOpacity style={[styles.iconButton, styles.flipButton]} onPress={flipCamera}>
  <Icon name="camera-rotate" size={24} color="white" />
</TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.takePictureButton}
                  onPress={handleCameraPress}
                  onLongPress={handleCameraLongPress}
                  onPressOut={handlePressOut}
                >
                  <Icon 
                    name={isRecording ? "video" : isBoomerangMode ? "repeat" : isSlowMotionMode ? "clock" : "camera"} 
                    size={30} 
                    color="white" 
                  />
                </TouchableOpacity>

                {isSpecialMode && (
                  <TouchableOpacity style={styles.backButton} onPress={exitSpecialMode}>
                    <Icon name="arrow-left" size={30} color="white" />
                  </TouchableOpacity>
                )}

                {isFilterBarVisible && (
                  <ScrollView
                    horizontal
                    style={styles.filterBar}
                    showsHorizontalScrollIndicator={false}
                  >
                    {FILTERS.map((filter) => (
                      <FilterPreview
                        key={filter.id}
                        filter={filter}
                        isSelected={selectedFilter && selectedFilter.id === filter.id}
                        onPress={() => setSelectedFilter(filter)}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <Text>Camera initializing... Please wait.</Text>
              </View>
            )
          ) : (
            <View style={styles.permissionMissingContainer}>
              <Text>Camera permission is required for this application.</Text>
            </View>
          )
        ) : (
          <View style={styles.permissionMissingContainer}>
            <Text>Requesting permissions...</Text>
          </View>
        )}

        <Modal
          transparent={true}
          animationType="slide"
          visible={isModalVisible}
          onRequestClose={toggleModal}
        >
          <TouchableWithoutFeedback onPress={toggleModal}>
            <View style={styles.modalContainer}>
              <Image source={require('../assets/camera_screen/Gradiant.png')} style={styles.modalImage} />
              <TouchableOpacity
                style={styles.overlayContent}
                onPress={() => {
                  enterSpecialMode('boomerang');
                  setIsModalVisible(false);
                }}
              >
                <Image source={require('../assets/camera_screen/Group32.png')} style={styles.overlayImage} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.overlayContent3}
                onPress={() => {
                  setIsModalVisible(false);
                  navigation.navigate('Layout');
                }}
              >
                <Image source={require('../assets/camera_screen/Group34.png')} style={styles.overlayImage3} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.overlayContent2}
                onPress={() => {
                  enterSpecialMode('slowMotion');
                  setIsModalVisible(false);
                }}
              >
                <Image source={require('../assets/camera_screen/Group31.png')} style={styles.overlayImage2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.overlayContent1}
                onPress={() => {
                  setIsFilterBarVisible(!isFilterBarVisible);
                  setIsModalVisible(false);
                }}
              >
                <Image source={require('../assets/camera_screen/Group33.png')} style={styles.overlayImage1} />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        
        <GalleryMenu
    isVisible={isGalleryMenuVisible}
    onClose={() => setIsGalleryMenuVisible(false)}
    onImageSelect={handleGalleryImageSelect}
  />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    height: 100
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
   iconButton: {
    backgroundColor: '#4CBB17',
    width: 50,  // Fixed width
    height: 50, // Fixed height (same as width to ensure circle)
    borderRadius: 25, // Half of width/height
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensures content doesn't spill outside the circle
  },

  flashButton: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
  },
 galleryButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
   flipButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
   takePictureButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionMissingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    backgroundColor: '#4CBB17',
    padding: 5,
    borderRadius: 5,
  },
  countdownText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
 imageButton: {
  position: 'absolute',
  top: 24,
  right: 20,
  backgroundColor: '#4CBB17',
  padding: 10,
  borderRadius: 25,
  width: 50,
  height: 50,
  justifyContent: 'center',
  alignItems: 'center',
},
imageButtonIcon: {
  width: 30,
  height: 30,
},
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: wp('70%'),
    height: hp('50%'),
    alignSelf: 'center',
    marginHorizontal: wp('15%'),
    marginTop: hp('5%'),
    resizeMode: 'contain',
  },
  overlayContent: {
    position: 'absolute',
    justifyContent: 'center',
    top: hp('38%'),
    alignItems: 'center',
  },
  overlayContent1: {
    position: 'absolute',
    alignSelf: 'flex-start',
    left: hp('11%'),
    bottom: hp('44%'),
  },
  overlayContent2: {
    position: 'absolute',
    alignSelf: 'flex-end',
    left: hp('21%'),
    bottom: hp('32%'),
  },
  overlayContent3: {
    position: 'absolute',
    alignSelf: 'flex-end',
    right: hp('10%'),
    bottom: hp('44%'),
  },
  overlayImage: {
    width: wp('15%'),
    height: hp('5%'),
    resizeMode: 'contain',
  },
  overlayImage1: {
    width: wp('10%'),
    height: hp('6%'),
    resizeMode: 'contain',
  },
  overlayImage2: {
    width: wp('20%'),
    height: hp('10%'),
    resizeMode: 'contain',
  },
  overlayImage3: {
    width: wp('12%'),
    height: hp('6%'),
    resizeMode: 'contain',
  },
  filterBar: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: 100,
  },
  filterPreview: {
    width: 70,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  filterPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  selectedFilter: {
    borderWidth: 2,
    borderColor: 'white',
  },
  filterText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
    zIndex: 10,
  },
});

export default CameraScreen;