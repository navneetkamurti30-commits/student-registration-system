import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [role, setRole] = useState('STUDENT'); 
  const [username, setUsername] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Send studentId or username inside the same 'username' key for simplicity
    const loginIdentifier = role === 'STUDENT' ? studentId : username;

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: loginIdentifier, 
          password 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data);
        navigate('/');
      } else {
        const fallbackText = response.status === 401 ? 'Invalid credentials.' : 'Authentication failed.';
        try {
          const data = await response.json();
          setError(data.message || fallbackText);
        } catch {
          setError(fallbackText);
        }
      }
    } catch (err) {
      setError('Cannot connect to authentication service. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleNewRegister = async () => {
    setError('');

    if (role !== 'STUDENT') {
      setError('New registration is available for students only.');
      return;
    }

    if (!studentId || !password) {
      setError('Enter Student ID and Password before starting a new registration.');
      return;
    }

    const parsedStudentId = parseInt(studentId, 10);
    if (Number.isNaN(parsedStudentId) || parsedStudentId < 1 || parsedStudentId > 99) {
      setError('Student ID must be a number between 1 and 99.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/students/by-student-id/${parsedStudentId}`);

      if (response.ok) {
        setError('This Student ID is present already.');
        return;
      }

      if (response.status !== 404) {
        setError('Unable to check Student ID right now. Please try again.');
        return;
      }

      login({
        role: 'STUDENT',
        username: String(parsedStudentId),
        registrationPassword: password,
        pendingRegistration: true,
        message: 'New registration started'
      });
      navigate('/');
    } catch (err) {
      setError('Cannot connect to student service. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="registration-form" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="header" style={{ marginBottom: '25px', textAlign: 'center' }}>
          <h1 style={{ color: '#333', fontSize: '2rem' }}>Portal Login</h1>
          <p style={{ color: '#666' }}>Select role and enter your access details</p>
        </div>

        {error && <div className="error-message" style={{ margin: '0 0 20px 0' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginRole">Login As</label>
            <select 
              id="loginRole" 
              value={role} 
              onChange={(e) => { setRole(e.target.value); setError(''); }}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="STUDENT">👨‍🎓 Student</option>
              <option value="ADMIN">⚡ Admin</option>
            </select>
          </div>

          {role === 'STUDENT' ? (
            <div className="form-group">
              <label htmlFor="studentId">Student ID</label>
              <input
                type="number"
                id="studentId"
                min="1"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter numeric Student ID"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {role === 'STUDENT' && (
            <button
              type="button"
              className="submit-btn"
              onClick={handleNewRegister}
              disabled={loading}
              style={{ marginTop: '0', marginBottom: '10px', background: 'linear-gradient(135deg, #22c55e 0%, #0f766e 100%)' }}
            >
              New Register
            </button>
          )}

          <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
