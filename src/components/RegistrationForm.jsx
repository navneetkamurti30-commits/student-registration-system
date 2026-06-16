import { useState } from 'react';
import axios from 'axios';

const RegistrationForm = () => {
    // State for text data AND the image file
    const [formData, setFormData] = useState({
        studentId: '', 
        fullName: '', 
        gender: '', 
        email: '', 
        collegeName: '', 
        contactNumber: '', 
        degree: '', 
        branch: ''
    });
    const [file, setFile] = useState(null); 

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Use FormData to send binary files along with form text fields to Spring Boot
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        
        if (file) {
            data.append('file', file);
        }

        try {
            await axios.post('http://localhost:8080/api/students', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Student Registered Successfully!');
            
            // Clear form after successful registration
            setFormData({
                studentId: '', fullName: '', gender: '', email: '', 
                collegeName: '', contactNumber: '', degree: '', branch: ''
            });
            setFile(null);
            document.getElementById('fileInput').value = ''; // Clear file input element
        } catch (error) {
            alert(error.response?.data?.message || 'Registration failed');
        }
    };

    // UI Styles matching your custom design layout
    const cardStyle = {
        background: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '550px',
        margin: '40px auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
        fontFamily: 'sans-serif'
    };

    const groupStyle = {
        marginBottom: '24px',
        textAlign: 'center'
    };

    const labelStyle = {
        display: 'block',
        fontWeight: '600',
        marginBottom: '10px',
        color: '#2d3748',
        fontSize: '16px'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#334155',
        backgroundColor: '#fff',
        outline: 'none',
        boxSizing: 'border-box'
    };

    const buttonStyle = {
        width: '100%',
        padding: '14px',
        backgroundColor: '#4f46e5',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '15px'
    };

    return (
        <div style={cardStyle}>
            <form onSubmit={handleSubmit}>
                
                {/* Student ID */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Student ID (1-99) *</label>
                    <input 
                        style={inputStyle}
                        name="studentId" 
                        type="number" 
                        placeholder="Enter student ID (1-99)" 
                        value={formData.studentId}
                        onChange={handleChange} 
                        required 
                    />
                </div>

                {/* Full Name */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Full Name *</label>
                    <input 
                        style={inputStyle}
                        name="fullName" 
                        type="text" 
                        placeholder="Enter your full name" 
                        value={formData.fullName}
                        onChange={handleChange} 
                        required 
                    />
                </div>

                {/* Gender */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Gender *</label>
                    <select 
                        style={inputStyle}
                        name="gender" 
                        value={formData.gender}
                        onChange={handleChange} 
                        required
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Email Address */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Email Address *</label>
                    <input 
                        style={inputStyle}
                        name="email" 
                        type="email" 
                        placeholder="Enter your email" 
                        value={formData.email}
                        onChange={handleChange} 
                        required 
                    />
                </div>

                {/* --- NEW PROFILE IMAGE UPLOAD FIELD --- */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Upload Profile Image *</label>
                    <input 
                        id="fileInput"
                        style={{ ...inputStyle, padding: '8px' }}
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setFile(e.target.files[0])} 
                        required
                    />
                </div>

                {/* College Name */}
                <div style={groupStyle}>
                    <label style={labelStyle}>College Name *</label>
                    <input 
                        style={inputStyle}
                        name="collegeName" 
                        type="text" 
                        placeholder="Enter your college name" 
                        value={formData.collegeName}
                        onChange={handleChange} 
                        required 
                    />
                </div>

                {/* Contact Number */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Contact Number *</label>
                    <input 
                        style={inputStyle}
                        name="contactNumber" 
                        type="text" 
                        placeholder="Enter 10-digit contact number" 
                        value={formData.contactNumber}
                        onChange={handleChange} 
                        required 
                    />
                </div>

                {/* Degree */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Degree *</label>
                    <input 
                        style={inputStyle}
                        name="degree" 
                        type="text" 
                        placeholder="Enter your degree" 
                        value={formData.degree}
                        onChange={handleChange} 
                        required 
                    />
                </div>

                {/* Branch */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Branch *</label>
                    <input 
                        style={inputStyle}
                        name="branch" 
                        type="text" 
                        placeholder="Enter your branch" 
                        value={formData.branch}
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <button type="submit" style={buttonStyle}>Register Student</button>
            </form>
        </div>
    );
};

export default RegistrationForm;