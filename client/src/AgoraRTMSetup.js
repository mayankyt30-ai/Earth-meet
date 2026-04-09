import { createClient } from 'agora-rtm-react';

const appId = process.env.REACT_APP_AGORA_APP_ID || 'e264170a051b4036af4c3d385b28a970';
export const useRTMClient = createClient(appId);
