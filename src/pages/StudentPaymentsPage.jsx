export default function StudentPaymentsTab({
  user,
  studentRecords,
  paymentRecords
}) {
  // Find match for logged-in student profile
  const myProfile = studentRecords.find(s => s.studentId === user.username);
  // Match my history items
  const myHistory = paymentRecords.filter(p => p.studentId === user.username);

  // Compute metrics safely
  const discAmt = (Number(myProfile?.feeStructure?.tuitionFee || 0) * Number(myProfile?.feeStructure?.discountPercentage || 0)) / 100;
  const netMonthlyTuition = Number(myProfile?.feeStructure?.tuitionFee || 0) - discAmt;
  const totalPaidSum = myHistory.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="row g-4 mb-4">
        {/* COMPACT CARD 1 */}
        <div className="col-md-4">
          <div className="card shadow-sm p-4 border-0 rounded bg-white text-dark d-flex align-items-start gap-3 h-100 position-relative overflow-hidden">
            <div className="bg-primary-subtle p-3 rounded-circle text-primary border"><i className="bi bi-wallet2 fs-3"></i></div>
            <div>
              <small className="text-uppercase text-secondary fw-semibold small d-block">Net Monthly Tuition Fee</small>
              <h2 className="fw-bold my-1 text-primary">PKR {netMonthlyTuition.toLocaleString()}</h2>
              {Number(myProfile?.feeStructure?.discountPercentage || 0) > 0 && (
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle small fw-semibold">
                  Includes {myProfile.feeStructure.discountPercentage}% Active Subsidy Waiver
                </span>
              )}
            </div>
          </div>
        </div>

        {/* COMPACT CARD 2 */}
        <div className="col-md-4">
          <div className="card shadow-sm p-4 border-0 rounded bg-white text-dark d-flex align-items-start gap-3 h-100 position-relative overflow-hidden">
            <div className="bg-success-subtle p-3 rounded-circle text-success border"><i className="bi bi-shield-check fs-3"></i></div>
            <div>
              <small className="text-uppercase text-secondary fw-semibold small d-block">Accumulated Settled Payments</small>
              <h2 className="fw-bold my-1 text-success">PKR {totalPaidSum.toLocaleString()}</h2>
              <span className="text-muted small"><i className="bi bi-check-all me-1"></i>Cleared Ledger Cycle Logs</span>
            </div>
          </div>
        </div>

        {/* COMPACT CARD 3 */}
        <div className="col-md-4">
          <div className="card shadow-sm p-4 border-0 rounded bg-white text-dark d-flex align-items-start gap-3 h-100 position-relative overflow-hidden">
            <div className="bg-warning-subtle p-3 rounded-circle text-warning border"><i className="bi bi-person-badge fs-3"></i></div>
            <div>
              <small className="text-uppercase text-secondary fw-semibold small d-block">Enrolled Profile Class</small>
              <h2 className="fw-bold my-1 text-dark">{myProfile?.classSeeking || 'Not Found'}</h2>
              <span className="text-muted small">Status: <span className="text-success fw-bold">Active Clear Matrix ●</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* STUDENT SELF INVOICE REGISTRY LEDGER */}
      <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '12px' }}>
        <h5 className="fw-bold text-dark mb-3"><i className="bi bi-receipt-cutoff me-2"></i>My Official Cleared Digital Fee Voucher History</h5>
        <div className="table-responsive">
          <table className="table align-middle border table-hover">
            <thead className="table-light">
              <tr>
                <th>Receipt Identifier Code</th>
                <th>Billing Fee Cycle Month</th>
                <th>Surcharge / Fine Costs</th>
                <th>Paid Amount Total</th>
                <th>Clearing Date Metric</th>
                <th className="text-end">Voucher Receipt</th>
              </tr>
            </thead>
            <tbody>
              {myHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <i className="bi bi-hourglass-split fs-1 d-block mb-2 text-secondary"></i>
                    No invoice transactions logged for this student identity ID yet.
                  </td>
                </tr>
              ) : (
                myHistory.map((record) => (
                  <tr key={record._id}>
                    <td><span className="text-monospace fw-bold text-primary">{record.receiptNo}</span></td>
                    <td><span className="badge bg-light text-dark border px-3 py-2 fw-semibold">{record.billingMonth}</span></td>
                    <td className="text-danger fw-semibold">PKR {(record.fineCharges || 0).toLocaleString()}</td>
                    <td><strong className="text-success">PKR {Number(record.amountPaid).toLocaleString()}</strong></td>
                    <td><small className="text-secondary">{new Date(record.paymentDate).toLocaleDateString()}</small></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-dark" onClick={() => window.openReceipt(record)}>
                        📄 View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}