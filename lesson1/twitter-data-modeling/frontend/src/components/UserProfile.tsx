import React from 'react';
import { useParams, Link } from 'react-router-dom';

const UserProfile: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="dashboard">
      <header className="header">
        <h1>👤 User Profile</h1>
        <p>User ID: {id}</p>
        <Link to="/" className="btn">← Back to Dashboard</Link>
      </header>
      
      <div className="demo-section">
        <h2>User Details</h2>
        <p>This is a placeholder for user profile functionality.</p>
        <p>In a full implementation, this would show:</p>
        <ul>
          <li>User information</li>
          <li>Followers and following lists</li>
          <li>User's tweets</li>
          <li>Follow/unfollow buttons</li>
        </ul>
      </div>
    </div>
  );
};

export default UserProfile;
