import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/Home.css';
import { AuthContext } from '../context/authContext';
import { SocketContext } from '../context/SocketContext';
import {CgEnter} from 'react-icons/cg';
import {RiVideoAddFill} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import Dropdown from 'react-bootstrap/Dropdown';
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Groups2Icon from '@mui/icons-material/Groups2';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import BoltIcon from '@mui/icons-material/Bolt';


import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';


const Home = () => {

  
  const [roomName, setRoomName] = useState('');
  const [newMeetDate, setNewMeetDate] = useState('');
  const [newMeetTime, setNewMeetTime] = useState('');



  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinRoomError, setJoinRoomError] = useState('');
  const [createMeetError, setCreateMeetError] = useState('');
  const {logout} = useContext(AuthContext);
  
  const navigate = useNavigate();
  
  const handleLogIn =() =>{
    navigate('/login');
  }
  
  const handleLogOut =(e)=>{
    e.preventDefault();
    logout();
  }
  

  const {socket, setMyMeets, newMeetType, setNewMeetType} = useContext(SocketContext);

const userId = localStorage.getItem("userId") || '';

  const handleCreateRoom = () =>{
    if (!roomName.trim()) {
      setCreateMeetError('Please enter a meet name.');
      return;
    }
    if (!newMeetType) {
      setCreateMeetError('Please choose a meet type.');
      return;
    }
    if (newMeetType === 'scheduled' && (!newMeetDate || !newMeetTime)) {
      setCreateMeetError('Please choose a date and time for a scheduled meet.');
      return;
    }

    setCreateMeetError('');
    console.log('Emitting create-room', {userId, roomName, newMeetType, newMeetDate, newMeetTime});
    socket.emit("create-room", {userId, roomName, newMeetType, newMeetDate: newMeetDate || 'none', newMeetTime: newMeetTime || 'none'});
    setRoomName('');
    setNewMeetType('');
    setNewMeetDate('');
    setNewMeetTime('');

    // Programmatically close the Bootstrap modal on success
    const modalEl = document.getElementById('staticBackdrop');
    if (modalEl) {
      const bsModal = window.bootstrap && window.bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();
    }
  }

  const handleJoinRoom = async () =>{
    await socket.emit('user-code-join', {roomId: joinRoomId});
    setRoomName('');
  }

  useEffect(() =>{
    socket.on("room-exists", ({roomId})=>{
      navigate(`/meet/${roomId}`); 

    })
    socket.on("room-not-exist", ()=>{
      setJoinRoomId('');
      setJoinRoomError("Room dosen't exist! please try again..");
    })

    socket.on("error", (error) => {
      alert("Error: " + error.message);
    });

    socket.emit("fetch-my-meets", {userId});
    socket.on("meets-fetched", async ({myMeets})=>{
      console.log("myMeetsss", myMeets)
      setMyMeets(myMeets);
    })  
  },[socket])

const userName = localStorage.getItem("userName") || '';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className='homePage'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
        <div className="homePage-hero">
          <div className="home-header">
              <div className="home-logo">
                <h2 >Smart Meet</h2>
              </div>

          {!userName || userName === 'null' ? 
          
            <div className="header-before-login">
              <button onClick={handleLogIn}>login</button>
            </div>

          :
            <div className="header-after-login">
              <Dropdown>
                <Dropdown.Toggle  id="dropdown-basic">
                  {userName}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item ><Link className='dropdown-options' to='/profile'>Profile</Link></Dropdown.Item>
                  <Dropdown.Item className='dropdown-options' onClick={handleLogOut} >Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

        }
          </div>

          <div className="home-container container">
            {!userName || userName === 'null' ? (
              <motion.div 
                className="home-app-intro"
                variants={itemVariants}
              >
              {/* <span className="welcome">Welcome!!</span> */}
              <h2>Unbounded <b> Connections: </b> Elevate Your Meetings with Free, Future-Forward <b> Video Conferencing!! </b></h2>
              <p>Revolutionize your meetings with our cutting-edge, future-forward video conferencing platform. Experience seamless collaboration, crystal-clear audio, and HD video, all at <b> zero-cost..!!</b>  Elevate your virtual communication and connect without boundaries today!</p>
              <motion.button 
                onClick={handleLogIn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Join Now..
              </motion.button>
            </motion.div>
            ) : (
              <>
                <div className="home-app-intro">
                <span className="welcome">Welcome!! {userName},</span>
                <h2>Unbounded Connections: Elevate Your Meetings with Free, Future-Forward Video Conferencing!!</h2>
            </div>
            <div className="home-meet-container">
              <div className="create-meet">
                <input type="text" placeholder='Name your meet...' onChange={(e)=> setRoomName(e.target.value)}  />
                <motion.button  
                  data-bs-toggle="modal" 
                  data-bs-target="#staticBackdrop"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RiVideoAddFill/> New meet
                </motion.button>
              </div>
              <p>or</p>
              <div className="join-meet">
                <input type="text" placeholder='Enter code...' value={joinRoomId} onChange={(e)=> { setJoinRoomId(e.target.value); setJoinRoomError(''); }} />
                <motion.button 
                  onClick={handleJoinRoom}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CgEnter /> Join Meet
                </motion.button>
              </div>
              {joinRoomError && <div style={{ color: 'red', marginTop: '8px' }}>{joinRoomError}</div>}
            </div>

            </>
            )}

          </div>
        </div>

        <motion.div 
          className="about-app-container"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="box">
            <div className="box-inner">
              <div className="box-front">
                <h2>Connect Anytime, Anywhere!</h2>
                <p>Our video conference app brings people closer with easy connectivity and affordability. Experience seamless virtual meetings, collaborate effortlessly, and stay connected across the globe. Say goodbye to distance and hello to convenience!</p>
              </div> 
              <div className="box-back">
                <h2>Your Passport to Seamless Communication!</h2>
                <p>Unlock the world of effortless connectivity with our video conference app. Stay connected with colleagues, friends, and family, no matter where they are. Say goodbye to expensive travel and hello to affordable, hassle-free meetings.</p>
              </div>
            </div>
          </div>

          <div className="about-cards">
            <div className='about-card-body' >
                <div className='about-card-title'><span> <Groups2Icon  /> </span></div>
                <p className='about-card-text'>
                Easy Group Conference!! Bringing chaos to order, one virtual group hug at a time!
                </p>
            </div>
            <div className='about-card-body' >
                <div className='about-card-title'><span> <CalendarMonthIcon /> </span></div>
                <p className='about-card-text'>
                Schedule Meets Any Time!! Time is no longer the boss, you are!!
                </p>
            </div>
            <div className='about-card-body' >
                <div className='about-card-title'> <span> <CurrencyRupeeIcon/> </span></div>
                <p className='about-card-text'>
                Free of Cost!! Saving you moolah and keeping your pockets jolly. High fives for freebies!
                </p>
            </div>
            <div className='about-card-body' >
                <div className='about-card-title'><span> <StopCircleIcon/> </span></div>
                <p className='about-card-text'>
                Preserving valuable discussions and insights, enabling you to revisit and learn from every meeting.
                </p>
            </div>
            <div className='about-card-body' >
                <div className='about-card-title'><span> <QuestionAnswerIcon /> </span></div>
                <p className='about-card-text'>
                In-Meet Chat Feature!! Facilitating seamless communication within meetings, fostering real-time collaboration and engagement!!
                </p>
            </div>
            <div className='about-card-body' >
                <div className='about-card-title'><span> <BoltIcon /> </span></div>
                <p className='about-card-text'>
                Zooming through virtual space like a rocket-powered cheetah. Efficiently connecting dots, one meet at a time!
                </p>
            </div>
          </div>

        </motion.div>


        <motion.div 
          className="footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <h2>Contact us @: </h2>
          <div className="footer-social-media">
              <GoogleIcon />
              <FacebookIcon />
              <InstagramIcon />
              <TwitterIcon />
          </div>
        </motion.div>
        
        {/* Modal via Portal */}
        {createPortal(
          <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered" style={{width: "30vw"}}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="staticBackdropLabel">Create New Meet</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  
                  <div className="form-floating mb-3 ">
                    <input type="text" className="form-control" id="floatingInput" placeholder="Name your meet" value={roomName} onChange={(e)=> setRoomName(e.target.value)} />
                    <label htmlFor="floatingInput">Meet name</label>
                  </div>

                  <select className="form-select" value={newMeetType} aria-label="Default select example" onChange={(e) => setNewMeetType(e.target.value)}>
                    <option value="" disabled>Choose meet type</option>
                    <option value="instant">Instant meet</option>
                    <option value="scheduled">Schedule for later</option>
                  </select>

                  {newMeetType === 'scheduled' ?
                  <>
                  <p style={{margin: "10px 0 0 0", color: 'rgb(2, 34, 58)'}}>Meet Date: </p>
                  <input type="date" className="form-control" value={newMeetDate} onChange={(e) => setNewMeetDate(e.target.value)} />
                  <p style={{margin: "10px 0 0 0", color: 'rgb(2, 34, 58)'}}>Meet Time: </p>
                  <input type="time" className="form-control" value={newMeetTime} onChange={(e) => setNewMeetTime(e.target.value)} />
                  </>
                  :
                  ''
                  }

                  {createMeetError && (
                    <div style={{ color: 'red', marginTop: '12px', fontSize: '0.95rem' }}>
                      {createMeetError}
                    </div>
                  )}

                </div>
                <div className="modal-footer">
                  <motion.button 
                    type="button" 
                    className="btn btn-secondary" 
                    data-bs-dismiss="modal"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleCreateRoom} 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create meet
                  </motion.button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

    </motion.div>
  )
}

export default Home