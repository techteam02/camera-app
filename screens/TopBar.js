import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ScrollView, TouchableWithoutFeedback, Alert,Animated, Dimensions } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon1 from 'react-native-vector-icons/FontAwesome';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { FILTERS } from './utils/Filters';
import ImagePicker from 'react-native-image-crop-picker';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TopBar = ({ 
  onStickerPress, 
  onPIPPress,
  onSelectFilter,
  selectedFilter,
  isVideo,
  currentMedia,
  onImageCropped,
  contrastValue,
  onContrastChange,
  brightnessValue,
  onBrightnessChange,
  temperatureValue,
  onTemperatureChange,
  softnessValue,
  onSoftnessChange,
  sharpnessValue,
  onSharpnessChange,
  saturationValue,
  onSaturationChange,
  onApplyVideoEffects, // New prop for handling video effects application
}) => {
  const navigation = useNavigation();
  const [isScrollBarVisible, setIsScrollBarVisible] = useState(false);
  const [currentAdjustment, setCurrentAdjustment] = useState(null);
  const [isFilterBarVisible, setIsFilterBarVisible] = useState(false);
  const [isStickerBarVisible, setIsStickerBarVisible] = useState(false);


  const toggleScrollBar = () => {
    setIsScrollBarVisible(!isScrollBarVisible);
    setCurrentAdjustment(null);
    setIsFilterBarVisible(false);
  };

  const handleIconPress = (icon) => {
    if (icon.name === 'scissors') {
      if (isVideo) {
        navigation.navigate('TrimScreen', { video: currentMedia });
      } else {
        Alert.alert('Trim not available', 'Trimming is only available for videos.');
      }
    } else if (icon.name === 'crop') {
      if (isVideo) {
        navigation.navigate('VideoCropScreen', { video: currentMedia });
      } else {
        console.log('Attempting to crop image:', currentMedia);
        if (!currentMedia || !currentMedia.uri) {
          console.error('Invalid currentMedia or URI');
          Alert.alert('Error', 'Invalid image data. Please try again.');
          return;
        }

        ImagePicker.openCropper({
          path: currentMedia.uri,
          width: 1080, // Increased width for better quality
          height: 1080, // Increased height for better quality
          cropperToolbarTitle: 'Crop Image',
          cropperActiveWidgetColor: '#3498db',
          cropperStatusBarColor: '#3498db',
          cropperToolbarColor: '#3498db',
          cropperToolbarWidgetColor: '#ffffff',
          showCropGuidelines: true,
          showCropFrame: true,
          enableRotationGesture: true,
          enableZoom: true,
          freeStyleCropEnabled: true,
          compressImageQuality: 1, // Set to 1 for maximum quality
          compressImageMaxWidth: 2000, // Increased max width
          compressImageMaxHeight: 2000, // Increased max height
          forceJpg: false, // This will
        }).then(image => {
          console.log('Cropped image:', image);
          if (onImageCropped) {
            onImageCropped({ uri: image.path, type: 'photo', width: image.width, height: image.height });
          } else {
            console.warn('onImageCropped is not defined');
          }
        }).catch(error => {
          console.error('Cropping error:', error);
          if (error.code === 'E_PICKER_CANCELLED') {
            console.log('User cancelled image cropping');
          } else {
            Alert.alert('Error', 'Failed to crop image. Please try again.');
          }
        });
      }
    } else if (icon.adjustment) {
      setCurrentAdjustment(icon.adjustment);
      setIsScrollBarVisible(false);
      setIsFilterBarVisible(false);
    } else if (icon.onPress) {
      icon.onPress();
    } else if (icon.name === 'color-filter') {
      setIsScrollBarVisible(false);
      setIsFilterBarVisible(!isFilterBarVisible);
      setCurrentAdjustment(null);
    }

    if (icon.name === 'smile-o') {
      setIsScrollBarVisible(false);
      setIsFilterBarVisible(false);
      setIsStickerBarVisible(!isStickerBarVisible);
    } else {
      setIsStickerBarVisible(false);
    }

    switch (icon.name) {
      case 'image-size-select-large':
        onPIPPress();
        break;
      case 'smile-o':
        onStickerPress();
        break;
      case 'brush':
        navigation.navigate('DrawingScreen', { image: currentMedia.uri });
        break;
    }
  };

  const closeAllDropdowns = () => {
    setCurrentAdjustment(null);
    setIsFilterBarVisible(false);
  };

  const scrollBarIcons = [
    { name: 'crop', text: 'Crop', iconSet: 'Ionicons' },
    { name: 'adjust', text: 'Contrast', iconSet: 'FontAwesome', adjustment: 'contrast' },
    { name: 'sun-o', text: 'light', iconSet: 'FontAwesome', adjustment: 'brightness' },
    { name: 'thermometer-outline', text: 'degree', iconSet: 'Ionicons', adjustment: 'temperature' },
    { name: 'blur', text: 'Softness', iconSet: 'MaterialCommunityIcons', adjustment: 'softness' },
    { name: 'image-filter-center-focus', text: 'clarity', iconSet: 'MaterialCommunityIcons', adjustment: 'sharpness' },
    ...(isVideo ? [] : [{ name: 'invert-colors', text: 'Chroma', iconSet: 'MaterialIcons', adjustment: 'saturation' }]),
    { name: 'color-filter', text: 'Filters', iconSet: 'Ionicons' },
    { name: 'image-size-select-large', text: 'PIP', iconSet: 'MaterialCommunityIcons', onPress: onPIPPress },
    ...(isVideo ? [{ name: 'scissors', text: 'Trim', iconSet: 'FontAwesome', onPress: () => handleIconPress({ name: 'scissors' }) }] : []),
    { name: 'smile-o', text: 'Stickers', iconSet: 'FontAwesome'},
  ];  

  const renderAdjustmentBar = () => {
    switch (currentAdjustment) {
      case 'contrast':
        return (
          <View style={styles.adjustmentSlider}>
            <Text style={styles.adjustText}>Contrast: {contrastValue.toFixed(2)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2}
              value={contrastValue}
              onValueChange={onContrastChange}
              minimumTrackTintColor="#020E27"
              maximumTrackTintColor="#020E27"
                            thumbTintColor="#000000"

            />
          </View>
        );
      case 'brightness':
        return (
          <View style={styles.adjustmentSlider}>
            <Text style={styles.adjustText}>Brightness: {brightnessValue.toFixed(2)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={-1.5}
              maximumValue={1.5}
              value={brightnessValue}
              onValueChange={onBrightnessChange}
              minimumTrackTintColor="#000000"
              maximumTrackTintColor="#000000"
                            thumbTintColor="#000000"

            />
          </View>
        );
      case 'temperature':
        return (
          <View style={styles.adjustmentSlider}>
            <Text style={styles.adjustText}>Temperature: {temperatureValue.toFixed(2)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={-0.5}
              maximumValue={0.5}
              value={temperatureValue}
              onValueChange={onTemperatureChange}
              minimumTrackTintColor="#000000"
              maximumTrackTintColor="#000000"
                            thumbTintColor="#000000"

            />
          </View>
        );
      case 'softness':
        return (
          <View style={styles.adjustmentSlider}>
            <Text style={styles.adjustText}>Softness: {softnessValue.toFixed(2)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={softnessValue}
              onValueChange={onSoftnessChange}
              minimumTrackTintColor="#000000"
              maximumTrackTintColor="#000000"
                            thumbTintColor="#000000"

            />
          </View>
        );
      case 'sharpness':
        return (
          <View style={styles.adjustmentSlider}>
            <Text style={styles.adjustText}>Sharpness: {sharpnessValue.toFixed(2)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={sharpnessValue}
              onValueChange={onSharpnessChange}
              minimumTrackTintColor="#000000"
              maximumTrackTintColor="#000000"
                            thumbTintColor="#000000"

            />
          </View>
        );
      case 'saturation':
        return (
          <View style={styles.adjustmentSlider}>
            <Text style={styles.adjustText}>Saturation: {saturationValue.toFixed(2)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={2}
              value={saturationValue}
              onValueChange={onSaturationChange}
              minimumTrackTintColor="#000000"
              maximumTrackTintColor="#000000"
                                          thumbTintColor="#000000"

            />
          </View>
        );
      default:
        return null;
    }
  };

const FilterBar = ({ selectedFilter, onSelectFilter }) => {
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (scrollViewRef.current && selectedFilter) {
      const index = FILTERS.findIndex(filter => filter === selectedFilter);
      scrollToFilter(index);
    }
  }, [selectedFilter]);

  const scrollToFilter = (index) => {
    if (scrollViewRef.current) {
      const xOffset = Math.min(index * (SCREEN_WIDTH * 0.25), (FILTERS.length - 4) * (SCREEN_WIDTH * 0.25));
      scrollViewRef.current.scrollTo({ x: xOffset, animated: true });
    }
  };

  const handleFilterSelect = (filter) => {
    onSelectFilter(filter);
  };

  return (
    <View style={styles.filterBarContainer}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        style={styles.filterScrollBar} 
        contentContainerStyle={styles.filterScrollBarContent}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH * 0.25}
        snapToAlignment="center"
        snapToOffsets={FILTERS.map((_, index) => index * (SCREEN_WIDTH * 0.25))}
        scrollEventThrottle={16}
        pagingEnabled={false}
      >
        {FILTERS.map((filter, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterItem,
              selectedFilter === filter && styles.selectedFilterItem
            ]}
            onPress={() => handleFilterSelect(filter)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.selectedFilterText
            ]}>{filter.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={closeAllDropdowns}>
        <View>
          {isScrollBarVisible && !currentAdjustment && !isFilterBarVisible && (
            <ScrollView horizontal style={styles.scrollBar} showsHorizontalScrollIndicator={false}>
              {scrollBarIcons.map((icon, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.scrollBarItem}
                  onPress={() => handleIconPress(icon)}
                >
                  {icon.iconSet === 'Ionicons' ? (
                    <Icon name={icon.name} size={SCREEN_WIDTH * 0.06} color="#020E27" />
                  ) : icon.iconSet === 'FontAwesome' ? (
                    <Icon1 name={icon.name} size={SCREEN_WIDTH * 0.06} color="#020E27" />
                  ) : (
                    <Icon2 name={icon.name} size={SCREEN_WIDTH * 0.06} color="#020E27" />
                  )}
                  <Text style={styles.scrollBarText}>{icon.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {currentAdjustment && (
            <View style={styles.adjustBar}>
              {renderAdjustmentBar()}
              {isVideo && (
          <TouchableOpacity 
            style={styles.applyFilterButton} 
            onPress={onApplyVideoEffects}
          >
            <Text style={styles.applyFilterButtonText}>Apply Filter</Text>
          </TouchableOpacity>
        )}
            </View>
          )}
  {isFilterBarVisible && (
            <FilterBar 
              selectedFilter={selectedFilter} 
              onSelectFilter={onSelectFilter} 
            />
          )}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.bottomBarItem} onPress={toggleScrollBar}>
              <Icon1 name="edit" size={SCREEN_WIDTH * 0.06} color="#020E27" />
              <Text style={styles.bottomBarText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomBarItem} onPress={() => navigation.navigate('UploadScreen')}>
              <Icon name="arrow-redo" size={SCREEN_WIDTH * 0.06} color="#020E27" />
              <Text style={styles.bottomBarText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    zIndex: 2
  },
  scrollBar: {
    backgroundColor: 'white',
    paddingVertical: hp('1%'),
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
  },
  scrollBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp('18%'),
    marginHorizontal: wp('1%'),
    paddingHorizontal: wp('1%'),
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: wp('10%'),
    marginBottom: hp('0.5%'),
  },
  scrollBarText: {
    fontSize: 14,
    color : "#020E27",
    textAlign: 'center',
    fontWeight: '900',
    marginTop: hp('0.5%'),
    width: '100%',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: SCREEN_HEIGHT * 0.02,
    borderTopWidth: 1,
    borderTopColor: '#020E27',
  },
  bottomBarItem: {
    alignItems: 'center',
  },
  bottomBarText: {
    fontSize: 18,
    marginTop: SCREEN_HEIGHT * 0.005,
    fontWeight: "900",
        color : "#020E27",

  },
  adjustBar: {
    backgroundColor: 'white',
    paddingVertical: SCREEN_HEIGHT * 0.01,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  adjustmentSlider: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  adjustText: {
    fontSize: 20,
    marginBottom: SCREEN_HEIGHT * 0.01,
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  slider: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.05,
    alignSelf: 'center',
  },
  filterBarContainer: {
    backgroundColor: 'white',
    paddingVertical: SCREEN_HEIGHT * 0.01,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: SCREEN_HEIGHT * 0.1,
  },
  filterScrollBar: {
    flex: 1,
  },
  filterScrollBarContent: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.02,
  },
  filterItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH * 0.25,
    height: SCREEN_HEIGHT * 0.08,
    marginHorizontal: SCREEN_WIDTH * 0.01,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  filterText: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: 'Bold',
    textAlign: 'center',

  },
  selectedFilterItem: {
    backgroundColor: '#3498db',
  },
  selectedFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
});



export default TopBar;