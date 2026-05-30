import { useState } from 'react'
import axios from "axios";
import './App.css'

function App() {

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    gender: '',
    email: '',
    college: '',
    contactNumber: '',
    degree: '',
    branch: ''
  })

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const API_URL = 'http://localhost:8080/api/students'
  
    const loadForEdit = async () => {
      const input = prompt('Enter student ID to edit:')
      const studentId = input?.trim()
      if (!studentId) return
      if (!/^[0-9]+$/.test(studentId)) {
        setErrorMessage('Please enter a valid numeric student ID')
        return
      }
      setLoading(true)
      setErrorMessage('')
      try {
        const res = await axios.get(`${API_URL}/by-student-id/${studentId}`)
        const s = res.data
        setFormData({
          studentId: s.studentId || '',
          name: s.fullName || '',
          gender: s.gender || '',
          email: s.email || '',
          college: s.collegeName || '',
          contactNumber: s.contactNumber || '',
          degree: s.degree || '',
          branch: s.branch || ''
        })
        setEditingId(s.studentId)
        setSuccessMessage('Loaded student for edit')
        setTimeout(() => setSuccessMessage(''), 2500)
      } catch (err) {
        console.error(err)
        if (err.response?.status === 404) setErrorMessage('Student not found')
        else setErrorMessage('Error loading student')
      } finally {
        setLoading(false)
      }
    }

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    // Validation
    if (
      !formData.studentId ||
      !formData.name ||
      !formData.gender ||
      !formData.email ||
      !formData.college ||
      !formData.contactNumber ||
      !formData.degree ||
      !formData.branch
    ) {
      setErrorMessage('Please fill all fields')
      return
    }

    // Student ID validation (1-99)
    const idNum = parseInt(formData.studentId, 10)
    if (Number.isNaN(idNum) || idNum < 1 || idNum > 99) {
      setErrorMessage('Student ID must be a number between 1 and 99')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email')
      return
    }

    // Contact validation
    const contactRegex = /^\d{10}$/

    if (!contactRegex.test(formData.contactNumber)) {
      setErrorMessage('Please enter a valid 10-digit contact number')
      return
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {

      const studentData = {
        studentId: parseInt(formData.studentId, 10),
        fullName: formData.name,
        gender: formData.gender,
        email: formData.email,
        collegeName: formData.college,
        contactNumber: formData.contactNumber,
        degree: formData.degree,
        branch: formData.branch
      }

      if (editingId) {
        await axios.put(`${API_URL}/by-student-id/${editingId}`, studentData)
        setSuccessMessage('Student updated successfully!')
        setEditingId(null)
      } else {
        await axios.post(API_URL, studentData)
        setSuccessMessage('Student registered successfully!')
      }

      clearForm()

      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)

    } catch (error) {

      console.error(error)

      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message)
      } else if (error.response?.status === 409) {
        setErrorMessage('Email already registered')
      } else if (error.message === 'Network Error') {
        setErrorMessage('Network error - Backend server not running on port 8080')
      } else {
        setErrorMessage(error.message || 'Error registering student')
      }

    } finally {

      setLoading(false)

    }
  }

  const clearForm = () => {
    setFormData({
      studentId: '',
      name: '',
      gender: '',
      email: '',
      college: '',
      contactNumber: '',
      degree: '',
      branch: ''
    })
    setEditingId(null)
  }

  return (

    <div className="app-container">

      <header className="header">
        <h1>{editingId ? 'Edit Student' : 'Student Registration Form'}</h1>
        <p>{editingId ? 'Update student details' : 'Fill in your details to register'}</p>
      </header>

      <main className="main-content">

        <form
          className="registration-form"
          onSubmit={handleSubmit}
        >

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="studentId">Student ID (1-99) *</label>

            <input
              type="number"
              id="studentId"
              name="studentId"
              min="1"
              max="99"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Enter student ID (1-99)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name *</label>

            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender *</label>

            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>

            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>

            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="college">College Name *</label>

            <input
              type="text"
              id="college"
              name="college"
              value={formData.college}
              onChange={handleChange}
              placeholder="Enter your college name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactNumber">
              Contact Number *
            </label>

            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="Enter 10-digit contact number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="degree">Degree *</label>

            <select
              id="degree"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
            >
              <option value="">Select Degree</option>

              <option value="Bachelor">
                Bachelor
              </option>

              <option value="Master">
                Master
              </option>

              <option value="Diploma">
                Diploma
              </option>

            </select>
          </div>

          <div className="form-group">
            <label htmlFor="branch">Branch *</label>

            <select
              id="branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
            >
              <option value="">
                Select Branch
              </option>

              <option value="Computer Science">
                Computer Science
              </option>

              <option value="Electronics">
                Electronics
              </option>

              <option value="Mechanical">
                Mechanical
              </option>

              <option value="Electrical">
                Electrical
              </option>

              <option value="Civil">
                Civil
              </option>

              <option value="Information Technology">
                Information Technology
              </option>

            </select>
          </div>

          <div className="button-group">
            <button
              type="button"
              className="update-btn"
              onClick={loadForEdit}
              disabled={loading}
            >
              Edit
            </button>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Submitting...' : editingId ? 'Update' : 'Register'}
            </button>

            {editingId && (
              <button
                type="button"
                className="clear-btn"
                onClick={clearForm}
              >
                Cancel
              </button>
            )}
          </div>

        </form>

      </main>

    </div>
  )
}

export default App