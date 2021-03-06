import { atom } from 'recoil';

export const RaytracerProperties = atom({
  key: 'raytracerProperties',
  default: {
    imageWidth: 640,
    imageHeight: 360,
    samplesPerPixel: 20,
    maxBounces: 50,
    numOfWorkers: 1,
    webGPUavailable: false,
    webGPUenabled: false,
  },
});

export const StartRendering = atom({
  key: 'startRendering',
  default: false,
});
