import axios from 'axios';
import { createClient, createMicrophoneAndCameraTracks, createScreenVideoTrack } from 'agora-rtc-react';

const appId = process.env.REACT_APP_AGORA_APP_ID || 'e264170a051b4036af4c3d385b28a970';
const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:6001';

export const config = { mode: 'rtc', codec: 'vp8', appId, token: null };
export const useClient = createClient(config);
export const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();
export const useScreenVideoTrack = createScreenVideoTrack();

export const fetchRtcToken = async (channelName, uid = 0, role = 'publisher') => {
  try {
    const response = await axios.get(`${serverURL}/api/token`, {
      params: {
        channelName,
        uid,
        role,
      },
    });

    return response.data?.rtcToken || null;
  } catch (error) {
    console.error('Failed to fetch Agora RTC token:', error);
    return null;
  }
};
