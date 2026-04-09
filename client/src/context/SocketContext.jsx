import React, { createContext, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import socketIoClient from 'socket.io-client';
import { useClient, useMicrophoneAndCameraTracks } from '../AgoraSetup'


 
export const SocketContext = createContext();

const WS = 'http://localhost:6001';

const socket = socketIoClient(WS);



export const SocketContextProvider =  ({children}) => {
  
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [inCall, setInCall] = useState(false);
  const [users, setUsers] = useState([]);
  const [start, setStart] = useState(false);
  const client = useClient();
  const { ready, tracks } = useMicrophoneAndCameraTracks();


  const [screenTrack, setScreenTrack] = useState(null);

  const [participants, setParticipants] = useState({});


  const [myMeets, setMyMeets] = useState([]);


  const [participantsListOpen, setParticipantsListOpen] = useState(false);
  const [chatsContainerOpen, setChatsContainerOpen] = useState(false);


  const [newMeetType, setNewMeetType] = useState('');
  
  useEffect(()=>{

    socket.on('connect', () => console.log('Connected to server'));
    socket.on('disconnect', () => console.log('Disconnected from server'));
    console.log('Socket connected:', socket.connected);

    socket.on('room-created', ({roomId, meetType}) =>{
      console.log('room-created received', {roomId, meetType});
      if (meetType === 'scheduled') {
        navigate(`/profile`);
      } else {
        navigate(`/meet/${roomId}`);
      }
    });

  }, [socket]);


  
  return (
    <SocketContext.Provider  value={{myMeets, setMyMeets, newMeetType, setNewMeetType, participants, setParticipants, userId, socket, inCall, setInCall, ready, tracks, screenTrack, setScreenTrack, client, users, setUsers, start, setStart, participantsListOpen, setParticipantsListOpen, chatsContainerOpen, setChatsContainerOpen}} >{children}</SocketContext.Provider>
  )
}



// export default socketContext