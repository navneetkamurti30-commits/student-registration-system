import React, { useState } from 'react';

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock initial data - you will replace this by fetching from your backend
  const [studentData, setStudentData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    course: 'Computer Science',
    profileImage: 'https://via.placeholder.com/150' // Default placeholder
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentData(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Add your axios.put() or API call here to save the updated data
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Student Profile</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        <img 
          src={studentData.profileImage} 
          alt="Profile" 
          style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #3b82f6', marginBottom: '10px' }} 
        />
        {isEditing && (
          <input type="file" accept="image/*" onChange={handleProfileImageChange} style={{ fontSize: '0.8rem' }} />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Name:</label>
          {isEditing ? (
            <input name="name" value={studentData.name} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          ) : (
            <p style={{ margin: '5px 0' }}>{studentData.name}</p>
          )}
        </div>

        <div>
          <label style={{ fontWeight: 'bold' }}>Email:</label>
          {isEditing ? (
            <input name="email" value={studentData.email} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          ) : (
            <p style={{ margin: '5px 0' }}>{studentData.email}</p>
          )}
        </div>

        <div>
          <label style={{ fontWeight: 'bold' }}>Phone:</label>
          {isEditing ? (
            <input name="phone" value={studentData.phone} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          ) : (
            <p style={{ margin: '5px 0' }}>{studentData.phone}</p>
          )}
        </div>

        <div>
          <label style={{ fontWeight: 'bold' }}>Course:</label>
          {isEditing ? (
            <input name="course" value={studentData.course} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          ) : (
            <p style={{ margin: '5px 0' }}>{studentData.course}</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        {isEditing ? (
          <>
            <button onClick={handleSave} style={{ flex: 1, padding: '10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
            <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit Profile</button>
        )}
      </div>
    </div>
  );
}