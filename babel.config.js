module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
   ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]

  ],   
};
