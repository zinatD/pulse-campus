import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsEmojiSmileFill, BsLightbulbFill, BsArrowRight } from 'react-icons/bs';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [tipOpacity, setTipOpacity] = useState(1);
  
  // Study tips array
  const studyTips = [
    "Take regular breaks using the Pomodoro technique (25 min work, 5 min break).",
    "Active recall (testing yourself) is more effective than passive review.",
    "Teach what you've learned to someone else to reinforce your understanding.",
    "Mix different subjects/topics in a single study session for better retention.",
    "Connect new information to what you already know to create stronger memories."
  ];
  
  // Confetti colors from the original HTML
  const confettiColors = [
    '#2e7d32', // primary green
    '#81c784', // primary light
    '#ffb74d', // accent orange
    '#c0e6ff', // pastel blue
    '#e6d3ff'  // pastel purple
  ];
  
  // Create confetti elements
  useEffect(() => {
    // This is just for visual effect - if we want to keep it in React
    // we would typically use a library like react-confetti
    // but for now we'll mimic the original behavior
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      
      // Apply styles similar to CSS
      confetti.style.position = 'fixed';
      confetti.style.width = `${Math.random() * 10 + 5}px`;
      confetti.style.height = confetti.style.width;
      confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.opacity = '0';
      confetti.style.zIndex = '1';
      
      // Animation properties
      confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear ${Math.random() * 5}s infinite`;
      
      document.body.appendChild(confetti);
    }
    
    // Add the animation keyframes to the document
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(-100vh) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-20px);
        }
        60% {
          transform: translateY(-10px);
        }
      }
    `;
    document.head.appendChild(styleSheet);
    
    // Clean up function to remove confetti when component unmounts
    return () => {
      document.body.querySelectorAll('div[style*="confetti-fall"]').forEach(el => el.remove());
      document.head.removeChild(styleSheet);
    };
  }, []);
  
  // Rotate study tips
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setTipOpacity(0);
      
      // Change tip after fade out
      setTimeout(() => {
        setCurrentTipIndex((prevIndex) => (prevIndex + 1) % studyTips.length);
        setTipOpacity(1);
      }, 500);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [studyTips.length]);
  
  // Handle button click
  const handleExploreClick = () => {
    // Similar to the original alert before redirect
    alert('Redirecting to courses page...');
    // In a real app, navigate to the courses page
    navigate('/dashboard');
  };
  
  // CSS variables from the original HTML
  const cssVars = {
    primaryColor: '#2e7d32',
    primaryLight: '#81c784',
    primaryLighter: '#e8f5e9',
    accentColor: '#ffb74d',
    pastelPink: '#ffd6e0',
    pastelBlue: '#c0e6ff',
    pastelPurple: '#e6d3ff',
    pastelGreen: '#d0f0c0',
    pastelYellow: '#fff4c0',
  };
  
  // Styles object to mimic the original CSS
  const styles = {
    body: {
      backgroundColor: cssVars.primaryLighter,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflowX: 'hidden',
      minHeight: '100vh',
    },
    welcomeContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeCard: {
      borderRadius: '15px',
      border: 'none',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      position: 'relative',
      zIndex: 10,
      backgroundColor: 'white',
    },
    welcomeHeader: {
      backgroundColor: cssVars.primaryColor,
      color: 'white',
      padding: '2rem',
      textAlign: 'center',
    },
    welcomeBody: {
      padding: '2rem',
      textAlign: 'center',
    },
    welcomeIcon: {
      fontSize: '4rem',
      color: cssVars.primaryColor,
      marginBottom: '1rem',
      animation: 'bounce 2s infinite',
    },
    btnCustomPrimary: {
      backgroundColor: cssVars.primaryColor,
      color: 'white',
      borderRadius: '25px',
      padding: '10px 30px',
      marginTop: '20px',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      transition: 'background-color 0.3s',
    },
    btnHover: {
      backgroundColor: cssVars.primaryLight,
    },
    studyTips: {
      backgroundColor: cssVars.primaryLighter,
      borderRadius: '10px',
      padding: '15px',
      marginTop: '20px',
    },
    tip: {
      transition: 'opacity 0.5s ease',
      opacity: tipOpacity,
    },
    lightbulbIcon: {
      color: cssVars.accentColor,
      marginRight: '5px',
    },
    arrowIcon: {
      marginLeft: '5px',
    },
  };

  return (
    <div style={styles.body}>
      <div style={styles.welcomeContainer}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
              <div style={styles.welcomeCard}>
                <div style={styles.welcomeHeader}>
                  <h1>Welcome to Pulse Camp!</h1>
                </div>
                <div style={styles.welcomeBody}>
                  <BsEmojiSmileFill style={styles.welcomeIcon} />
                  <h3>We're thrilled to have you join our learning community!</h3>
                  <p>Your educational journey starts now. Whether you're here to learn, teach, or explore, we hope you'll find everything you need to succeed.</p>
                  
                  <div style={styles.studyTips}>
                    <h5>
                      <BsLightbulbFill style={styles.lightbulbIcon} /> Study Tip:
                    </h5>
                    <p style={styles.tip}>{studyTips[currentTipIndex]}</p>
                  </div>
                  
                  <button
                    style={styles.btnCustomPrimary}
                    onMouseOver={(e) => Object.assign(e.currentTarget.style, styles.btnHover)}
                    onMouseOut={(e) => Object.assign(e.currentTarget.style, { backgroundColor: cssVars.primaryColor })}
                    onClick={handleExploreClick}
                  >
                    Get Started <BsArrowRight style={styles.arrowIcon} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
