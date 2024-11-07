import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, PanResponder, TouchableOpacity, Image, Alert, ScrollView, Text, Dimensions ,Animated} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { captureRef } from 'react-native-view-shot';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon1 from 'react-native-vector-icons/FontAwesome5';
import Icon2 from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';

const COLORS = [
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray',
  'cyan', 'magenta', 'lime', 'teal', 'indigo', 'violet', 'maroon', 'navy', 'olive', 'silver',
  'aqua', 'fuchsia', 'coral', 'turquoise', 'gold', 'plum', 'khaki', 'salmon', 'crimson', 'lavender',
  'orchid', 'skyblue', 'peru', 'goldenrod', 'chocolate', 'tan', 'thistle', 'tomato', 'wheat', 'violet'
];

export default function DrawingScreen() {
   const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [tool, setTool] = useState('draw');
  const [originalMedia, setOriginalMedia] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [strokeColor, setStrokeColor] = useState('black');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [eraseRadius, setEraseRadius] = useState(20);
  const [overlayElements, setOverlayElements] = useState([]);

  const navigation = useNavigation();
  const route = useRoute();
  const svgRef = useRef(null);

 useEffect(() => {
    if (route.params?.originalMedia) {
      setOriginalMedia(route.params.originalMedia);
      
      // Handle cropped image if it exists
      if (route.params.originalMedia.croppedUri) {
        setCroppedImage({ uri: route.params.originalMedia.croppedUri });
        // Get dimensions for cropped image
        Image.getSize(route.params.originalMedia.croppedUri, (width, height) => {
          const screenWidth = Dimensions.get('window').width;
          const screenHeight = Dimensions.get('window').height;
          const scaleFactor = Math.min(screenWidth / width, screenHeight / height);
          setImageSize({
            width: width * scaleFactor,
            height: height * scaleFactor
          });
        });
      } else {
        // Handle original image
        Image.getSize(route.params.originalMedia.uri, (width, height) => {
          const screenWidth = Dimensions.get('window').width;
          const screenHeight = Dimensions.get('window').height;
          const scaleFactor = Math.min(screenWidth / width, screenHeight / height);
          setImageSize({
            width: width * scaleFactor,
            height: height * scaleFactor
          });
        });
      }
    }

    if (route.params?.existingPaths) {
      setPaths(route.params.existingPaths);
    }
    if (route.params?.overlayElements) {
      setOverlayElements(route.params.overlayElements);
    }
  }, [route.params]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      if (tool === 'draw') {
        setCurrentPath({ d: `M${locationX},${locationY}`, stroke: strokeColor, strokeWidth });
      } else if (tool === 'erase') {
        erasePaths(locationX, locationY);
      }
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      if (tool === 'draw' && currentPath) {
        setCurrentPath(prevPath => ({
          ...prevPath,
          d: prevPath.d + ` L${locationX},${locationY}`
        }));
      } else if (tool === 'erase') {
        erasePaths(locationX, locationY);
      }
    },
    onPanResponderRelease: () => {
      if (tool === 'draw' && currentPath) {
        setPaths(prevPaths => [...prevPaths, currentPath]);
        setCurrentPath(null);
      }
    },
  });

  const erasePaths = (x, y) => {
    setPaths(prevPaths => 
      prevPaths.map(path => {
        const newPath = erasePath(path.d, x, y);
        return newPath ? { ...path, d: newPath } : null;
      }).filter(Boolean)
    );
  };

  const erasePath = (pathD, x, y) => {
    const parts = pathD.split(/(?=[ML])/);
    let newPath = '';
    let isErasing = false;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const [command, coords] = [part[0], part.slice(1)];
      const [cx, cy] = coords.split(',').map(Number);
      const distance = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);

      if (distance <= eraseRadius) {
        isErasing = true;
      } else {
        if (isErasing && command === 'L') {
          newPath += `M${cx},${cy}`;
          isErasing = false;
        } else {
          newPath += part;
        }
      }
    }

    return newPath;
  };

  const handleToolChange = (newTool) => {
    setTool(newTool);
  };

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath(null);
  };

  const handleDone = async () => {
    if (svgRef.current) {
      try {
        const result = await captureRef(svgRef, {
          format: "png",
          quality: 1,
          width: imageSize.width,
          height: imageSize.height,
        });
        if (route.params?.onDrawingComplete) {
          route.params.onDrawingComplete(result, paths);
        }
        navigation.goBack();
      } catch (error) {
        console.error('Error capturing drawing:', error);
        Alert.alert('Error', 'Failed to save the drawing. Please try again.');
      }
    }
  };

  const handleColorChange = (color) => {
    setStrokeColor(color);
  };

  const handleStrokeWidthChange = (width) => {
    setStrokeWidth(width);
    if (tool === 'erase') {
      setEraseRadius(width * 2);
    }
  };
  const renderOverlayElements = () => {
    return overlayElements.map((element, index) => {
      switch (element.type) {
        case 'text':
          return (
            <Animated.View key={element.id} style={[styles.overlay, getOverlayStyle(element)]}>
              <Text style={[styles.overlayText, element.style]}>{element.content}</Text>
            </Animated.View>
          );
        case 'sticker':
          return (
            <Animated.View key={element.id} style={[styles.stickerContainer, getOverlayStyle(element)]}>
              <FastImage
                source={{ uri: element.stickerURI }}
                style={styles.sticker}
                resizeMode={FastImage.resizeMode.contain}
              />
            </Animated.View>
          );
        case 'hashtag':
          return (
            <Animated.View key={element.id} style={[styles.overlay, getOverlayStyle(element)]}>
              <Text style={[styles.overlayText, { color: element.color }]}>#{element.title}</Text>
            </Animated.View>
          );
        case 'friend':
          return (
            <Animated.View key={element.id} style={[styles.overlay, getOverlayStyle(element)]}>
              <Text style={[styles.overlayText, { color: element.color }]}>@{element.name}</Text>
            </Animated.View>
          );
        case 'location':
          return (
            <Animated.View key={element.id} style={[styles.overlay, styles.locationOverlay, getOverlayStyle(element)]}>
              <View style={styles.locationContent}>
                <Icon name="location" size={16} color={element.color || '#020E27'} />
                <Text style={[styles.overlayText, { color: element.color || '#020E27' }]}>
                  {element.placeName}
                </Text>
              </View>
            </Animated.View>
          );
          case 'pip':
          return (
            <Animated.View
              key={`pip-${index}`}
              style={[
                styles.pipContainerOuter,
                {
                  transform: [
                    { translateX: element.pan.x },
                    { translateY: element.pan.y },
                    { scale: element.scale },
                    { rotate: `${element.rotation}deg` },
                  ],
                  width: element.size.width + 50,
                  height: element.size.height + 40,
                }
              ]}
            >
              <Animated.View
                style={[
                  styles.pipBackgroundContainer,
                  {
                    backgroundColor: element.backgroundColor,
                    width: element.size.width,
                    height: element.size.height,
                  }
                ]}
              >
                <Animated.Image
                  source={{ uri: element.uri }}
                  style={[
                    styles.pipImage,
                    { opacity: element.opacity },
                    element.flipped && { transform: [{ scaleX: -1 }] }
                  ]}
                />
              </Animated.View>
            </Animated.View>
          );

        default:
          return null;
      }
    });
  };

  const getOverlayStyle = (item) => ({
    position: 'absolute',
    transform: [
      { translateX: item.pan.x._value },
      { translateY: item.pan.y._value },
      { scale: item.scale._value },
      { rotate: `${item.rotate._value}deg` },
    ],
    ...(item.style || {}),
  });
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#020E27" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.iconButton, tool === 'draw' ? styles.activeButton : null]} 
          onPress={() => handleToolChange('draw')}
        >
          <Icon name="pencil" size={24} color={tool === 'draw' ? '#FFFFFF' : '#020E27'} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.iconButton, tool === 'erase' ? styles.activeButton : null]} 
          onPress={() => handleToolChange('erase')}
        >
          <Icon1 name="eraser" size={24} color={tool === 'erase' ? '#FFFFFF' : '#020E27'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={clearCanvas}>
          <Icon name="trash-bin" size={24} color="#020E27" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleDone}>
          <Icon2 name="done" size={28} color="#020E27" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.canvasContainer}>
{(croppedImage || originalMedia) && (
  <Image
    source={{ uri: croppedImage ? croppedImage.uri : originalMedia.uri }}
    style={[StyleSheet.absoluteFillObject, { width: imageSize.width, height: imageSize.height }]}
    resizeMode="contain"
  />
)}
        <Svg
          style={[
            StyleSheet.absoluteFillObject,
            { width: imageSize.width, height: imageSize.height }
          ]}
          {...panResponder.panHandlers}
          ref={svgRef}
        >
          <G>
            {paths.map((path, index) => (
              <Path
                key={index}
                d={path.d}
                stroke={path.stroke}
                strokeWidth={path.strokeWidth}
                fill="none"
              />
            ))}
            {currentPath && (
              <Path
                d={currentPath.d}
                stroke={currentPath.stroke}
                strokeWidth={currentPath.strokeWidth}
                fill="none"
              />
            )}
          </G>
        </Svg>
          {renderOverlayElements()}
      </View>
      
      <View style={styles.controlsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
          {COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[styles.colorButton, { backgroundColor: color }, color === strokeColor && styles.selectedColor]}
              onPress={() => handleColorChange(color)}
            />
          ))}
        </ScrollView>
        <View style={styles.strokeWidthContainer}>
          <Text style={styles.strokeWidthLabel}>
            {tool === 'draw' ? 'Stroke' : 'Eraser'} Width: {strokeWidth.toFixed(1)}
          </Text>
          <Slider
            style={styles.strokeWidthSlider}
            minimumValue={1}
            maximumValue={20}
            step={0.5}
            value={strokeWidth}
            onValueChange={handleStrokeWidthChange}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#000000"
            thumbTintColor="#2196F3"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  iconButton: {
    padding: 10,
    borderRadius: 5,
  },
  activeButton: {
    backgroundColor: '#000',
  },
  colorPicker: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    marginHorizontal: 5,
  },
  selectedColor: {
    borderColor: '#000',
    borderWidth: 3,
  },
  strokeWidthContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  strokeWidthLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  strokeWidthSlider: {
    width: '100%',
    height: 40,
  },
  overlay: {
    position: 'absolute',
    zIndex: 10,
    padding: 5,
    borderRadius: 5,
  },
  overlayText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  stickerContainer: {
    position: 'absolute',
    zIndex: 2,
  },
  sticker: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  locationOverlay: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pipContainerOuter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipBackgroundContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});