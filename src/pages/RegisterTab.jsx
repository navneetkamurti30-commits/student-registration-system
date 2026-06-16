export default function RegisterTab({
  formData,
  handleInputChange,
  handlePhotoChange,
  photoPreview,
  removePhoto,
  handleNestedInputChange,
  addAcademicHistory,
  removeAcademicHistory,
  addSibling,
  removeSibling,
  handleSiblingChange,
  handleSubmit,
  loading,
  clearForm
}) {
  return (
    <div className="card shadow-lg border-0 p-4 animate-fade-in" style={{ background: '#ffffff', borderRadius: '12px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <h3 className="fw-bold text-primary m-0">🎓 Student Admission & Registration</h3>
        <span className="badge bg-light text-dark border px-3 py-2">Academic Year: 2025-2026</span>
      </div>

      <form onSubmit={handleSubmit} className="needs-validation">
        {/* SECTION 1: PERSONAL DETAILS */}
        <div className="bg-light p-3 rounded mb-4 border-start border-primary border-4">
          <h5 className="fw-bold text-dark mb-0"><i className="bi bi-person-fill me-2"></i>1. Personal Information</h5>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-3 text-center">
            <div className="border rounded p-3 d-flex flex-column align-items-center justify-content-center bg-white style-upload-zone" style={{ minHeight: '200px', borderStyle: 'dashed !important' }}>
              {photoPreview ? (
                <div className="position-relative w-100">
                  <img src={photoPreview} alt="Preview" className="img-thumbnail rounded mb-2" style={{ maxHeight: '150px', objectFit: 'cover' }} />
                  <button type="button" className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle" onClick={removePhoto} style={{ width: '28px', height: '28px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ) : (
                <div className="text-muted small">
                  <i className="bi bi-camera fs-1 text-secondary mb-2 d-block"></i>
                  Upload Passport Photo
                  <input type="file" accept="image/*" className="form-control form-control-sm mt-2" onChange={handlePhotoChange} />
                </div>
              )}
            </div>
          </div>

          <div className="col-md-9">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold text-secondary small">Full Name (As in Passport/ID) <span className="text-danger">*</span></label>
                <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="John Doe" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-secondary small">Date of Birth <span className="text-danger">*</span></label>
                <input type="date" className="form-control" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-secondary small">Gender <span className="text-danger">*</span></label>
                <select className="form-select" name="gender" value={formData.gender} onChange={handleInputChange} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-secondary small">Nationality <span className="text-danger">*</span></label>
                <input type="text" className="form-control" name="nationality" value={formData.nationality} onChange={handleInputChange} required placeholder="Pakistani" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-secondary small">CNIC / B-Form Number <span className="text-danger">*</span></label>
                <input type="text" className="form-control" name="cnic" value={formData.cnic} onChange={handleInputChange} required placeholder="42101-XXXXXXX-X" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-secondary small">Place of Birth</label>
                <input type="text" className="form-control" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleInputChange} placeholder="Karachi" />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-secondary small">Residential Address <span className="text-danger">*</span></label>
                <input type="text" className="form-control" name="residentialAddress" value={formData.residentialAddress} onChange={handleInputChange} required placeholder="House#, Street#, Sector, City" />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold text-secondary small">Blood Group</label>
                <select className="form-select" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold text-secondary small">Religion</label>
                <input type="text" className="form-control" name="religion" value={formData.religion} onChange={handleInputChange} placeholder="Islam" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ACADEMIC DETAILS */}
        <div className="bg-light p-3 rounded mb-4 border-start border-primary border-4">
          <h5 className="fw-bold text-dark mb-0"><i className="bi bi-book-fill me-2"></i>2. Academic Program Details</h5>
        </div>
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Class/Grade Seeking Admission <span className="text-danger">*</span></label>
            <select className="form-select" name="classSeeking" value={formData.classSeeking} onChange={handleInputChange} required>
              <option value="">Select Class</option>
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
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Section Shift (Preference)</label>
            <select className="form-select" name="shiftPreference" value={formData.shiftPreference} onChange={handleInputChange}>
              <option value="Morning">Morning Shift</option>
              <option value="Evening">Evening Shift</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Medium of Instruction</label>
            <select className="form-select" name="mediumOfInstruction" value={formData.mediumOfInstruction} onChange={handleInputChange}>
              <option value="English">English Medium</option>
              <option value="Urdu">Urdu Medium</option>
            </select>
          </div>
        </div>

        {/* PREVIOUS ACADEMIC HISTORY */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label fw-semibold text-secondary mb-0">Previous Academic History (If any)</label>
            <button type="button" className="btn btn-outline-primary btn-sm px-3" onClick={addAcademicHistory}>+ Add School Record</button>
          </div>
          {formData.academicHistory.length === 0 ? (
            <p className="text-muted small border rounded p-3 bg-white text-center">No previous history added. Assumed fresh enrollment.</p>
          ) : (
            formData.academicHistory.map((history, index) => (
              <div key={index} className="row g-2 mb-2 p-2 border rounded bg-white align-items-end shadow-sm">
                <div className="col-md-4">
                  <input type="text" className="form-control form-control-sm" placeholder="School Name" value={history.schoolName} onChange={(e) => handleNestedInputChange('academicHistory', index, 'schoolName', e.target.value)} required />
                </div>
                <div className="col-md-3">
                  <input type="text" className="form-control form-control-sm" placeholder="Class Passed" value={history.classPassed} onChange={(e) => handleNestedInputChange('academicHistory', index, 'classPassed', e.target.value)} required />
                </div>
                <div className="col-md-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Year" value={history.year} onChange={(e) => handleNestedInputChange('academicHistory', index, 'year', e.target.value)} required />
                </div>
                <div className="col-md-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Grades/Marks" value={history.grades} onChange={(e) => handleNestedInputChange('academicHistory', index, 'grades', e.target.value)} required />
                </div>
                <div className="col-md-1 text-end">
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeAcademicHistory(index)}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* SECTION 3: PARENT DETAILS */}
        <div className="bg-light p-3 rounded mb-4 border-start border-primary border-4">
          <h5 className="fw-bold text-dark mb-0"><i className="bi bi-people-fill me-2"></i>3. Parents / Guardian Information</h5>
        </div>
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Father's Full Name <span className="text-danger">*</span></label>
            <input type="text" className="form-control" name="fatherName" value={formData.fatherName} onChange={handleInputChange} required placeholder="Father Name" />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Father's CNIC <span className="text-danger">*</span></label>
            <input type="text" className="form-control" name="fatherCnic" value={formData.fatherCnic} onChange={handleInputChange} required placeholder="42101-XXXXXXX-X" />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Father's Occupation</label>
            <input type="text" className="form-control" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} placeholder="Business / Job Profile" />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Mother's Full Name <span className="text-danger">*</span></label>
            <input type="text" className="form-control" name="motherName" value={formData.motherName} onChange={handleInputChange} required placeholder="Mother Name" />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Emergency Mobile Number <span className="text-danger">*</span></label>
            <input type="tel" className="form-control" name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} required placeholder="03XXXXXXXXX" />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Parent's Email Address</label>
            <input type="email" className="form-control" name="parentEmail" value={formData.parentEmail} onChange={handleInputChange} placeholder="parent@example.com" />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Monthly Household Income (PKR) <span className="text-danger">*</span></label>
            <input type="number" className="form-control" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleInputChange} required placeholder="e.g. 75000" />
          </div>
        </div>

        {/* SIBLINGS INFO */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label fw-semibold text-secondary mb-0">Siblings studying in this school (For Fee Discount rules)</label>
            <button type="button" className="btn btn-outline-primary btn-sm px-3" onClick={addSibling}>+ Add Sibling</button>
          </div>
          {formData.siblingsInSchool.length === 0 ? (
            <p className="text-muted small border rounded p-3 bg-white text-center">No sibling connection records linked to this registration.</p>
          ) : (
            formData.siblingsInSchool.map((sib, index) => (
              <div key={index} className="row g-2 mb-2 p-2 border rounded bg-white align-items-end shadow-sm">
                <div className="col-md-5">
                  <input type="text" className="form-control form-control-sm" placeholder="Sibling Name" value={sib.name} onChange={(e) => handleSiblingChange(index, 'name', e.target.value)} required />
                </div>
                <div className="col-md-4">
                  <input type="text" className="form-control form-control-sm" placeholder="Class / Section" value={sib.classRoll} onChange={(e) => handleSiblingChange(index, 'classRoll', e.target.value)} required />
                </div>
                <div className="col-md-2">
                  <input type="text" className="form-control form-control-sm" placeholder="GR / Reg ID" value={sib.grNumber} onChange={(e) => handleSiblingChange(index, 'grNumber', e.target.value)} required />
                </div>
                <div className="col-md-1 text-end">
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSibling(index)}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* SECTION 4: FINANCIAL STRUCTURE SETUP */}
        <div className="bg-light p-3 rounded mb-4 border-start border-primary border-4">
          <h5 className="fw-bold text-dark mb-0"><i className="bi bi-cash-coin me-2"></i>4. Assigned Financial Fee Structure (Monthly Base)</h5>
        </div>
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <label className="form-label fw-semibold text-secondary small">Admission Fee (One-Time) <span className="text-danger">*</span></label>
            <input type="number" className="form-control border-primary text-primary fw-bold" name="admissionFee" value={formData.feeStructure.admissionFee} onChange={(e) => handleNestedInputChange('feeStructure', null, 'admissionFee', e.target.value)} required />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold text-secondary small">Monthly Tuition Fee <span className="text-danger">*</span></label>
            <input type="number" className="form-control border-primary text-primary fw-bold" name="tuitionFee" value={formData.feeStructure.tuitionFee} onChange={(e) => handleNestedInputChange('feeStructure', null, 'tuitionFee', e.target.value)} required />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold text-secondary small">Annual Development Fund</label>
            <input type="number" className="form-control text-secondary fw-bold" name="developmentFund" value={formData.feeStructure.developmentFund} onChange={(e) => handleNestedInputChange('feeStructure', null, 'developmentFund', e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold text-secondary small">Security Deposit (Refundable)</label>
            <input type="number" className="form-control text-secondary fw-bold" name="securityDeposit" value={formData.feeStructure.securityDeposit} onChange={(e) => handleNestedInputChange('feeStructure', null, 'securityDeposit', e.target.value)} />
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label fw-semibold text-secondary small">Special Discount / Scholarship Ratio (%)</label>
            <input type="number" className="form-control text-danger fw-bold" name="discountPercentage" value={formData.feeStructure.discountPercentage} onChange={(e) => handleNestedInputChange('feeStructure', null, 'discountPercentage', e.target.value)} max="100" min="0" placeholder="0" />
          </div>
          <div className="col-md-8">
            <label className="form-label fw-semibold text-secondary small">Discount Eligibility Reason / Scholarship Remarks</label>
            <input type="text" className="form-control" name="discountRemarks" value={formData.feeStructure.discountRemarks} onChange={(e) => handleNestedInputChange('feeStructure', null, 'discountRemarks', e.target.value)} placeholder="Kinship discount, Merit Scholarship, Or Orphan waiver assistance..." />
          </div>
        </div>

        {/* COMPLIANCE DECLARATION */}
        <div className="form-check p-3 border rounded mb-4 bg-light shadow-sm d-flex align-items-start gap-2">
          <input className="form-check-input ms-0 mt-1" type="checkbox" id="declareCheck" required />
          <label className="form-check-label small text-muted leading-relaxed" htmlFor="declareCheck">
            I hereby declare that all provided statements and document assets uploaded are true and legally binding to the best of my knowledge. I agree to abide by the academic regulations and financial commitments of the institution, ensuring timely clearing of monthly invoices.
          </label>
        </div>

        {/* BUTTON ACTIONS */}
        <div className="d-flex gap-3 justify-content-end border-top pt-3">
          <button type="button" className="btn btn-light px-4 border" onClick={clearForm} disabled={loading}>Reset Form</button>
          <button type="submit" className="btn btn-primary px-5 fw-bold shadow" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing Enrollment...
              </>
            ) : 'Complete Official Registration & Generate Profile 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
}