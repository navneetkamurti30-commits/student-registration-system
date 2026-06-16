import { useState, useEffect } from 'react'
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css'

// ==========================================
// QR CODE GENERATOR (Pure SVG / No library)
// ==========================================
function generateQRMatrix(text) {
  // Simple visual QR-like pattern based on text hash (decorative / demo)
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  // Finder patterns (corners)
  const finder = (r, c) => {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4))
        matrix[r + i][c + j] = 1;
    }
  };
  finder(0, 0); finder(0, 14); finder(14, 0);
  // Timing patterns
  for (let i = 8; i < 13; i++) { matrix[6][i] = i % 2 === 0 ? 1 : 0; matrix[i][6] = i % 2 === 0 ? 1 : 0; }
  // Data modules from text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (matrix[r][c] === 0) {
      const v = Math.abs((hash ^ (r * 31 + c * 17) ^ (r + c)) % 3);
      matrix[r][c] = v === 0 ? 1 : 0;
    }
  }
  return matrix;
}

function QRCode({ value, size = 160 }) {
  const matrix = generateQRMatrix(value);
  const cells = matrix.length;
  const cellSize = size / cells;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto', border: '8px solid white', borderRadius: '4px' }}>
      <rect width={size} height={size} fill="white" />
      {matrix.map((row, r) => row.map((cell, c) => cell ? (
        <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#0f172a" />
      ) : null))}
    </svg>
  );
}

// ==========================================
// CENTRAL APPLICATION CORE LAYOUT
// ==========================================
function Dashboard() {
  const { user, logout } = useAuth();

  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [formData, setFormData] = useState({
    studentId: '', name: '', gender: '', email: '',
    college: '', contactNumber: '', degree: '', branch: ''
  });
  const [file, setFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('register');

  const [students, setStudents] = useState([]);
  const [deletedStudents, setDeletedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingStudent, setSearchingStudent] = useState(false);

  // --- PAYMENT & RECEIPT STATES ---
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [registrationPaymentAmount, setRegistrationPaymentAmount] = useState('500');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // --- PAYMENTS TAB STATES ---
  const [paymentStudents, setPaymentStudents] = useState([]);
  const [loadingPaymentStudents, setLoadingPaymentStudents] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState({}); // studentId -> { status, method, txnId, date, amount }
  const [studentProfile, setStudentProfile] = useState(null);
  const [loadingStudentPayment, setLoadingStudentPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentStudent, setSelectedPaymentStudent] = useState(null);
  const [paymentTabMethod, setPaymentTabMethod] = useState('Cash');
  const [paymentTabAmount, setPaymentTabAmount] = useState('');
  const [paymentTabProcessing, setPaymentTabProcessing] = useState(false);
  const [showPaymentTabQR, setShowPaymentTabQR] = useState(false);
  const [paymentTabReceipt, setPaymentTabReceipt] = useState(null);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');

  const REGISTRATION_FEE = 500;
  const API_URL = 'http://localhost:8080/api/students';
  const PAYMENT_API_URL = 'http://localhost:8080/api/payments';

  const normalizePaymentMethod = (method) => method === 'Online (UPI/QR)' ? 'UPI' : method;

  const formatMoney = (value) => Number(value || 0).toFixed(2);

  const formatPaymentDate = (value) => {
    if (!value) return currentDateTime.toLocaleString();
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? currentDateTime.toLocaleString() : parsedDate.toLocaleString();
  };

  const buildPaymentRecord = (payment, student, payments = []) => {
    const paidPayments = (payments.length ? payments : payment ? [payment] : [])
      .filter(item => (item.paymentStatus || '').toLowerCase() === 'paid')
      .sort((a, b) => new Date(b.paymentDate || b.createdAt || 0) - new Date(a.paymentDate || a.createdAt || 0));
    const latestPayment = payment || paidPayments[0] || null;
    const totalPaid = paidPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const remainingAmount = Math.max(REGISTRATION_FEE - totalPaid, 0);
    const status = remainingAmount <= 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Pending';

    return {
      status,
      method: latestPayment?.paymentMethod || '',
      txnId: latestPayment?.transactionId || (latestPayment?.paymentId ? `PAY-${latestPayment.paymentId}` : ''),
      date: formatPaymentDate(latestPayment?.paymentDate || latestPayment?.createdAt),
      amount: Number(latestPayment?.amount || 0),
      totalPaid,
      remainingAmount,
      student,
      paymentId: latestPayment?.paymentId,
      payments: paidPayments
    };
  };

  // Auto-load student profile for STUDENT role
  useEffect(() => {
    if (user?.role === 'STUDENT' && user?.username) {
      const loadExistingStudentProfile = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${API_URL}/by-student-id/${user.username}`);
          if (res.data) {
            const s = res.data;
            setStudentProfile(s);
            setFormData({
              studentId: s.studentId || '', name: s.fullName || '', gender: s.gender || '',
              email: s.email || '', college: s.collegeName || '',
              contactNumber: s.contactNumber || '', degree: s.degree || '', branch: s.branch || ''
            });
            setEditingId(s.id);
            setSuccessMessage('Welcome back! Existing registration details loaded for updates.');
            setTimeout(() => setSuccessMessage(''), 4000);
          }
        } catch (err) {
          if (/^\d+$/.test(user.username)) setFormData(prev => ({ ...prev, studentId: user.username }));
        } finally {
          setLoading(false);
        }
      };
      loadExistingStudentProfile();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'STUDENT' && !['register', 'studentPayments'].includes(viewMode)) setViewMode('register');
  }, [user, viewMode]);

  useEffect(() => {
    if (viewMode === 'active' && user?.role === 'ADMIN') fetchAllStudents();
    else if (viewMode === 'deleted' && user?.role === 'ADMIN') fetchDeletedStudents();
    else if (viewMode === 'payments' && user?.role === 'ADMIN') fetchPaymentStudents();
    else if (viewMode === 'studentPayments' && user?.role === 'STUDENT') fetchStudentPayment();
  }, [viewMode, user]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const delayDebounceQuery = setTimeout(async () => {
      setSearchingStudent(true);
      const queryValue = searchQuery.trim();
      try {
        let res;
        if (/^\d+$/.test(queryValue)) {
          res = await axios.get(`${API_URL}/by-student-id/${queryValue}`);
          setSearchResults(res.data ? [res.data] : []);
        } else {
          res = await axios.get(`${API_URL}/search-by-name?name=${encodeURIComponent(queryValue)}`);
          setSearchResults(res.data || []);
        }
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearchingStudent(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceQuery);
  }, [searchQuery]);

  const fetchAllStudents = async () => {
    setLoadingStudents(true); setErrorMessage('');
    try {
      const res = await axios.get(API_URL);
      setStudents(res.data); setSortOrder('asc');
    } catch (err) {
      setErrorMessage('Error loading students: ' + (err.response?.data?.message || err.message));
    } finally { setLoadingStudents(false); }
  };

  const fetchDeletedStudents = async () => {
    setLoadingDeleted(true); setErrorMessage('');
    try {
      const res = await axios.get(`${API_URL}/deleted`);
      setDeletedStudents(res.data || []);
    } catch (err) {
      setErrorMessage('Error loading deleted history: ' + (err.response?.data?.message || err.message));
    } finally { setLoadingDeleted(false); }
  };

  const fetchPaymentStudents = async () => {
    setLoadingPaymentStudents(true); setErrorMessage('');
    try {
      const [studentsRes, paymentsRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(PAYMENT_API_URL)
      ]);
      const loadedStudents = studentsRes.data || [];
      const loadedPayments = paymentsRes.data || [];
      const paymentsByStudentId = loadedPayments.reduce((acc, payment) => {
        if (!acc[payment.studentId]) acc[payment.studentId] = [];
        acc[payment.studentId].push(payment);
        return acc;
      }, {});
      const recordsByStudentRowId = loadedStudents.reduce((acc, student) => {
        acc[student.id] = buildPaymentRecord(null, student, paymentsByStudentId[student.studentId] || []);
        return acc;
      }, {});

      setPaymentStudents(loadedStudents);
      setPaymentRecords(recordsByStudentRowId);
    } catch (err) {
      setErrorMessage('Error loading students for payments: ' + (err.response?.data?.message || err.message));
    } finally { setLoadingPaymentStudents(false); }
  };

  const fetchStudentPayment = async () => {
    setLoadingStudentPayment(true); setErrorMessage('');
    try {
      let profile = studentProfile;
      if (!profile && user?.username) {
        const studentRes = await axios.get(`${API_URL}/by-student-id/${user.username}`);
        profile = studentRes.data;
        setStudentProfile(profile);
      }

      if (!profile?.studentId) {
        setPaymentStudents([]);
        setPaymentRecords({});
        setErrorMessage('Student profile not found for this login.');
        return;
      }

      const paymentsRes = await axios.get(`${PAYMENT_API_URL}/student/${profile.studentId}`);
      const paymentRecord = buildPaymentRecord(null, profile, paymentsRes.data || []);

      setPaymentStudents([profile]);
      setPaymentRecords({ [profile.id]: paymentRecord });
    } catch (err) {
      setPaymentStudents([]);
      setPaymentRecords({});
      setErrorMessage('Error loading your payment details: ' + (err.response?.data?.message || err.message));
    } finally { setLoadingStudentPayment(false); }
  };

  const handlePrintRegister = () => window.print();
  const handlePrintReceipt = () => window.print();

  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setErrorMessage(''); };
  const toggleSortOrder = () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');

  const getSortedStudents = () => [...students].sort((a, b) =>
    sortOrder === 'asc' ? a.studentId - b.studentId : b.studentId - a.studentId
  );

  const deleteStudent = async (id, studentName) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
      setLoadingStudents(true);
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSuccessMessage('Student deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 2500);
        clearSearch(); fetchAllStudents();
      } catch (err) {
        setErrorMessage('Error deleting student: ' + (err.response?.data?.message || err.message));
      } finally { setLoadingStudents(false); }
    }
  };

  const restoreStudent = async (id, studentName) => {
    if (!id) { alert("Error: Missing tracking identifier!"); return; }
    if (window.confirm(`Do you want to restore ${studentName} back to the active list?`)) {
      setLoadingDeleted(true); setErrorMessage(''); setSuccessMessage('');
      try {
        await axios.put(`${API_URL}/restore/${id}`);
        setSuccessMessage(`${studentName} restored back to list successfully!`);
        setTimeout(() => setSuccessMessage(''), 2500);
        setDeletedStudents(prev => prev.filter(s => s.id !== id && s.studentId !== id));
        await fetchAllStudents(); setViewMode('active');
      } catch (err) {
        setErrorMessage('Error restoring student: ' + (err.response?.data?.message || err.message));
      } finally { setLoadingDeleted(false); }
    }
  };

  const sendWhatsAppMessage = (student) => {
    if (!student.contactNumber) { alert("No contact number available."); return; }
    const cleanedPhone = student.contactNumber.replace(/\D/g, '');
    const formattedPhone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;
    const message = `Hello ${student.fullName},\n\nYour registration has been received successfully!\n*ID:* ${student.studentId}\n*Degree:* ${student.degree}\n*Branch:* ${student.branch}\n\nThank you.`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const loadForEditFromTable = (student) => {
    setFormData({
      studentId: student.studentId || '', name: student.fullName || '',
      gender: student.gender || '', email: student.email || '',
      college: student.collegeName || '', contactNumber: student.contactNumber || '',
      degree: student.degree || '', branch: student.branch || ''
    });
    setEditingId(student.id); setViewMode('register');
    setSuccessMessage('Loaded student for edit');
    setTimeout(() => setSuccessMessage(''), 2500);
  };

  const loadForEdit = async () => {
    const studentIdInput = prompt('Enter student ID to edit:');
    if (!studentIdInput) return;
    setLoading(true); setErrorMessage('');
    try {
      const res = await axios.get(`${API_URL}/by-student-id/${studentIdInput}`);
      const s = res.data;
      setFormData({
        studentId: s.studentId || '', name: s.fullName || '', gender: s.gender || '',
        email: s.email || '', college: s.collegeName || '',
        contactNumber: s.contactNumber || '', degree: s.degree || '', branch: s.branch || ''
      });
      setEditingId(s.id);
      setSuccessMessage('Loaded student for edit');
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (err) {
      if (err.response?.status === 404) setErrorMessage('Student with ID ' + studentIdInput + ' not found.');
      else setErrorMessage('Error loading student: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.name || !formData.gender || !formData.email ||
      !formData.college || !formData.contactNumber || !formData.degree || !formData.branch) {
      setErrorMessage('Please fill all fields'); return;
    }
    const idNum = parseInt(formData.studentId, 10);
    if (Number.isNaN(idNum) || idNum < 1 || idNum > 99) {
      setErrorMessage('Student ID must be a number between 1 and 99'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorMessage('Please enter a valid email'); return;
    }
    if (!/^\d{10}$/.test(formData.contactNumber)) {
      setErrorMessage('Please enter a valid 10-digit contact number'); return;
    }
    setErrorMessage('');
    if (editingId) executeBackendRegistration(null);
    else setShowPaymentGateway(true);
  };

  const executeBackendRegistration = async (generatedTransactionId) => {
    setLoading(true); setErrorMessage(''); setSuccessMessage('');
    try {
      if (editingId) {
        const jsonPayload = {
          studentId: parseInt(formData.studentId, 10), fullName: formData.name,
          gender: formData.gender, email: formData.email, collegeName: formData.college,
          contactNumber: formData.contactNumber, degree: formData.degree, branch: formData.branch
        };
        await axios.put(`${API_URL}/${editingId}`, jsonPayload, { headers: { 'Content-Type': 'application/json' } });
        setSuccessMessage('Student details updated successfully!');
        if (user?.role === 'ADMIN') { setEditingId(null); clearForm(); }
      } else {
        const enteredAmount = Number(registrationPaymentAmount);
        const remainingAmount = Math.max(REGISTRATION_FEE - enteredAmount, 0);
        const data = new FormData();
        data.append('studentId', parseInt(formData.studentId, 10));
        data.append('fullName', formData.name); data.append('gender', formData.gender);
        data.append('email', formData.email); data.append('collegeName', formData.college);
        data.append('contactNumber', formData.contactNumber);
        data.append('degree', formData.degree); data.append('branch', formData.branch);
        data.append('paymentAmount', enteredAmount);
        data.append('paymentMethod', normalizePaymentMethod(paymentMethod));
        data.append('transactionId', generatedTransactionId);
        if (user?.registrationPassword) data.append('loginPassword', user.registrationPassword);
        if (file) data.append('file', file);
        await axios.post(API_URL, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccessMessage(remainingAmount > 0
          ? `Student registered. Remaining fee: Rs. ${formatMoney(remainingAmount)}`
          : 'Student registered and paid successfully!');
        setActiveReceipt({
          transactionId: generatedTransactionId, amount: enteredAmount,
          totalPaid: enteredAmount, remainingAmount,
          method: paymentMethod, date: currentDateTime.toLocaleString(), ...formData
        });
        clearForm();
      }
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 409)
        setErrorMessage(error.response?.data?.message || 'Conflict detected.');
      else if (error.message === 'Network Error')
        setErrorMessage('Network error - Backend server not running on port 8080');
      else setErrorMessage(error.response?.data?.message || error.message || 'Error processing request');
    } finally { setLoading(false); }
  };

  const handleProcessPayment = () => {
    const enteredAmount = Number(registrationPaymentAmount);
    if (!enteredAmount || Number.isNaN(enteredAmount) || enteredAmount <= 0) {
      setErrorMessage('Enter a payment amount greater than zero');
      return;
    }
    if (enteredAmount > REGISTRATION_FEE) {
      setErrorMessage(`Payment amount cannot be greater than Rs. ${formatMoney(REGISTRATION_FEE)}`);
      return;
    }
    setErrorMessage('');
    setPaymentProcessing(true);
    setTimeout(() => {
      const generatedTxnId = "TXN-" + Math.floor(100000 + Math.random() * 900000) + "-" + Date.now().toString().slice(-4);
      setPaymentProcessing(false); setShowPaymentGateway(false);
      executeBackendRegistration(generatedTxnId);
    }, 2000);
  };

  const clearForm = () => {
    setFormData({
      studentId: user?.role === 'STUDENT' ? user.username : '',
      name: '', gender: '', email: '', college: '', contactNumber: '', degree: '', branch: ''
    });
    setFile(null);
    setRegistrationPaymentAmount(String(REGISTRATION_FEE));
    const fileInputElement = document.getElementById('imageFile');
    if (fileInputElement) fileInputElement.value = '';
    if (user?.role === 'ADMIN') setEditingId(null);
  };

  // ==========================================
  // PAYMENTS TAB FUNCTIONS
  // ==========================================
  const openPaymentModal = (student) => {
    const record = paymentRecords[student.id];
    const remainingAmount = record?.remainingAmount ?? REGISTRATION_FEE;
    if (remainingAmount <= 0) {
      setSuccessMessage(`${student.fullName}'s total fee is already paid.`);
      setTimeout(() => setSuccessMessage(''), 2500);
      return;
    }
    setSelectedPaymentStudent(student);
    setPaymentTabAmount(String(remainingAmount));
    setPaymentTabMethod('Cash');
    setShowPaymentTabQR(false);
    setPaymentTabProcessing(false);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentStudent(null);
    setPaymentTabAmount('');
    setShowPaymentTabQR(false);
    setPaymentTabProcessing(false);
  };

  const handlePaymentTabMethodChange = (method) => {
    setPaymentTabMethod(method);
    setShowPaymentTabQR(false);
  };

  const generateOnlineQR = () => {
    const amountToPay = Number(paymentTabAmount);
    const remainingAmount = selectedPaymentStudent
      ? paymentRecords[selectedPaymentStudent.id]?.remainingAmount ?? REGISTRATION_FEE
      : REGISTRATION_FEE;

    if (!amountToPay || Number.isNaN(amountToPay) || amountToPay <= 0) {
      setErrorMessage('Enter a payment amount greater than zero');
      return;
    }
    if (amountToPay > remainingAmount) {
      setErrorMessage(`Payment amount cannot be greater than remaining fee: Rs. ${formatMoney(remainingAmount)}`);
      return;
    }
    setErrorMessage('');
    setShowPaymentTabQR(true);
  };

  const confirmPaymentTabPayment = async () => {
    const amountToPay = Number(paymentTabAmount);
    const currentRecord = paymentRecords[selectedPaymentStudent.id];
    const remainingAmount = currentRecord?.remainingAmount ?? REGISTRATION_FEE;

    if (!amountToPay || Number.isNaN(amountToPay) || amountToPay <= 0) {
      setErrorMessage('Enter a payment amount greater than zero');
      return;
    }
    if (amountToPay > remainingAmount) {
      setErrorMessage(`Payment amount cannot be greater than remaining fee: Rs. ${formatMoney(remainingAmount)}`);
      return;
    }

    setPaymentTabProcessing(true);
    setErrorMessage('');
    try {
      const txnId = paymentTabMethod === 'Cash'
        ? "CASH-" + Math.floor(100000 + Math.random() * 900000)
        : "TXN-" + Math.floor(100000 + Math.random() * 900000) + "-" + Date.now().toString().slice(-4);

      const paymentPayload = {
        studentId: selectedPaymentStudent.studentId,
        amount: amountToPay,
        paymentStatus: 'Paid',
        paymentMethod: normalizePaymentMethod(paymentTabMethod),
        transactionId: txnId
      };

      const res = await axios.post(PAYMENT_API_URL, paymentPayload, {
        headers: { 'Content-Type': 'application/json' }
      });
      const record = buildPaymentRecord(res.data, selectedPaymentStudent, [
        ...(currentRecord?.payments || []),
        res.data
      ]);

      setPaymentRecords(prev => ({
        ...prev,
        [selectedPaymentStudent.id]: record
      }));

      setPaymentTabProcessing(false);
      setShowPaymentModal(false);
      setShowPaymentTabQR(false);
      setPaymentTabAmount('');
      setPaymentTabReceipt(record);
      setSuccessMessage(record.remainingAmount > 0
        ? `Payment recorded for ${selectedPaymentStudent.fullName}. Remaining fee: Rs. ${formatMoney(record.remainingAmount)}`
        : `Payment completed for ${selectedPaymentStudent.fullName}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Error saving payment: ' + (err.response?.data?.message || err.message));
    } finally {
      setPaymentTabProcessing(false);
    }
  };

  const viewPaymentReceipt = (studentId) => {
    const record = paymentRecords[studentId];
    if (record) setPaymentTabReceipt(record);
  };

  const escapeReceiptValue = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const downloadPaymentReceipt = (receipt = paymentTabReceipt) => {
    if (!receipt) return;
    const student = receipt.student || {};
    const rows = [
      ['Transaction ID', receipt.txnId],
      ['Date & Time', receipt.date],
      ['Payment Mode', receipt.method === 'Cash' ? 'Cash' : 'Online (UPI/QR)'],
      ['Student ID', student.studentId],
      ['Full Name', student.fullName],
      ['Email', student.email],
      ['Contact', student.contactNumber],
      ['College', student.collegeName],
      ['Course', `${student.degree || ''} - ${student.branch || ''}`],
      ['This Payment', `Rs. ${formatMoney(receipt.amount)}`],
      ['Total Paid', `Rs. ${formatMoney(receipt.totalPaid ?? receipt.amount)}`],
      ['Remaining Fee', `Rs. ${formatMoney(receipt.remainingAmount)}`],
    ];
    const receiptHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SMIT Payment Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
    .receipt { max-width: 640px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 28px; }
    h1 { margin: 0 0 4px; text-align: center; font-size: 22px; }
    .sub { text-align: center; color: #64748b; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 9px 0; border-bottom: 1px solid #e2e8f0; }
    td:first-child { color: #64748b; }
    td:last-child { text-align: right; font-weight: 700; }
    .amount { margin-top: 24px; padding: 14px; background: #0f172a; color: #ffffff; text-align: right; font-size: 20px; font-weight: 700; }
    .note { margin-top: 20px; text-align: center; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="receipt">
    <h1>SMIT PAYMENT RECEIPT</h1>
    <div class="sub">Sikkim Manipal Institute of Technology<br />PAYMENT CONFIRMED</div>
    <table>
      <tbody>
        ${rows.map(([label, value]) => `<tr><td>${escapeReceiptValue(label)}</td><td>${escapeReceiptValue(value)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="amount">Paid Rs. ${escapeReceiptValue(formatMoney(receipt.amount))}</div>
    <div class="note">This is a system-generated payment receipt. No physical signature required.</div>
  </div>
</body>
</html>`;
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SMIT-payment-receipt-${receipt.txnId || 'receipt'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFilteredPaymentStudents = () => {
    const q = paymentSearchQuery.trim().toLowerCase();
    if (!q) return paymentStudents;
    return paymentStudents.filter(s =>
      String(s.studentId).includes(q) ||
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  };

  const paidCount = Object.values(paymentRecords).filter(r => r.remainingAmount <= 0).length;
  const totalCollected = Object.values(paymentRecords).reduce((sum, record) => sum + Number(record.totalPaid || 0), 0);
  const totalRemaining = Math.max((paymentStudents.length * REGISTRATION_FEE) - totalCollected, 0);
  const selectedPaymentRecord = selectedPaymentStudent ? paymentRecords[selectedPaymentStudent.id] : null;
  const selectedRemainingAmount = selectedPaymentRecord?.remainingAmount ?? REGISTRATION_FEE;

  return (
    <div className="app-container">
      <style>{`
        @media print {
          body, html { background: #ffffff !important; color: #000000 !important; }
          .header, .notification-zone, .main-content, .no-print-column { display: none !important; }
          .no-print-overlay {
            position: absolute !important; top: 0 !important; left: 0 !important;
            width: 100% !important; height: auto !important; background: transparent !important;
            display: block !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important;
          }
          .receipt-print-zone {
            display: block !important; width: 100% !important; max-width: 100% !important;
            border: none !important; box-shadow: none !important; margin: 0 auto !important;
            padding: 10px !important; color: #000000 !important; background: #ffffff !important;
          }
          .no-print-btn { display: none !important; }
        }
      `}</style>

      {/* HEADER */}
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
            Session: <strong>{user?.username}</strong> ({user?.role})
          </span>
          <span style={{ fontSize: '0.9rem', color: '#1e293b', background: '#fbbf24', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontFamily: 'monospace', boxShadow: '0 4px 6px -1px rgba(251,191,36,0.3)' }}>
            📅 {currentDateTime.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} | ⏰ {currentDateTime.toLocaleTimeString()}
          </span>
          <button onClick={logout} className="header-btn" style={{ borderColor: '#ef4444', color: '#f87171', padding: '5px 14px', fontSize: '0.85rem' }}>
            Logout 🚪
          </button>
        </div>

        <h1>
          {editingId ? 'Modify Registration Details'
            : viewMode === 'register' ? 'Student Registration Form'
            : viewMode === 'active' ? 'All Registered Directory'
            : viewMode === 'deleted' ? 'Deleted Archive Registry'
            : viewMode === 'studentPayments' ? 'Payment Details'
            : '💳 Payment Management'}
        </h1>
        <p>
          {editingId ? 'Update your current authorization criteria profile constraints'
            : viewMode === 'register' ? 'Provide appropriate details below to request authorization'
            : viewMode === 'active' ? 'Manage and edit existing student directories'
            : viewMode === 'deleted' ? 'Track and restore deleted student applications'
            : viewMode === 'studentPayments' ? 'Pay your registration fee and download your receipt'
            : 'Record and manage student registration fee payments'}
        </p>

        {user?.role === 'ADMIN' && (
          <div className="header-buttons">
            <button className={`header-btn ${viewMode === 'register' ? 'active' : ''}`}
              onClick={() => { setViewMode('register'); clearForm(); setErrorMessage(''); setSuccessMessage(''); }}>
              Register Student
            </button>
            <button className={`header-btn ${viewMode === 'active' ? 'active' : ''}`}
              onClick={() => { setViewMode('active'); setErrorMessage(''); setSuccessMessage(''); }}>
              See Register
            </button>
            <button className={`header-btn ${viewMode === 'payments' ? 'active' : ''}`}
              onClick={() => { setViewMode('payments'); setErrorMessage(''); setSuccessMessage(''); }}
              style={viewMode === 'payments' ? {} : { borderColor: '#a78bfa', color: '#a78bfa' }}>
              💳 Payments
            </button>
            <button className={`header-btn ${viewMode === 'deleted' ? 'active' : ''}`}
              onClick={() => { setViewMode('deleted'); setErrorMessage(''); setSuccessMessage(''); }}>
              Deleted Records 🗑️
            </button>
          </div>
        )}

        {user?.role === 'STUDENT' && (
          <div className="header-buttons">
            <button className={`header-btn ${viewMode === 'register' ? 'active' : ''}`}
              onClick={() => { setViewMode('register'); setErrorMessage(''); setSuccessMessage(''); }}>
              Profile
            </button>
            <button className={`header-btn ${viewMode === 'studentPayments' ? 'active' : ''}`}
              onClick={() => { setViewMode('studentPayments'); setErrorMessage(''); setSuccessMessage(''); }}
              style={viewMode === 'studentPayments' ? {} : { borderColor: '#a78bfa', color: '#a78bfa' }}>
              Payments
            </button>
          </div>
        )}
      </header>

      <div className="notification-zone">
        {successMessage && <div className="success-message">{successMessage}</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>

      <main className="main-content">

        {/* ==========================================
            REGISTER / FORM VIEW
            ========================================== */}
        {viewMode === 'register' ? (
          <form className="registration-form" onSubmit={handleSubmit}>
            <div style={{ padding: '10px 15px', background: editingId ? 'rgba(36,197,94,0.15)' : 'purple', borderRadius: '6px', borderLeft: editingId ? '4px solid #22c55e' : '4px solid #38bdf8', color: '#f8fafc', fontSize: '0.88rem', marginBottom: '20px' }}>
              Form Status: {editingId ? <strong>📝 PROFILE UPDATE MODE (No Repayment Required)</strong> : <strong>✨ NEW ACCOUNT REGISTRATION FLOW</strong>}
            </div>
            <div className="form-group">
              <label htmlFor="studentId">Student ID (1-99) *</label>
              <input type="number" id="studentId" name="studentId" min="1" max="99"
                disabled={user?.role === 'STUDENT'} value={formData.studentId}
                onChange={handleChange} placeholder="Enter student ID (1-99)" />
            </div>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" />
            </div>
            {!editingId && (
              <div className="form-group">
                <label htmlFor="imageFile">Upload Profile Image *</label>
                <input type="file" id="imageFile" accept="image/*" onChange={(e) => setFile(e.target.files[0])} style={{ padding: '8px' }} />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="college">College Name *</label>
              <input type="text" id="college" name="college" value={formData.college} onChange={handleChange} placeholder="Enter your college name" />
            </div>
            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number *</label>
              <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Enter 10-digit contact number" />
            </div>
            <div className="form-group">
              <label htmlFor="degree">Degree *</label>
              <select id="degree" name="degree" value={formData.degree} onChange={handleChange}>
                <option value="">Select Degree</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="Diploma">Diploma</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="branch">Branch *</label>
              <select id="branch" name="branch" value={formData.branch} onChange={handleChange}>
                <option value="">Select Branch</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
                <option value="Civil">Civil</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>
            <div className="button-group">
              {user?.role === 'ADMIN' && (
                <button type="button" className="update-btn" onClick={loadForEdit} disabled={loading}>Edit Lookup</button>
              )}
              <button type="submit" className="submit-btn" disabled={loading} style={{ backgroundColor: editingId ? '#22c55e' : '#3b82f6' }}>
                {loading ? 'Processing Backend...' : editingId ? 'Update Profile Details' : 'Proceed to Enter Fees'}
              </button>
              {editingId && user?.role === 'ADMIN' && (
                <button type="button" className="clear-btn" onClick={clearForm}>Cancel</button>
              )}
            </div>
          </form>

        ) : viewMode === 'active' && user?.role === 'ADMIN' ? (
          /* ==========================================
             ACTIVE STUDENTS TABLE VIEW
             ========================================== */
          <div className="table-container">
            <div className="search-section">
              <h3>Find Student Records</h3>
              <div className="search-group">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Student ID or Name..." style={{ width: '100%' }} />
                {searchQuery.trim() && <button className="clear-search-btn" onClick={clearSearch}>Clear Filter</button>}
              </div>
              {searchingStudent && <div style={{ fontSize: '0.85rem', color: '#667eea', marginTop: '5px' }}>Finding suggestions...</div>}
            </div>
            {searchResults.length > 0 && (
              <div className="found-student-section">
                <h3>Live Suggestions Result ({searchResults.length})</h3>
                {searchResults.map((student, idx) => (
                  <div className="student-card" key={student.id} style={{ marginBottom: '15px' }}>
                    <p><strong>Sr. No:</strong> {idx + 1}</p>
                    <p><strong>Student ID:</strong> {student.studentId}</p>
                    <p><strong>Full Name:</strong> {student.fullName}</p>
                    <p><strong>Contact:</strong> {student.contactNumber}</p>
                    <p><strong>Email:</strong> {student.email}</p>
                    <div className="found-student-actions">
                      <button className="action-btn edit-btn" onClick={() => loadForEditFromTable(student)}>Edit</button>
                      <button className="action-btn whatsapp-btn" onClick={() => sendWhatsAppMessage(student)}>Send WhatsApp</button>
                      <button className="action-btn delete-btn" onClick={() => deleteStudent(student.id, student.fullName)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="students-count" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h3>Total Students Registered: <span className="count-badge">{students.length}</span></h3>
              {students.length > 0 && <button className="print-btn" onClick={handlePrintRegister}>Print Register 🖨️</button>}
            </div>
            {loadingStudents ? (
              <div className="loading">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="no-students">No students registered yet</div>
            ) : (
              <div className="table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Sr. No.</th>
                      <th onClick={toggleSortOrder} className="sortable-header">Student ID {sortOrder === 'asc' ? '↑' : '↓'}</th>
                      <th>Full Name</th><th>Gender</th><th>Email</th>
                      <th>College</th><th>Contact</th><th>Degree</th><th>Branch</th>
                      <th className="no-print-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedStudents().map((student, index) => (
                      <tr key={student.id}>
                        <td><strong>{index + 1}</strong></td>
                        <td>{student.studentId}</td><td>{student.fullName}</td>
                        <td>{student.gender}</td><td>{student.email}</td>
                        <td>{student.collegeName}</td><td>{student.contactNumber}</td>
                        <td>{student.degree}</td><td>{student.branch}</td>
                        <td className="no-print-column">
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="action-btn edit-btn" onClick={() => loadForEditFromTable(student)}>Edit</button>
                            <button className="action-btn whatsapp-btn" onClick={() => sendWhatsAppMessage(student)}>WhatsApp</button>
                            <button className="action-btn delete-btn" onClick={() => deleteStudent(student.id, student.fullName)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        ) : viewMode === 'payments' && user?.role === 'ADMIN' ? (
          /* ==========================================
             PAYMENTS TAB VIEW
             ========================================== */
          <div className="table-container">
            {/* Stats Bar */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#22c55e' }}>{paidCount}</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>Payments Collected</div>
              </div>
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(251,191,36,0.15)', border: '1px solid #fbbf24', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24' }}>{paymentStudents.length - paidCount}</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>Students With Balance</div>
              </div>
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(56,189,248,0.15)', border: '1px solid #38bdf8', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#38bdf8' }}>Rs. {formatMoney(totalCollected)}</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>Total Amount Collected</div>
              </div>
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f87171' }}>Rs. {formatMoney(totalRemaining)}</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>Total Remaining</div>
              </div>
            </div>

            {/* Search */}
            <div className="search-section" style={{ marginBottom: '16px' }}>
              <div className="search-group">
                <input type="text" value={paymentSearchQuery}
                  onChange={(e) => setPaymentSearchQuery(e.target.value)}
                  placeholder="Search by Student ID, Name, or Email..."
                  style={{ width: '100%' }} />
                {paymentSearchQuery && (
                  <button className="clear-search-btn" onClick={() => setPaymentSearchQuery('')}>Clear</button>
                )}
              </div>
            </div>

            {loadingPaymentStudents ? (
              <div className="loading">Loading payment records...</div>
            ) : paymentStudents.length === 0 ? (
              <div className="no-students">No students found. Register students first.</div>
            ) : (
              <div className="table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Sr.</th>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>Degree / Branch</th>
                      <th>Contact</th>
                      <th>Total Fee</th>
                      <th>Paid</th>
                      <th>Remaining</th>
                      <th>Payment Status</th>
                      <th>Method</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPaymentStudents().map((student, index) => {
                      const rec = paymentRecords[student.id];
                      const totalPaid = rec?.totalPaid || 0;
                      const remainingAmount = rec?.remainingAmount ?? REGISTRATION_FEE;
                      const isPaid = remainingAmount <= 0;
                      const isPartial = totalPaid > 0 && !isPaid;
                      return (
                        <tr key={student.id}>
                          <td><strong>{index + 1}</strong></td>
                          <td>{student.studentId}</td>
                          <td>{student.fullName}</td>
                          <td>{student.degree} / {student.branch}</td>
                          <td>{student.contactNumber}</td>
                          <td>Rs. {formatMoney(REGISTRATION_FEE)}</td>
                          <td>Rs. {formatMoney(totalPaid)}</td>
                          <td style={{ color: isPaid ? '#22c55e' : '#f87171', fontWeight: 'bold' }}>Rs. {formatMoney(remainingAmount)}</td>
                          <td>
                            <span style={{
                              padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                              background: isPaid ? 'rgba(34,197,94,0.2)' : isPartial ? 'rgba(56,189,248,0.18)' : 'rgba(251,191,36,0.2)',
                              color: isPaid ? '#22c55e' : isPartial ? '#38bdf8' : '#fbbf24',
                              border: `1px solid ${isPaid ? '#22c55e' : isPartial ? '#38bdf8' : '#fbbf24'}`
                            }}>
                              {isPaid ? 'Paid' : isPartial ? 'Partially Paid' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                            {rec?.method || '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {!isPaid && (
                                <button
                                  onClick={() => openPaymentModal(student)}
                                  style={{ padding: '5px 10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                  Collect
                                </button>
                              )}
                              {totalPaid > 0 && (
                                <button
                                  onClick={() => viewPaymentReceipt(student.id)}
                                  style={{ padding: '5px 10px', background: '#0f172a', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                  Receipt
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        ) : viewMode === 'studentPayments' && user?.role === 'STUDENT' ? (
          /* ==========================================
             STUDENT PAYMENT TAB VIEW
             ========================================== */
          <div className="table-container">
            {loadingStudentPayment ? (
              <div className="loading">Loading your payment details...</div>
            ) : !paymentStudents[0] ? (
              <div className="no-students">Student profile not found for this login.</div>
            ) : (() => {
              const student = paymentStudents[0];
              const rec = paymentRecords[student.id];
              const totalPaid = rec?.totalPaid || 0;
              const remainingAmount = rec?.remainingAmount ?? REGISTRATION_FEE;
              const isPaid = remainingAmount <= 0;
              const isPartial = totalPaid > 0 && !isPaid;
              return (
                <div style={{ display: 'grid', gap: '18px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 12px', color: '#0f172a' }}>Registration Fee</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                      <p style={{ margin: 0, color: '#334155' }}><strong>Student ID:</strong><br />{student.studentId}</p>
                      <p style={{ margin: 0, color: '#334155' }}><strong>Name:</strong><br />{student.fullName}</p>
                      <p style={{ margin: 0, color: '#334155' }}><strong>Course:</strong><br />{student.degree} / {student.branch}</p>
                      <p style={{ margin: 0, color: '#334155' }}><strong>Total Fee:</strong><br />Rs. {formatMoney(REGISTRATION_FEE)}</p>
                      <p style={{ margin: 0, color: '#334155' }}><strong>Paid:</strong><br />Rs. {formatMoney(totalPaid)}</p>
                      <p style={{ margin: 0, color: '#334155' }}><strong>Remaining:</strong><br />Rs. {formatMoney(remainingAmount)}</p>
                    </div>
                  </div>

                  <div style={{ background: isPaid ? 'rgba(34,197,94,0.12)' : isPartial ? 'rgba(56,189,248,0.12)' : 'rgba(251,191,36,0.14)', border: `1px solid ${isPaid ? '#22c55e' : isPartial ? '#38bdf8' : '#fbbf24'}`, borderRadius: '10px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '4px' }}>Payment Status</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isPaid ? '#15803d' : isPartial ? '#0369a1' : '#b45309' }}>
                        {isPaid ? 'Paid' : isPartial ? 'Partially Paid' : 'Pending'}
                      </div>
                      {totalPaid > 0 && (
                        <div style={{ marginTop: '6px', color: '#334155', fontSize: '0.9rem' }}>
                          {rec.method} | {rec.txnId}
                        </div>
                      )}
                    </div>
                    {!isPaid && (
                      <button
                        onClick={() => openPaymentModal(student)}
                        style={{ padding: '12px 18px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>
                        Pay Now
                      </button>
                    )}
                    {totalPaid > 0 && (
                      <button
                        onClick={() => viewPaymentReceipt(student.id)}
                        style={{ padding: '12px 18px', background: '#0f172a', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>
                        View Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

        ) : (
          /* ==========================================
             DELETED RECORDS VIEW
             ========================================== */
          <div className="table-container">
            <h3>Archived / Canceled Registrations</h3>
            {loadingDeleted ? (
              <div className="loading">Loading details...</div>
            ) : deletedStudents.length === 0 ? (
              <div className="no-students">No deleted student history found</div>
            ) : (
              <div className="table-wrapper">
                <table className="students-table gray-scale-table">
                  <thead>
                    <tr>
                      <th>Sr. No.</th><th>Student ID</th><th>Full Name</th>
                      <th>Email</th><th>College</th><th>Degree & Branch</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedStudents.map((student, index) => (
                      <tr key={student.id || index}>
                        <td><strong>{index + 1}</strong></td>
                        <td>{student.studentId}</td><td>{student.fullName}</td>
                        <td>{student.email}</td><td>{student.collegeName}</td>
                        <td>{student.degree} - {student.branch}</td>
                        <td>
                          <button className="action-btn restore-btn"
                            style={{ backgroundColor: '#2ec4b6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={() => restoreStudent(student.id || student.studentId, student.fullName)}>
                            Restore 🔄
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==========================================
          ORIGINAL REGISTRATION PAYMENT GATEWAY MODAL
          ========================================== */}
      {showPaymentGateway && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '25px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc' }}>Secure Payment Gateway</h2>
              <button onClick={() => setShowPaymentGateway(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #38bdf8' }}>
              <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.85rem' }}>Purpose: <strong>Student Registration Fee</strong></p>
              <p style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 'bold' }}>Total Fee: Rs. {formatMoney(REGISTRATION_FEE)}</p>
              <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '0.95rem', fontWeight: 'bold' }}>Remaining After Payment: Rs. {formatMoney(Math.max(REGISTRATION_FEE - Number(registrationPaymentAmount || 0), 0))}</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem' }}>Enter Fees:</label>
              <input
                type="number"
                min="1"
                max={REGISTRATION_FEE}
                value={registrationPaymentAmount}
                onChange={(e) => setRegistrationPaymentAmount(e.target.value)}
                placeholder="Enter amount to pay now"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', fontSize: '1rem' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem' }}>Select Payment Method:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button type="button" onClick={() => setPaymentMethod('UPI')}
                  style={{ padding: '12px', borderRadius: '8px', border: paymentMethod === 'UPI' ? '2px solid #38bdf8' : '1px solid #334155', background: paymentMethod === 'UPI' ? '#1e293b' : '#0f172a', color: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}>
                  📱 UPI / QR Code
                </button>
                <button type="button" onClick={() => setPaymentMethod('Card')}
                  style={{ padding: '12px', borderRadius: '8px', border: paymentMethod === 'Card' ? '2px solid #38bdf8' : '1px solid #334155', background: paymentMethod === 'Card' ? '#1e293b' : '#0f172a', color: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}>
                  💳 Credit/Debit Card
                </button>
              </div>
            </div>
            {paymentMethod === 'UPI' ? (
              <div style={{ textAlign: 'center', background: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '0 0 8px 0' }}>Scan UPI ID or click to pay</p>
                <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>smitregisters@paytm</strong>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Cardholder Name" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }} />
                <input type="text" maxLength="16" placeholder="16-Digit Card Number" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="text" placeholder="MM/YY" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }} />
                  <input type="password" maxLength="3" placeholder="CVV" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }} />
                </div>
              </div>
            )}
            <button onClick={handleProcessPayment} disabled={paymentProcessing}
              style={{ width: '100%', padding: '14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: paymentProcessing ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(34,197,94,0.3)' }}>
              {paymentProcessing ? 'Verifying Secure Assets...' : `Pay Rs. ${formatMoney(registrationPaymentAmount)} Securely`}
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          PAYMENTS TAB — COLLECT PAYMENT MODAL
          ========================================== */}
      {showPaymentModal && selectedPaymentStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>💳 Collect Payment</h2>
              <button onClick={closePaymentModal} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {/* Student Info */}
            <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #6366f1' }}>
              <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '0.82rem' }}>Student</p>
              <p style={{ margin: '0 0 2px', color: '#f8fafc', fontWeight: 'bold', fontSize: '1rem' }}>{selectedPaymentStudent.fullName}</p>
              <p style={{ margin: '0 0 2px', color: '#94a3b8', fontSize: '0.85rem' }}>ID: {selectedPaymentStudent.studentId} | {selectedPaymentStudent.degree} – {selectedPaymentStudent.branch}</p>
              <p style={{ margin: '8px 0 0', color: '#38bdf8', fontWeight: 'bold', fontSize: '1.1rem' }}>Remaining Fee: Rs. {formatMoney(selectedRemainingAmount)}</p>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Paid So Far: Rs. {formatMoney(selectedPaymentRecord?.totalPaid)}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>Enter Fees:</label>
              <input
                type="number"
                min="1"
                max={selectedRemainingAmount}
                value={paymentTabAmount}
                onChange={(e) => setPaymentTabAmount(e.target.value)}
                placeholder="Enter amount received"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', fontSize: '1rem' }}
              />
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                Remaining after this payment: Rs. {formatMoney(Math.max(selectedRemainingAmount - Number(paymentTabAmount || 0), 0))}
              </p>
            </div>

            {/* Method Selection */}
            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>Select Payment Mode:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
              {['Cash', 'Online (UPI/QR)'].map(m => (
                <button key={m} type="button" onClick={() => handlePaymentTabMethodChange(m)}
                  style={{ padding: '14px', borderRadius: '10px', border: paymentTabMethod === m ? '2px solid #6366f1' : '1px solid #334155', background: paymentTabMethod === m ? 'rgba(99,102,241,0.2)' : '#0f172a', color: paymentTabMethod === m ? '#a5b4fc' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', transition: 'all 0.2s' }}>
                  {m === 'Cash' ? '💵 Cash' : '📱 Online (UPI/QR)'}
                </button>
              ))}
            </div>

            {/* Cash Info */}
            {paymentTabMethod === 'Cash' && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '8px', padding: '14px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#86efac', fontSize: '0.9rem' }}>Collect <strong>Rs. {formatMoney(paymentTabAmount)} cash</strong> from the student and confirm below.</p>
              </div>
            )}

            {/* Online / QR Section */}
            {paymentTabMethod === 'Online (UPI/QR)' && (
              <div style={{ marginBottom: '20px' }}>
                {!showPaymentTabQR ? (
                  <button onClick={generateOnlineQR}
                    style={{ width: '100%', padding: '12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                    🔲 Generate QR Code
                  </button>
                ) : (
                  <div style={{ background: '#0f172a', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #334155' }}>
                    <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '0.82rem' }}>Scan this QR code to pay</p>
                    <QRCode value={`upi://pay?pa=smitregisters@paytm&pn=SMIT&am=${paymentTabAmount || selectedRemainingAmount}&tn=RegFee-${selectedPaymentStudent.studentId}`} size={160} />
                    <p style={{ margin: '14px 0 4px', color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '0.95rem' }}>smitregisters@paytm</p>
                    <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '0.8rem' }}>Amount: Rs. {formatMoney(paymentTabAmount || selectedRemainingAmount)}</p>
                    <p style={{ margin: '0', color: '#64748b', fontSize: '0.78rem' }}>Ref: RegFee-{selectedPaymentStudent.studentId}</p>
                    <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(251,191,36,0.1)', borderRadius: '6px', border: '1px solid #fbbf24' }}>
                      <p style={{ margin: 0, color: '#fde68a', fontSize: '0.82rem' }}>⚠️ After student pays, click <strong>Confirm Payment</strong> below.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Button */}
            <button onClick={confirmPaymentTabPayment} disabled={paymentTabProcessing || (paymentTabMethod === 'Online (UPI/QR)' && !showPaymentTabQR)}
              style={{ width: '100%', padding: '14px', background: paymentTabProcessing ? '#374151' : '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: (paymentTabProcessing || (paymentTabMethod === 'Online (UPI/QR)' && !showPaymentTabQR)) ? 'not-allowed' : 'pointer', transition: 'background 0.2s', opacity: (paymentTabMethod === 'Online (UPI/QR)' && !showPaymentTabQR) ? 0.5 : 1 }}>
              {paymentTabProcessing ? '⏳ Recording Payment...' : '✅ Confirm Payment Received'}
            </button>
            {paymentTabMethod === 'Online (UPI/QR)' && !showPaymentTabQR && (
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem', marginTop: '8px' }}>Generate QR first, then confirm after student pays</p>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          PAYMENTS TAB — RECEIPT MODAL (Printable)
          ========================================== */}
      {paymentTabReceipt && (
        <div className="no-print-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', overflowY: 'auto' }}>
          <div className="receipt-print-zone" style={{ background: '#ffffff', color: '#1e293b', borderRadius: '10px', padding: '32px', maxWidth: '560px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', border: '1px solid #e2e8f0', fontFamily: 'sans-serif' }}>

            {/* Receipt Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '16px', marginBottom: '22px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🎓</div>
              <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>SMIT PAYMENT RECEIPT</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>Sikkim Manipal Institute of Technology</p>
              <p style={{ margin: '6px 0 0', color: '#22c55e', fontSize: '0.88rem', fontWeight: 'bold' }}>✓ PAYMENT CONFIRMED</p>
            </div>

            {/* Transaction Info */}
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', fontSize: '0.88rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '5px 0', color: '#64748b' }}>Transaction ID:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#0f172a' }}>{paymentTabReceipt.txnId}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', color: '#64748b' }}>Date & Time:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', color: '#0f172a' }}>{paymentTabReceipt.date}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', color: '#64748b' }}>Payment Mode:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right' }}>
                      <span style={{ background: paymentTabReceipt.method === 'Cash' ? '#dcfce7' : '#dbeafe', color: paymentTabReceipt.method === 'Cash' ? '#166534' : '#1e40af', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.82rem' }}>
                        {paymentTabReceipt.method === 'Cash' ? '💵 Cash' : '📱 Online (UPI/QR)'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Student Info */}
            <h4 style={{ margin: '0 0 10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', fontSize: '0.9rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Details</h4>
            <table style={{ width: '100%', fontSize: '0.88rem', borderCollapse: 'collapse', marginBottom: '22px' }}>
              <tbody>
                {[
                  ['Student ID', paymentTabReceipt.student?.studentId],
                  ['Full Name', paymentTabReceipt.student?.fullName],
                  ['Email', paymentTabReceipt.student?.email],
                  ['Contact', paymentTabReceipt.student?.contactNumber],
                  ['College', paymentTabReceipt.student?.collegeName],
                  ['Course', `${paymentTabReceipt.student?.degree} — ${paymentTabReceipt.student?.branch}`],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding: '5px 0', color: '#64748b' }}>{label}:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: '500', color: '#0f172a' }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Amount */}
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '0.9rem' }}>This Payment</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#22c55e' }}>Rs. {formatMoney(paymentTabReceipt.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '0.92rem', marginBottom: '6px' }}>
                <span>Total Paid</span>
                <strong>Rs. {formatMoney(paymentTabReceipt.totalPaid ?? paymentTabReceipt.amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: paymentTabReceipt.remainingAmount > 0 ? '#fca5a5' : '#86efac', fontSize: '0.92rem' }}>
                <span>Remaining Fee</span>
                <strong>Rs. {formatMoney(paymentTabReceipt.remainingAmount)}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '22px', lineHeight: '1.5' }}>
              This is a system-generated payment receipt.<br />No physical signature required for digital payments.
            </div>

            {/* Action Buttons */}
            <div className="no-print-btn" style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => window.print()}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                🖨️ Print Receipt
              </button>
              <button onClick={() => downloadPaymentReceipt()}
                style={{ flex: 1, padding: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                Download Receipt
              </button>
              <button onClick={() => setPaymentTabReceipt(null)}
                style={{ padding: '12px 20px', background: '#475569', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ORIGINAL REGISTRATION RECEIPT MODAL
          ========================================== */}
      {activeReceipt && (
        <div className="no-print-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', overflowY: 'auto' }}>
          <div className="receipt-print-zone" style={{ background: '#ffffff', color: '#1e293b', borderRadius: '8px', padding: '30px', maxWidth: '550px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0', fontFamily: 'sans-serif' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 'bold' }}>SMIT REGISTRATION RECEIPT</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Sikkim Manipal Institute of Technology</p>
              <p style={{ margin: '5px 0 0 0', color: '#22c55e', fontSize: '0.9rem', fontWeight: 'bold' }}>✓ TRANSACTION SUCCESSFUL</p>
            </div>
            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}><strong>Transaction ID:</strong></td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace', fontWeight: 'bold' }}>{activeReceipt.transactionId}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}><strong>Payment Date:</strong></td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: '#0f172a' }}>{activeReceipt.date}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}><strong>Payment Mode:</strong></td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: '#0f172a' }}>{activeReceipt.method}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}><strong>Remaining Fee:</strong></td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: '#0f172a' }}>Rs. {formatMoney(activeReceipt.remainingAmount)}</td>
                </tr>
              </tbody>
            </table>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', fontSize: '0.95rem', color: '#334155' }}>Student Profile Mappings</h4>
            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse', marginBottom: '25px' }}>
              <tbody>
                {[
                  ['Student ID', activeReceipt.studentId],
                  ['Full Name', activeReceipt.name],
                  ['Email', activeReceipt.email],
                  ['College', activeReceipt.college],
                  ['Course Layout', `${activeReceipt.degree} (${activeReceipt.branch})`],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>{label}:</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 'bold' }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
              <span style={{ fontWeight: 'bold', color: '#334155' }}>This Payment:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a' }}>Rs. {formatMoney(activeReceipt.amount)}</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '20px' }}>
              This is a system-generated financial registration voucher.<br />No physical signature is required.
            </div>
            <div className="no-print-btn" style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handlePrintReceipt}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>
                Print Receipt 🖨️
              </button>
              <button onClick={() => setActiveReceipt(null)}
                style={{ padding: '12px 20px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ROUTER INITIALIZATION
// ==========================================
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;