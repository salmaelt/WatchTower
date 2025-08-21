import React, { useEffect, useState } from 'react';
import './UserProfile.css';
import BottomNavBar from '../components/BottomNavBar/BottomNavBar';
import { useNavigate } from 'react-router-dom';

function FourthPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      alert("No user logged in");
      navigate('/login');
      return;
    }
    fetch(`http://localhost:3001/users?username=${storedUsername}`)
      .then(res => res.json())
      .then(users => {
        const user = users[0];
        if (user) {
          setUsername(user.username);
          setEmail(user.email);
          setPassword(user.password);
        } else {
          alert("User not found");
        }
      })
      .catch(err => {
        console.error("Failed to fetch user:", err);
        alert("Could not load user profile");
      });
  }, [navigate]);

  function handleUsernameChange(e) {
    setNewUsername(e.target.value);
  }

  function handlePasswordChange(e) {
    setNewPassword(e.target.value);
  }

  function handleChangeUsername(e) {
    e.preventDefault();
    if (newUsername.includes('@')) {
      alert("Usernames cannot contain '@'");
      return;
    }
    if (newUsername.trim()) {
      setUsername(newUsername);
      setNewUsername('');
      alert('Your username has been changed successfully');
      // Optionally, send PATCH/PUT to backend here
    }
  }

  function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword.trim()) {
      setPassword(newPassword);
      setNewPassword('');
      alert('Your password has been changed successfully');
      // Optionally, send PATCH/PUT to backend here
    }
  }

  function handleDeleteAccount() {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3001/auth/me', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 204) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          alert("Account deleted successfully");
          navigate('/');
        } else if (res.status === 401) {
          throw new Error("Unauthorized");
        } else {
          throw new Error("Failed to delete account");
        }
      })
      .catch(err => alert(err.message));
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    alert("Logged out successfully");
    navigate('/login');
  }

  return (
    <div className="fourthpage-container">
      <h1 className="fourthpage-title">User Profile</h1>
      <form className="fourthpage-info">
        <div className="fourthpage-info-text">Email: {email}</div>
        <div className="fourthpage-info-text">
          Username:{' '}
          <input
            type="text"
            value={newUsername || username}
            onChange={handleUsernameChange}
            className="fourthpage-info-input"
          />
        </div>
        <div className="fourthpage-info-text">
          Password:{' '}
          <input
            type="password"
            value={newPassword || password}
            onChange={handlePasswordChange}
            className="fourthpage-info-input"
          />
        </div>
        <div className="fourthpage-info-buttons">
          <button
            className="fourthpage-info-btn"
            onClick={handleChangeUsername}
          >
            Change Username
          </button>
          <button
            className="fourthpage-info-btn"
            onClick={handleChangePassword}
          >
            Change Password
          </button>
        </div>
        <div className="fourth-page-delete-button">
          <button
            className='fourthpage-dlt-button'
            onClick={handleDeleteAccount}
          >
            Delete Account
          </button>
        </div>
        <div className="fourth-page-logout-button">
          <button
            className='fourthpage-logout-button'
            type="button"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </form>
      <div className="fourthpage-reports">
        <h2 className="fourthpage-reports-title">MY REPORTS</h2>
        {/* Empty scrollable box for reports */}
      </div>
      <BottomNavBar />
    </div>
  );
}

export default FourthPage;