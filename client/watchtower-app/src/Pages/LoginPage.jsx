import React, { useState } from 'react';
import './LoginPage.css';
import logo from '../assets/Images/watchtowerlogo.png';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    fetch(`http://localhost:3001/users?username=${formData.username}`)
      .then(res => res.json())
      .then(users => {
        const user = users[0];
        if (user && user.password === formData.password) {
          localStorage.setItem('token', 'mocked-jwt-token');
          localStorage.setItem('username', user.username);
          alert("Login successful!");
          navigate('/userprofile');
        } else {
          throw new Error("Invalid credentials");
        }
      })
      .catch(err => {
        alert(err.message);
      });
  }

  return (
    <div className="login-form">
      <div className="signup-container">
        <div className="login-header">
          <h1> WatchTower</h1>
        </div>
        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="signup-input"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="signup-input"
          />
          <button
            type="submit"
            className="signup-button"
          >
            Log In
          </button>
          <div className="login-footer">
            <p>Don't have an account? <a href="/signup" id='login'>Sign Up</a></p>
          </div>
          <div className="login-inspiration">
            <div>
              <p>" Saving London one Phone at a Time "</p>
            </div>
            <div>
              <img src={logo} alt="WatchTower Logo" id='watchtower-logo' />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;