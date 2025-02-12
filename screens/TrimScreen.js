import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, NativeEventEmitter, NativeModules, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { showEditor, isValidFile, closeEditor } from 'react-native-video-trim';

const TrimScreen = ({ route }) => {
  const navigation = useNavigation();
  const [videoUri, setVideoUri] = useState(route.params.video.uri);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.VideoTrim);
    const subscription = eventEmitter.addListener('VideoTrim', (event) => {
      switch (event.name) {
        case 'onStartTrimming':
          setIsProcessing(true);
          setProcessingStep('Trimming video...');
          break;
          
        case 'onProgressUpdate':
          if (event.progress) {
            setProcessingStep(`Processing: ${Math.round(event.progress * 100)}%`);
          }
          break;
          
        case 'onFinishTrimming':
          setProcessingStep('Finishing up...');
          setIsProcessing(false);
          closeEditor();
          navigation.navigate('EditingScreen', { 
            trimmedVideo: { 
              uri: event.outputPath, 
              type: 'video' 
            } 
          });
          break;
          
        case 'onCancelTrimming':
        case 'onCancel':
          setIsProcessing(false);
          setProcessingStep('');
          navigation.goBack();
          break;
          
        case 'onError':
          setIsProcessing(false);
          setProcessingStep('');
          const errorMessage = event.error || 'Unknown error occurred';
          setError(errorMessage);
          alert(`Failed to trim video: ${errorMessage}`);
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
      setError(null);
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
      setError(error.message);
      alert(`Failed to show trim editor: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Trimming</Text>
      
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.processingText}>{processingStep}</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
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
    fontWeight: 'bold',
  },
  processingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  processingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
  },
});

export default TrimScreen;