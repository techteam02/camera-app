import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, NativeEventEmitter, NativeModules } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { showEditor, isValidFile, closeEditor } from 'react-native-video-trim';

const TrimScreen = ({ route }) => {
  const navigation = useNavigation();
  const [videoUri, setVideoUri] = useState(route.params.video.uri);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.VideoTrim);
    const subscription = eventEmitter.addListener('VideoTrim', (event) => {
      switch (event.name) {
        case 'onStartTrimming':
          setIsProcessing(true);
          break;
        case 'onFinishTrimming':
          setIsProcessing(false);
          closeEditor();
          navigation.navigate('EditingScreen', { trimmedVideo: { uri: event.outputPath, type: 'video' } });
          break;
        case 'onCancelTrimming':
        case 'onCancel':
        case 'onError':
          setIsProcessing(false);
          if (event.error) {
            alert(`Failed to trim video: ${event.error}`);
          }
          break;
      }
    });

    trimVideo();

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  const trimVideo = async () => {
    try {
      const isValid = await isValidFile(videoUri);
      if (!isValid) {
        throw new Error('Invalid video file');
      }

      await showEditor(videoUri, {
        maxDuration: 15,
        quality: 'low',
        outputFormat: 'mp4',
        bitrate: 2000000,
        fps: 24,
        useHardwareAcceleration: true,
      });
    } catch (error) {
      console.error('Error showing trim editor:', error);
      alert(`Failed to show trim editor: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Trimming in Progress</Text>
      {isProcessing && <Text style={styles.processingText}>Processing...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  processingText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  }
});

export default TrimScreen;