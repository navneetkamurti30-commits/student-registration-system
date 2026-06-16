export default function StudentDirectoryTab({
  searchQuery,
  setSearchQuery,
  filterClass,
  setFilterClass,
  students,
  deleteStudent,
  setSelectedStudent,
  setViewMode
}) {
  // Apply visual filtering rules
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.fatherName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === '' || student.classSeeking === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="card shadow-lg border-0 p-4 animate-fade-in" style={{ background: '#ffffff', borderRadius: '12px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <div>
          <h3 className="fw-bold text-dark m-0">📋 Registered Student Matrix Directory</h3>
          <p className="text-muted small mb-0">Total Live Enrolled Database Records: {filteredStudents.length} Active Profiles</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setViewMode('register')}>
          <i className="bi bi-person-plus-fill"></i> Add New Student
        </button>
      </div>

      {/* FILTER SEARCH CRITERIA ROW */}
      <div className="row g-3 mb-4 bg-light p-3 rounded border">
        <div className="col-md-7">
          <div className="input-group">
            <span className="input-group-text bg-white text-secondary border-end-0"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control border-start-0 ps-0" placeholder="Search by Student ID, Full Name, or Father Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="col-md-5">
          <select className="form-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="">All Classes / Grades Filter</option>
            <option value="Nursery">Nursery</option>
            <option value="KG">KG</option>
            <option value="Class 1">Class 1</option>
            <option value="Class 2">Class 2</option>
            <option value="Class 3">Class 3</option>
            <option value="Class 4">Class 4</option>
            <option value="Class 5">Class 5</option>
            <option value="Class 6">Class 6</option>
            <option value="Class 7">Class 7</option>
            <option value="Class 8">Class 8</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 10">Class 10</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE BLOCK */}
      <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <table className="table table-hover align-middle border">
          <thead className="table-dark sticky-top">
            <tr>
              <th scope="col" style={{ width: '80px' }}>Photo</th>
              <th scope="col">Student ID</th>
              <th scope="col">Full Name</th>
              <th scope="col">Class seeking</th>
              <th scope="col">Father Name</th>
              <th scope="col">Contact Mobile</th>
              <th scope="col">Net Monthly Tuition</th>
              <th scope="col" className="text-end">Management Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-5 text-muted">
                  <i className="bi bi-folder-x fs-1 d-block mb-2 text-secondary"></i>
                  No student records matched your current query parameters.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const discAmt = (Number(student.feeStructure?.tuitionFee || 0) * Number(student.feeStructure?.discountPercentage || 0)) / 100;
                const netTuition = Number(student.feeStructure?.tuitionFee || 0) - discAmt;

                return (
                  <tr key={student._id}>
                    <td>
                      {student.photoAssetUrl ? (
                        <img src={student.photoAssetUrl} alt="Student" className="rounded-circle object-fit-cover shadow-sm" style={{ width: '42px', height: '42px', border: '2px solid #3b82f6' }} />
                      ) : (
                        <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: '42px', height: '42px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {student.fullName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td><span className="badge bg-primary text-monospace p-2">{student.studentId}</span></td>
                    <td><strong className="text-dark">{student.fullName}</strong></td>
                    <td><span className="badge bg-light text-dark border">{student.classSeeking}</span></td>
                    <td>{student.fatherName}</td>
                    <td><small className="text-monospace text-secondary">{student.emergencyContact}</small></td>
                    <td>
                      <span className="fw-bold text-success">PKR {netTuition.toLocaleString()}</span>
                      {Number(student.feeStructure?.discountPercentage || 0) > 0 && (
                        <span className="d-block text-danger px-1 rounded bg-light-danger border-danger small text-center fw-semibold mt-1" style={{ fontSize: '0.7rem', width: 'fit-content' }}>
                          -{student.feeStructure.discountPercentage}% Off
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm btn-outline-info" title="Detailed Profile Blueprint View" onClick={() => setSelectedStudent(student)}>
                          👁️ View
                        </button>
                        <button className="btn btn-sm btn-danger" title="Purge Profile" onClick={() => deleteStudent(student._id)}>
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}