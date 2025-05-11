import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { parseApiError } from '../../utils/errorHandler';
import { 
  BsArrowRight, 
  BsArrowLeft, 
  BsCheckCircle,
  BsMortarboardFill,
  BsPersonVcardFill,
  BsBookFill,
  BsBook,
  BsBuilding,
  BsAward,
  BsLightbulb,
  BsBriefcase
} from 'react-icons/bs';

// Define interface for registration data passed from Register page
interface RegistrationData {
  name: string;
  surname: string;
  email: string;
  password: string;
}

interface LocationState {
  registrationData: RegistrationData;
}

const SelectRole: React.FC = () => {
  // Get registration data from location state
  const location = useLocation();
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();
  const { showAlert } = useAlert();
  
  // Extract registration data from state or use empty defaults
  const { registrationData = { name: '', surname: '', email: '', password: '' } } = 
    (location.state as LocationState) || {};

  // State management
  const [activeSection, setActiveSection] = useState<string>('roleSection');
  const [progressValue, setProgressValue] = useState<number>(33);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleId, setRoleId] = useState<number>(3); // Default to student (3)
  const [educationLevel, setEducationLevel] = useState<string>('');
  const [learningGoals, setLearningGoals] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if no registration data is available
  useEffect(() => {
    if (!registrationData?.email) {
      showAlert('error', 'Please complete the registration form first');
      navigate('/register');
    }
  }, [registrationData, navigate, showAlert]);

  // Define CSS variables
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

  // Styling objects to mimic CSS
  const styles = {
    pageWrapper: {
      backgroundColor: cssVars.primaryLighter,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
    },
    card: {
      borderRadius: '15px',
      border: 'none',
      overflow: 'hidden',
      backgroundColor: 'white',
      boxShadow: '0 5px 25px rgba(0,0,0,0.1)',
    },
    title: {
      color: cssVars.primaryColor,
      fontWeight: 600,
    },
    subtitle: {
      color: cssVars.primaryLight,
      fontWeight: 500,
    },
    progress: {
      height: '8px',
      marginBottom: '30px',
    },
    progressBar: {
      backgroundColor: cssVars.primaryColor,
      height: '100%',
      transition: 'width 0.3s ease',
    },
    roleOption: {
      transition: 'all 0.3s ease',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '15px',
      cursor: 'pointer',
      border: '2px solid transparent',
      backgroundColor: 'white',
    },
    roleOptionSelected: {
      borderColor: cssVars.primaryColor,
      backgroundColor: cssVars.primaryLighter,
    },
    roleOptionHover: {
      transform: 'translateY(-5px)',
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    },
    roleIcon: {
      fontSize: '2rem',
      marginBottom: '10px',
    },
    buttonPrimary: {
      backgroundColor: cssVars.primaryColor,
      color: 'white',
      borderRadius: '25px',
      padding: '8px 25px',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.3s',
    },
    buttonPrimaryHover: {
      backgroundColor: cssVars.primaryLight,
    },
    buttonSecondary: {
      backgroundColor: cssVars.accentColor,
      color: 'white',
      borderRadius: '25px',
      padding: '8px 25px',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.3s',
      marginRight: '10px',
    },
    buttonSecondaryHover: {
      backgroundColor: '#ffa726',
    },
    formSection: {
      display: 'none',
      animation: 'fadeIn 0.5s ease',
    },
    formSectionActive: {
      display: 'block',
    },
    roleColors: {
      student: cssVars.pastelBlue,
      professor: cssVars.pastelPurple,
      other: cssVars.pastelGreen,
    },
  };

  // Education options based on role
  const getEducationOptions = (role: string): JSX.Element[] | null => {
    if (role === 'student') {
      return [
        <div className="col-md-6 mb-3" key="middle_school">
          <div 
            className="role-option text-center" 
            style={{
              ...styles.roleOption,
              ...(educationLevel === 'middle_school' ? styles.roleOptionSelected : {})
            }}
            onClick={() => handleEducationLevel('middle_school')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <BsBook style={styles.roleIcon} />
            <h5>Middle School</h5>
          </div>
        </div>,
        <div className="col-md-6 mb-3" key="high_school">
          <div 
            className="role-option text-center" 
            style={{
              ...styles.roleOption,
              ...(educationLevel === 'high_school' ? styles.roleOptionSelected : {})
            }}
            onClick={() => handleEducationLevel('high_school')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <BsMortarboardFill style={styles.roleIcon} />
            <h5>High School</h5>
          </div>
        </div>,
        <div className="col-md-6 mb-3" key="undergraduate">
          <div 
            className="role-option text-center" 
            style={{
              ...styles.roleOption,
              ...(educationLevel === 'undergraduate' ? styles.roleOptionSelected : {})
            }}
            onClick={() => handleEducationLevel('undergraduate')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <BsBuilding style={styles.roleIcon} />
            <h5>University (Undergrad)</h5>
          </div>
        </div>,
        <div className="col-md-6 mb-3" key="graduate">
          <div 
            className="role-option text-center" 
            style={{
              ...styles.roleOption,
              ...(educationLevel === 'graduate' ? styles.roleOptionSelected : {})
            }}
            onClick={() => handleEducationLevel('graduate')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <BsAward style={styles.roleIcon} />
            <h5>University (Grad School)</h5>
          </div>
        </div>
      ];
    } else if (role === 'professor') {
      return [
        <div className="col-md-4 mb-3" key="high_school">
          <div 
            className="role-option text-center" 
            style={{
              ...styles.roleOption,
              ...(educationLevel === 'high_school' ? styles.roleOptionSelected : {})
            }}
            onClick={() => handleEducationLevel('high_school')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <BsMortarboardFill style={styles.roleIcon} />
            <h5>High School</h5>
          </div>
        </div>,
        <div className="col-md-4 mb-3" key="college">
          <div 
            className="role-option text-center" 
            style={{
              ...styles.roleOption,
              ...(educationLevel === 'college' ? styles.roleOptionSelected : {})
            }}
            onClick={() => handleEducationLevel('college')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <BsBuilding style={styles.roleIcon} />
            <h5>College</h5>
          </div>
        </div>,
        <div className="col-md-4 mb-3" key="university">
          <div 
            className="role-option text-center" 
            style={{
              ...styles.roleOption,
              ...(educationLevel === 'university' ? styles.roleOptionSelected : {})
            }}
            onClick={() => handleEducationLevel('university')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <BsAward style={styles.roleIcon} />
            <h5>University</h5>
          </div>
        </div>
      ];
    } else if (role === 'other') {
      return [
        <div className="col-md-6 mb-3" key="self_taught">
          <div 
            className="role-option text-center" 
            style={{
              ...styles.roleOption,
              ...(educationLevel === 'self_taught' ? styles.roleOptionSelected : {})
            }}
            onClick={() => handleEducationLevel('self_taught')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <BsLightbulb style={styles.roleIcon} />
            <h5>Self-Taught</h5>
          </div>
        </div>,
        <div className="col-md-6 mb-3" key="professional">
          <div 
            className="role-option text-center" 
            style={{
              ...styles.roleOption,
              ...(educationLevel === 'professional' ? styles.roleOptionSelected : {})
            }}
            onClick={() => handleEducationLevel('professional')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <BsBriefcase style={styles.roleIcon} />
            <h5>Professional Development</h5>
          </div>
        </div>
      ];
    }
    return null;
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setEducationLevel(''); // Reset education level when role changes
    
    // Map role string to numeric roleId
    switch (role) {
      case 'student':
        setRoleId(3);
        break;
      case 'professor':
        setRoleId(2);
        break;
      case 'other':
        setRoleId(4); // Assuming 'other' is role ID 4
        break;
    }
  };

  const handleEducationLevel = (level: string) => {
    setEducationLevel(level);
  };

  const nextSection = (current: string, next: string) => {
    // Validate current section before proceeding
    if (current === 'roleSection' && !selectedRole) {
      showAlert('error', 'Please select your role');
      return;
    }
    
    if (current === 'educationSection' && !educationLevel) {
      showAlert('error', 'Please select your education level');
      return;
    }
    
    // Update progress bar
    if (next === 'educationSection') {
      setProgressValue(66);
    } else if (next === 'interestsSection') {
      setProgressValue(100);
    }
    
    // Switch sections
    setActiveSection(next);
  };

  const prevSection = (current: string, prev: string) => {
    // Update progress bar
    if (prev === 'roleSection') {
      setProgressValue(33);
    } else if (prev === 'educationSection') {
      setProgressValue(66);
    }
    
    // Switch sections
    setActiveSection(prev);
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required selections
    if (!selectedRole) {
      showAlert('error', 'Please select your role');
      return;
    }
    
    if (!educationLevel && activeSection === 'educationSection') {
      showAlert('error', 'Please select your education level');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create username from email
      const username = registrationData.email.split('@')[0];
      
      // Prepare extra data with education level and learning goals if provided
      const extraData: Record<string, any> = {
        name: registrationData.name,
        surname: registrationData.surname,
      };
      
      if (educationLevel) {
        extraData.education_level = educationLevel;
      }
      
      if (learningGoals) {
        extraData.learning_goals = learningGoals;
      }
      
      // Register the user with the selected role
      await signUp(
        registrationData.email,
        registrationData.password,
        username,
        `${registrationData.name} ${registrationData.surname}`,
        roleId,
        extraData
      );
      
      showAlert('success', 'Account created successfully!');
      navigate('/dashboard');
      
    } catch (err) {
      const { message } = parseApiError(err);
      showAlert('error', message);
      console.error('Registration error:', err);
      setIsSubmitting(false);
    }
  };

  // Adding Bootstrap and Bootstrap Icons via head
  useEffect(() => {
    // Add Bootstrap CSS
    const bootstrapCSS = document.createElement('link');
    bootstrapCSS.rel = 'stylesheet';
    bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css';
    bootstrapCSS.integrity = 'sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC';
    bootstrapCSS.crossOrigin = 'anonymous';
    document.head.appendChild(bootstrapCSS);

    // Add Bootstrap Icons
    const bootstrapIcons = document.createElement('link');
    bootstrapIcons.rel = 'stylesheet';
    bootstrapIcons.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css';
    bootstrapIcons.integrity = 'sha384-tViUnnbYAV00FLIhhi3v/dWt3Jxw4gZQcNoSCxCIFNJVCx7/D55/wXsrNIRANwdD';
    bootstrapIcons.crossOrigin = 'anonymous';
    document.head.appendChild(bootstrapIcons);

    // Clean up on component unmount
    return () => {
      document.head.removeChild(bootstrapCSS);
      document.head.removeChild(bootstrapIcons);
    };
  }, []);

  return (
    <section className="w-100 py-5" style={styles.pageWrapper}>
      <div className="container">
        <div className="row justify-content-center align-items-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="signin text-center pt-0 mb-4">
              <div className="form-title">
                <h2 style={styles.title}>Complete Your Profile</h2>
                <h3 style={styles.subtitle}>Pulse Camp</h3>
                <p className="mt-2 text-muted">
                  Welcome, {registrationData.name} {registrationData.surname}!
                </p>
              </div>
            </div>
            
            <div className="progress mb-4" style={styles.progress}>
              <div 
                className="progress-bar" 
                role="progressbar" 
                style={{...styles.progressBar, width: `${progressValue}%`}} 
                aria-valuenow={progressValue} 
                aria-valuemin={0} 
                aria-valuemax={100}
              ></div>
            </div>
            
            <div className="card border-0 shadow" style={styles.card}>
              <div className="card-body p-4">
                <form id="profileForm" onSubmit={handleFormSubmit}>
                  {/* Role Selection Section */}
                  <div 
                    className={`form-section ${activeSection === 'roleSection' ? 'active' : ''}`} 
                    style={{
                      ...styles.formSection, 
                      ...(activeSection === 'roleSection' ? styles.formSectionActive : {})
                    }}
                  >
                    <h4 className="text-center mb-4">What best describes you?</h4>
                    
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <div 
                          className="role-option text-center student-bg" 
                          style={{
                            ...styles.roleOption,
                            backgroundColor: styles.roleColors.student,
                            ...(selectedRole === 'student' ? styles.roleOptionSelected : {})
                          }}
                          onClick={() => handleRoleSelect('student')}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <BsMortarboardFill style={styles.roleIcon} />
                          <h5>Student</h5>
                          <p className="small">I'm currently enrolled in an educational institution</p>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div 
                          className="role-option text-center professor-bg" 
                          style={{
                            ...styles.roleOption,
                            backgroundColor: styles.roleColors.professor,
                            ...(selectedRole === 'professor' ? styles.roleOptionSelected : {})
                          }}
                          onClick={() => handleRoleSelect('professor')}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <BsPersonVcardFill style={styles.roleIcon} />
                          <h5>Professor</h5>
                          <p className="small">I teach at an educational institution</p>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div 
                          className="role-option text-center other-bg" 
                          style={{
                            ...styles.roleOption,
                            backgroundColor: styles.roleColors.other,
                            ...(selectedRole === 'other' ? styles.roleOptionSelected : {})
                          }}
                          onClick={() => handleRoleSelect('other')}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <BsBookFill style={styles.roleIcon} />
                          <h5>Other</h5>
                          <p className="small">I'm here to learn independently</p>
                        </div>
                      </div>
                    </div>
                    
                    <input type="hidden" id="userRole" name="role" value={selectedRole} />
                    
                    <div className="text-center mt-4">
                      <button 
                        type="button" 
                        className="btn btn-custom-primary"
                        style={styles.buttonPrimary}
                        onMouseOver={(e) => Object.assign(e.currentTarget.style, styles.buttonPrimaryHover)}
                        onMouseOut={(e) => Object.assign(e.currentTarget.style, { backgroundColor: cssVars.primaryColor })}
                        onClick={() => nextSection('roleSection', 'educationSection')}
                      >
                        Continue <BsArrowRight style={{ marginLeft: "5px" }} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Education Level Section */}
                  <div 
                    className={`form-section ${activeSection === 'educationSection' ? 'active' : ''}`} 
                    style={{
                      ...styles.formSection, 
                      ...(activeSection === 'educationSection' ? styles.formSectionActive : {})
                    }}
                  >
                    <h4 className="text-center mb-4">What's your education level?</h4>
                    
                    <div className="row" id="educationOptions">
                      {getEducationOptions(selectedRole)}
                    </div>
                    
                    <input type="hidden" id="educationLevel" name="education_level" value={educationLevel} />
                    
                    <div className="text-center mt-4">
                      <button 
                        type="button" 
                        className="btn btn-custom-secondary me-2" 
                        style={styles.buttonSecondary}
                        onMouseOver={(e) => Object.assign(e.currentTarget.style, styles.buttonSecondaryHover)}
                        onMouseOut={(e) => Object.assign(e.currentTarget.style, { backgroundColor: cssVars.accentColor })}
                        onClick={() => prevSection('educationSection', 'roleSection')}
                      >
                        <BsArrowLeft style={{ marginRight: "5px" }} /> Back
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-custom-primary" 
                        style={styles.buttonPrimary}
                        onMouseOver={(e) => Object.assign(e.currentTarget.style, styles.buttonPrimaryHover)}
                        onMouseOut={(e) => Object.assign(e.currentTarget.style, { backgroundColor: cssVars.primaryColor })}
                        onClick={() => nextSection('educationSection', 'interestsSection')}
                      >
                        Continue <BsArrowRight style={{ marginLeft: "5px" }} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Interests Section */}
                  <div 
                    className={`form-section ${activeSection === 'interestsSection' ? 'active' : ''}`} 
                    style={{
                      ...styles.formSection, 
                      ...(activeSection === 'interestsSection' ? styles.formSectionActive : {})
                    }}
                  >
                    <h4 className="text-center mb-4">What are you interested in?</h4>
                    
                    <div className="mb-3">
                      <label className="form-label">Learning Goals</label>
                      <textarea 
                        className="form-control" 
                        id="learningGoals" 
                        name="learning_goals" 
                        rows={3} 
                        placeholder="What do you hope to achieve?"
                        value={learningGoals}
                        onChange={(e) => setLearningGoals(e.target.value)}
                      ></textarea>
                    </div>
                    
                    <div className="text-center mt-4">
                      <button 
                        type="button" 
                        className="btn btn-custom-secondary me-2" 
                        style={styles.buttonSecondary}
                        onMouseOver={(e) => Object.assign(e.currentTarget.style, styles.buttonSecondaryHover)}
                        onMouseOut={(e) => Object.assign(e.currentTarget.style, { backgroundColor: cssVars.accentColor })}
                        onClick={() => prevSection('interestsSection', 'educationSection')}
                      >
                        <BsArrowLeft style={{ marginRight: "5px" }} /> Back
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-custom-primary" 
                        style={styles.buttonPrimary}
                        disabled={isSubmitting}
                        onMouseOver={(e) => Object.assign(e.currentTarget.style, styles.buttonPrimaryHover)}
                        onMouseOut={(e) => Object.assign(e.currentTarget.style, { backgroundColor: cssVars.primaryColor })}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Complete Profile <BsCheckCircle style={{ marginLeft: "5px" }} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SelectRole;
