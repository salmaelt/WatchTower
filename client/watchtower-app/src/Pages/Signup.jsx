import React, { useState } from 'react';
import './Signup.css';
import logo from '../assets/Images/watchtowerlogo.png';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  function handleChange(e) {
      const { name, value } = e.target;
      
      
      if (name === 'username' && value.includes('@')) {
          alert("Usernames can not contain @")
          return;
      } else {
          setFormData(prev => ({ ...prev, [name]: value }));
      }
  }

  function handleSubmit(e) {
  e.preventDefault();

  const { username, email, password, confirmPassword } = formData;

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  if (username.includes('@')) {
    alert("Usernames cannot contain '@'");
    return;
  }

  // Mock API call
  fetch('http://localhost:3001/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, email, password })
})
    .then(res => {
      if (res.status === 201) return res.json();
      if (res.status === 400) throw new Error("Validation error");
      if (res.status === 409) throw new Error("Username or email already taken");
      throw new Error("Unexpected error");
    })
    .then(data => {
      console.log("Signup success:", data);
      localStorage.setItem('token', data.token);
      alert("Account created successfully!");
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
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
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
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="signup-input"
                    />
                    <button
                        type="submit"
                        className="signup-button"
                    >
                        Sign Up
                    </button>
                    <div className="login-footer">
                        <p>Already have an account? <a href="/login" id='login'>Log in</a></p>
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

export default Signup;