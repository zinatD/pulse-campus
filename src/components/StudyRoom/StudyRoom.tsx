import { useState, useEffect } from 'react';
import { BsMusicNoteBeamed, BsMoonFill, BsSunFill, BsHouseDoor, BsClock } from 'react-icons/bs';
import { Menu } from '@headlessui/react';

interface TimerState {
  studyTime: number;
  breakTime: number;
  timeLeft: number;
  isRunning: boolean;
  isStudyTime: boolean;
  isPaused: boolean;
  countdown: number;
}

const StudyRoom = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [timerState, setTimerState] = useState<TimerState>({
    studyTime: 25 * 60,
    breakTime: 5 * 60,
    timeLeft: 25 * 60,
    isRunning: false,
    isStudyTime: true,
    isPaused: false,
    countdown: 0
  });
  const [ambientSound, setAmbientSound] = useState<string>('');
  const [message, setMessage] = useState<string>('Ready to focus? Click start when you\'re ready!');

  // Motivational messages
  const studyMessages = [
    "Let's get to work! You've got this!",
    "Time to focus and do your best!",
    "Concentrate now, relax later!",
    "Deep breaths, then dive in!",
    "The secret of getting ahead is getting started!"
  ];
  
  const breakMessages = [
    "You deserve a break! Relax for a bit.",
    "Time to stretch and refresh!",
    "Grab a snack and recharge!",
    "Take a deep breath, you're doing great!",
    "A short break helps you stay sharp!"
  ];
  
  const startingMessages = [
    "Get ready, timer starting soon!",
    "Prepare yourself, focus time begins in...",
    "Deep breath, starting in...",
    "Let's begin in..."
  ];

  const soundOptions = [
    { value: '', label: 'No sound' },
    { value: 'https://www.soundjay.com/nature/sounds/rain-01.mp3', label: 'Rain' },
    { value: 'https://www.soundjay.com/nature/sounds/forest-01.mp3', label: 'Forest' },
    { value: 'https://www.soundjay.com/nature/sounds/ocean-waves-1.mp3', label: 'Ocean Waves' },
    { value: 'https://www.soundjay.com/mechanical/sounds/wind-01.mp3', label: 'Wind' },
    { value: 'https://www.soundjay.com/misc/sounds/white-noise-01.mp3', label: 'White Noise' }
  ];

  const timerPresets = [
    { study: 25, break: 5, label: '25/5 (Standard Pomodoro)' },
    { study: 40, break: 10, label: '40/10' },
    { study: 50, break: 15, label: '50/15' },
    { study: 90, break: 20, label: '90/20' },
    { study: 5, break: 1, label: '5/1 (Quick Sprint)' }
  ];

  useEffect(() => {
    let interval: number;
    if (timerState.isRunning && !timerState.isPaused) {
      interval = window.setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.isPaused]);

  useEffect(() => {
    if (timerState.timeLeft <= 0) {
      handleTimerComplete();
    }
  }, [timerState.timeLeft]);

  useEffect(() => {
    const audio = document.getElementById('ambientSound') as HTMLAudioElement;
    if (audio) {
      if (ambientSound && timerState.isRunning && timerState.isStudyTime) {
        audio.src = ambientSound;
        audio.loop = true;
        audio.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }, [ambientSound, timerState.isRunning, timerState.isStudyTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    // Show starting message with countdown
    const randomMessage = startingMessages[Math.floor(Math.random() * startingMessages.length)];
    setMessage(randomMessage);
    
    setTimerState(prev => ({ ...prev, countdown: 5 }));
    
    // 5-second countdown before starting
    let count = 5;
    const countdownInterval = setInterval(() => {
      if (count > 0) {
        count--;
        setTimerState(prev => ({ ...prev, countdown: count }));
      } else {
        clearInterval(countdownInterval);
        
        // Start the actual timer
        if (timerState.isStudyTime) {
          setMessage(studyMessages[Math.floor(Math.random() * studyMessages.length)]);
        } else {
          setMessage(breakMessages[Math.floor(Math.random() * breakMessages.length)]);
        }
        
        setTimerState(prev => ({ 
          ...prev, 
          isRunning: true, 
          isPaused: false,
          countdown: 0
        }));
      }
    }, 1000);
  };

  const handlePause = () => {
    setTimerState(prev => ({ ...prev, isPaused: true }));
    setMessage("Timer paused. Click restart to continue.");
  };

  const handleRestart = () => {
    setTimerState(prev => ({ ...prev, isPaused: false }));
  };

  const handleReset = () => {
    setTimerState(prev => ({
      ...prev,
      timeLeft: prev.isStudyTime ? prev.studyTime : prev.breakTime,
      isRunning: false,
      isPaused: false
    }));
  };

  const handleTimerComplete = () => {
    const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
    audio.play();

    const newIsStudyTime = !timerState.isStudyTime;
    
    setTimerState(prev => ({
      ...prev,
      isStudyTime: newIsStudyTime,
      timeLeft: newIsStudyTime ? prev.studyTime : prev.breakTime,
      isRunning: false
    }));
    
    if (newIsStudyTime) {
      setMessage("Break's over! Ready for another session?");
    } else {
      setMessage(breakMessages[Math.floor(Math.random() * breakMessages.length)]);
    }
  };

  const handleSoundChange = (value: string) => {
    setAmbientSound(value);
  };

  const handleTimerPreset = (study: number, breakTime: number) => {
    const newStudyTime = study * 60;
    const newBreakTime = breakTime * 60;
    
    setTimerState(prev => ({
      ...prev,
      studyTime: newStudyTime,
      breakTime: newBreakTime,
      timeLeft: prev.isStudyTime ? newStudyTime : newBreakTime,
      isRunning: false,
      isPaused: false
    }));
    
    const mode = timerState.isStudyTime ? "study" : "break";
    setMessage(`Timer set to ${study}/${breakTime} (${mode} time)`);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen pt-[70px] pb-[70px] font-['Poppins'] transition-all duration-300 ease-in-out ${theme === 'light' ? 'bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2] text-gray-800' : 'bg-gradient-to-br from-[#2c3e50] to-[#1a1a2e] text-white'}`}>
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full shadow-md z-10 ${theme === 'light' ? 'bg-white/70 backdrop-blur-[50px]' : 'bg-black/30 backdrop-blur-[50px]'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <a href="#" className="text-lg font-semibold flex items-center">
              <i className="bi bi-people me-2"></i>Focus Timer
            </a>
            
            <div className="flex items-center space-x-4">
              <a href="#" className={`${theme === 'light' ? 'text-gray-600' : 'text-white'}`}>Home</a>
              
              <Menu as="div" className="relative">
                <Menu.Button className={`flex items-center ${theme === 'light' ? 'text-gray-600' : 'text-white'}`}>
                  <BsMusicNoteBeamed className="mr-1" /> Ambient Sounds
                </Menu.Button>
                <Menu.Items className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg p-2 ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
                  {soundOptions.map(option => (
                    <Menu.Item key={option.value}>
                      {({ active }) => (
                        <button
                          className={`w-full text-left px-4 py-2 rounded-lg ${
                            ambientSound === option.value ? 'bg-blue-50 dark:bg-blue-900' : ''
                          } ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                          onClick={() => handleSoundChange(option.value)}
                        >
                          {option.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Menu>
              
              <Menu as="div" className="relative">
                <Menu.Button className={`flex items-center ${theme === 'light' ? 'text-gray-600' : 'text-white'}`}>
                  <BsClock className="mr-1" /> Presets
                </Menu.Button>
                <Menu.Items className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg p-2 ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
                  {timerPresets.map((preset, idx) => (
                    <Menu.Item key={idx}>
                      {({ active }) => (
                        <button
                          className={`w-full text-left px-4 py-2 rounded-lg ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                          onClick={() => handleTimerPreset(preset.study, preset.break)}
                        >
                          {preset.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Menu>
              
              <button
                onClick={toggleTheme}
                className={`flex items-center ${theme === 'light' ? 'text-gray-600' : 'text-white'}`}
              >
                {theme === 'light' ? (
                  <><BsMoonFill className="mr-1" /> Dark Mode</>
                ) : (
                  <><BsSunFill className="mr-1" /> Light Mode</>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-5 w-full">
        <div className="container mx-auto">
          <div className="flex justify-center mx-0">
            <div className="w-full max-w-[500px] px-0">
              <div className={`rounded-[20px] p-8 text-center transition-all duration-300 ease-in-out animate-[float_3s_ease-in-out_infinite] ${
                theme === 'light' 
                  ? 'bg-white/80 shadow-[0_8px_32px_rgba(149,157,165,0.2)]' 
                  : 'bg-black/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
              }`}>
                <div className={`text-2xl font-bold mb-4 uppercase tracking-[2px] ${
                  timerState.isStudyTime ? 'text-[#4a6fa5]' : 'text-[#8a4d76]'
                }`}>
                  {timerState.isStudyTime ? 'Study Time' : 'Break Time'}
                </div>
                
                <div className="text-5xl font-bold my-4">
                  {timerState.countdown > 0 
                    ? timerState.countdown 
                    : formatTime(timerState.timeLeft)
                  }
                </div>
                
                <div className="text-xl min-h-[4rem] mb-6">
                  {message}
                </div>
                
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                  {!timerState.isRunning ? (
                    <button
                      onClick={handleStart}
                      className={`px-6 py-2 rounded-full transition-all text-lg ${
                        theme === 'light'
                          ? 'bg-[#a1c4fd] hover:bg-[#90b3ec] text-gray-800'
                          : 'bg-[#4a6fa5] hover:bg-[#3a5f95] text-white'
                      }`}
                    >
                      Start
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={timerState.isPaused ? handleRestart : handlePause}
                        className={`px-6 py-2 rounded-full transition-all text-lg ${
                          theme === 'light'
                            ? 'bg-[#ffcce6] hover:bg-[#ffbbd9] text-gray-800'
                            : 'bg-[#8a4d76] hover:bg-[#7a3c66] text-white'
                        }`}
                      >
                        {timerState.isPaused ? 'Restart' : 'Pause'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className={`py-3 text-center fixed bottom-0 w-full ${
        theme === 'light' ? 'bg-white/70 backdrop-blur-[50px]' : 'bg-black/30 backdrop-blur-[50px]'
      }`}>
        <div className="container mx-auto">
          <p className="m-0">© 2025 Focus Timer</p>
        </div>
      </footer>
      
      <audio id="ambientSound" loop />
    </div>
  );
};

export default StudyRoom;