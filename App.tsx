/* eslint-disable react/self-closing-comp */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useRef, useState} from 'react';
import {
  Dimensions,
  Image,
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {launchImageLibrary} from 'react-native-image-picker';
import PhotoManipulator from 'react-native-photo-manipulator';

// interface CropFrame {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
// }

const App = () => {
  const [cameraPermission, setCameraPermission] = useState(false);
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const [imageUri, setImageUri] = useState('');

  const cardRatio = 8.6 / 5.4;
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const cardWidth = screenWidth * 0.8; // ใช้ 80% ของความกว้างหน้าจอ
  const cardHeight = cardWidth / cardRatio;

  const requestCameraPermissionAndroid = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'App Camera Permission',
          message: 'App needs access to your camera ',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setCameraPermission(true);
      } else {
        setCameraPermission(false);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'ios') {
      const result = await request(PERMISSIONS.IOS.CAMERA);
      if (result === RESULTS.GRANTED) {
        setCameraPermission(true);
      } else {
        setCameraPermission(false);
      }
    } else {
      requestCameraPermissionAndroid();
    }
  };

  useEffect(() => {
    requestCameraPermission();
  }, []);

  // ฟังก์ชันเพื่อครอบรูปจากไฟล์ local
  const selectAndCropImage = async (): Promise<void> => {
    try {
      // เรียก Image Picker เพื่อเลือกรูปจากเครื่อง
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      if (result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        if (photoUri) {
          // ครอบรูปด้วย RNPhotoManipulator

          // const widthImage = photo.width // ความกว้างของภาพ 4624
          // const heightImage = photo.height // ความสูงของภาพ 3468

          // const widthCard = heightImage * 0.8 // ความกว้างของการ์ดที่ต้องการ   2774.4
          // const heightCard = widthCard / cardRatio // ความสูงของการ์ดที่ต้องการ 1742.065

          // // คำนวณตำแหน่ง (x, y) สำหรับการครอบ
          // const x = 3468 - 2774.4 / 2 // 346.8
          // const y = 4624 - 1742.065 / 2 //1441

          const croppedImageUri = await PhotoManipulator.crop(
            photoUri,
            {
              x: 346.8,
              y: 1441,
              width: 2774.4,
              height: 1742.065,
            },
            {width: 2774.4, height: 1742.065},
          );
          // dispatch(
          //   setFrontImgIdCardSlice({
          //     name: new Date().getTime().toString(),
          //     type: 'image/jpeg',
          //     uri: croppedImageUri
          //   })
          // )
          console.log('Cropped Image URI: ', croppedImageUri);
        }
      }
    } catch (error) {
      console.error('Error cropping image: ', error);
    }
  };

  const takeCamera = async () => {
    if (camera) {
      const photo = await camera.current?.takePhoto({});
      console.log({photo});
      if (photo) {
        const imagePath = `file://${photo.path}`;
        const cardRatio = 8.6 / 5.4; // สัดส่วนของการ์ด

        // คำนวณขนาดของรูปภาพที่ต้องการครอบ
        const widthImage = photo.height; // ความกว้างของภาพ 4624
        const heightImage = photo.width; // ความสูงของภาพ 3468

        const widthCard = widthImage * 0.58; // ความกว้างของการ์ดที่ต้องการ   2774.4
        const heightCard = widthCard / cardRatio; // ความสูงของการ์ดที่ต้องการ 1742.065

        // คำนวณตำแหน่ง (x, y) สำหรับการครอบ
        const x = (widthImage - widthCard) / 2; // 346.8
        const y = (heightImage - heightCard) / 2; //1441

        console.log(
          {
            x: x,
            y: y,
            width: widthCard,
            height: heightCard,
          },
          {width: widthCard, height: heightCard},
        );
        // ครอบรูป
        const croppedImageUri = await PhotoManipulator.crop(
          imagePath,
          {
            x: x,
            y: y,
            width: widthCard,
            height: heightCard,
          },
          {width: widthCard, height: heightCard},
        );
        setImageUri(croppedImageUri);
        console.log({croppedImageUri});
      }
    }
  };

  return (
    <View style={{flex: 1}}>
      {imageUri && (
        <Image
          src={imageUri}
          style={{
            width: 200,
            height: 200,
            position: 'absolute',
            resizeMode: 'contain',
            top: 0,
            left: 0,
            zIndex: 99,
          }}
        />
      )}
      <View
        style={{
          flex: 1,
          position: 'relative',
        }}>
        {cameraPermission && device ? (
          <Camera
            outputOrientation="device"
            ref={camera}
            style={{width: '100%', height: '100%'}}
            device={device}
            photo
            isActive={true}
          />
        ) : (
          <Text>No camera device available</Text>
        )}
        <View
          style={{
            position: 'absolute',
            borderColor: 'white',
            borderRadius: 10,
            borderWidth: 2,
            width: cardWidth,
            height: cardHeight,
            top: '50%',
            left: '50%',
            transform: [
              {translateX: -cardWidth / 2},
              {translateY: -cardHeight / 2},
            ],
            zIndex: 1,
          }}>
          <View
            style={{
              borderColor: 'white',
              borderRadius: 1000,
              borderWidth: 2,
              width: 40,
              height: 40,
              top: 5,
              left: 5,
              zIndex: 1,
            }}>
            <View
              style={{
                borderRadius: 2,
                borderColor: 'white',
                borderWidth: 2,
                width: cardWidth * (2.5 / 8.6) * 0.8,
                height: cardHeight * (3 / 5.4) * 0.8,
                top: (cardHeight / 3) * 1.35,
                right: -cardWidth / 1.4,
                zIndex: 1,
              }}></View>
          </View>
        </View>
        <TouchableOpacity
          // onPress={() => selectAndCropImage()}
          onPress={takeCamera}
          style={{
            position: 'absolute',
            width: 80,
            height: 80,
            backgroundColor: 'green',
            bottom: '5%',
            left: '50%',
            transform: [{translateX: -40}],
            zIndex: 1,
          }}>
          <Text>Take Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default App;
