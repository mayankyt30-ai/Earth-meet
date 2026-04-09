import React, { useContext, useEffect, useState } from 'react';
import '../styles/MeetPage.css';
import { useParams } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { config, fetchRtcToken } from '../AgoraSetup';
import VideoPlayer from '../components/VideoPlayer';
import Controls from '../components/Controls';
import Participants from '../components/Participants';
import Chat from '../components/Chat';
import { motion } from 'framer-motion';

const MeetRoom = () => {
  const { id } = useParams();
  const [roomName, setRoomName] = useState('');
  const { 
    socket, setInCall, client, users, setUsers, ready, tracks, 
    setStart, setParticipants, start 
  } = useContext(SocketContext);

  // ✅ Always string userId
  const storedId = localStorage.getItem("userId");
  const userId = storedId ? storedId : Date.now().toString();
  localStorage.setItem("userId", userId); 

  useEffect(() => {
    socket.emit('join-room', { userId, roomId: id });

    socket.on("user-joined", async () => {
      setInCall(true);
    });

    socket.emit('get-participants', { roomId: id });
    socket.on("participants-list", async ({ usernames, roomName }) => {
      setParticipants(usernames);
      setRoomName(roomName);
    });

    return () => {
      socket.off("user-joined");
      socket.off("participants-list");
      client.off("user-published");
      client.off("user-unpublished");
      client.off("user-left");
    };
  }, [socket, id, userId, setInCall, setParticipants]);

  useEffect(() => {
    const init = async (channelName) => {
      if (!channelName) {
        console.error("Channel name is undefined");
        return;
      }

      try {
        client.on("user-published", async (user, mediaType) => {
          if (client.connectionState && ["DISCONNECTING", "DISCONNECTED"].includes(client.connectionState)) {
            return;
          }

          try {
            await client.subscribe(user, mediaType);
          } catch (err) {
            console.warn("Agora subscribe skipped during disconnect:", err);
            return;
          }

          if (mediaType === "video") setUsers(prev => [...prev, user]);
          if (mediaType === "audio" && user.audioTrack) user.audioTrack.play();
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "audio" && user.audioTrack) user.audioTrack.stop();
          if (mediaType === "video") setUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        client.on("user-left", (user) => {
          socket.emit("user-left-room", { userId: user.uid, roomId: id });
          setUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        const agoraUid = Number(userId) || 0;
        const token = await fetchRtcToken(channelName, agoraUid, 'publisher');
        if (!token) {
          console.error('Agora token fetch failed, cannot join channel.');
          return;
        }

        await client.join(config.appId, channelName, token, agoraUid);

        // ✅ Only publish existing tracks
        if (tracks) {
          const toPublish = [];
          if (tracks[0]) toPublish.push(tracks[0]); // mic
          if (tracks[1]) toPublish.push(tracks[1]); // camera
          if (toPublish.length > 0) {
            await client.publish(toPublish);
          }
        }

        setStart(true);

      } catch (err) {
        console.error("Agora init error:", err);
      }
    };

    if (ready && tracks) {
      init(id);
    }
  }, [id, client, ready, tracks, socket, userId, setUsers, setStart]);

  return (
    <motion.div 
      className='meetPage'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="meetPage-header">
        <h3>Meet: <span>{roomName}</span></h3>
        <p>Meet Id: <span id='meet-id-copy'>{id}</span></p>
      </div>

      <Participants />
      <Chat roomId={id} userId={userId} />

      <motion.div 
        className="meetPage-videoPlayer-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {start && tracks ? <VideoPlayer tracks={tracks} users={users} /> : ''}
      </motion.div>

      <motion.div 
        className="meetPage-controls-part"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {ready && tracks && <Controls tracks={tracks} client={client} />}
      </motion.div>
    </motion.div>
  )
}

export default MeetRoom;
