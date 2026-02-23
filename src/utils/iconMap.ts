import {
  mdiLightbulb,
  mdiLightbulbOutline,
  mdiLightbulbGroup,
  mdiCeilingLight,
  mdiFloorLamp,
  mdiLedStrip,
  mdiOutdoorLamp,
  mdiThermometer,
  mdiSnowflake,
  mdiFire,
  mdiBlindsHorizontal,
  mdiVideo,
  mdiLock,
  mdiLockOpen,
  mdiShieldHome,
  mdiEye,
  mdiToggleSwitch,
  mdiHome,
  mdiHomeFloor1,
  mdiCog,
  mdiWifi,
  mdiWifiOff,
  mdiAlert,
  mdiChevronLeft,
  mdiWeatherCloudy,
  mdiPower,
  mdiFan,
  mdiWaterPercent,
  mdiDoorOpen,
  mdiDoorClosed,
  mdiMotionSensor,
  mdiWindowOpen,
  mdiWindowClosed,
  mdiBattery,
  mdiFlash,
  mdiGauge,
  mdiWeatherWindy,
  mdiGarageOpen,
  mdiGarage,
  mdiCurtains,
  mdiRollerShade,
  mdiWindowShutter,
  mdiWater,
} from '@mdi/js';
import type { HassEntity } from 'home-assistant-js-websocket';
import { getDomain } from './entityHelpers';

export const DOMAIN_ICONS: Record<string, string> = {
  light: mdiLightbulb,
  climate: mdiThermometer,
  cover: mdiBlindsHorizontal,
  camera: mdiVideo,
  lock: mdiLock,
  alarm_control_panel: mdiShieldHome,
  sensor: mdiEye,
  binary_sensor: mdiEye,
  switch: mdiToggleSwitch,
  fan: mdiFan,
};

export const DEVICE_CLASS_ICONS: Record<string, Record<string, string>> = {
  sensor: {
    temperature: mdiThermometer,
    humidity: mdiWaterPercent,
    power: mdiFlash,
    energy: mdiFlash,
    battery: mdiBattery,
    pressure: mdiGauge,
    wind_speed: mdiWeatherWindy,
    illuminance: mdiLightbulbOutline,
    moisture: mdiWater,
    gas: mdiGauge,
    voltage: mdiFlash,
    current: mdiFlash,
  },
  binary_sensor: {
    door: mdiDoorClosed,
    motion: mdiMotionSensor,
    window: mdiWindowClosed,
    garage_door: mdiGarage,
    opening: mdiDoorClosed,
    lock: mdiLock,
    moisture: mdiWater,
    battery: mdiBattery,
    occupancy: mdiMotionSensor,
  },
  cover: {
    garage: mdiGarage,
    shutter: mdiWindowShutter,
    curtain: mdiCurtains,
    blind: mdiBlindsHorizontal,
    shade: mdiRollerShade,
  },
  light: {
    ceiling: mdiCeilingLight,
    floor: mdiFloorLamp,
    strip: mdiLedStrip,
    outdoor: mdiOutdoorLamp,
  },
};

// State-aware icons for binary sensors
const BINARY_SENSOR_ON_ICONS: Record<string, string> = {
  door: mdiDoorOpen,
  window: mdiWindowOpen,
  garage_door: mdiGarageOpen,
  opening: mdiDoorOpen,
  lock: mdiLockOpen,
};

export function getEntityIcon(entity: HassEntity): string {
  const domain = getDomain(entity.entity_id);
  const deviceClass = entity.attributes.device_class;

  // Binary sensor: use state-aware icons
  if (domain === 'binary_sensor' && deviceClass && entity.state === 'on') {
    const onIcon = BINARY_SENSOR_ON_ICONS[deviceClass];
    if (onIcon) return onIcon;
  }

  // Check device_class mapping
  if (deviceClass) {
    const domainMap = DEVICE_CLASS_ICONS[domain];
    if (domainMap && domainMap[deviceClass]) {
      return domainMap[deviceClass];
    }
  }

  // Fallback to domain icon
  return DOMAIN_ICONS[domain] || mdiEye;
}

export const SIDEBAR_ICONS: Record<string, string> = {
  home: mdiHome,
  lights: mdiLightbulbGroup,
  climate: mdiThermometer,
  covers: mdiBlindsHorizontal,
  cameras: mdiVideo,
  security: mdiShieldHome,
  settings: mdiCog,
};

export const CLIMATE_MODE_ICONS: Record<string, string> = {
  heat: mdiFire,
  cool: mdiSnowflake,
  auto: mdiWeatherCloudy,
  off: mdiPower,
  fan_only: mdiFan,
};

export {
  mdiHome,
  mdiHomeFloor1,
  mdiCog,
  mdiWifi,
  mdiWifiOff,
  mdiAlert,
  mdiChevronLeft,
  mdiLightbulb,
  mdiLightbulbOutline,
  mdiThermometer,
  mdiBlindsHorizontal,
  mdiVideo,
  mdiLock,
  mdiLockOpen,
  mdiShieldHome,
  mdiEye,
  mdiToggleSwitch,
  mdiSnowflake,
  mdiFire,
  mdiPower,
  mdiFan,
  mdiLightbulbGroup,
};
