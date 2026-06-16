export default function PaymentManagementTab({
  paymentRecords,
  paymentMetrics,
  openPaymentModal
}) {
  return (
    <div className="card shadow-lg border-0 p-4 animate-fade-in" style={{ background: '#ffffff', borderRadius: '12px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <div>
          <h3 className="fw-bold text-dark m-0">💰 Core Financial Revenue & Accounts Desk</h3>
          <p className="text-muted small mb-0">System Financial Ledger Auditing & Verification</p>
        </div>
        <button className="btn btn-success d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm" onClick={openPaymentModal}>
          <i className="bi bi-plus-circle-fill"></i> Collect Fee Payment Voucher
        </button>
      </div>

      {/* REVENUE INSIGHT CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 rounded p-3 bg-primary-gradient text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}>
            <small className="text-uppercase tracking-wider opacity-75 fw-semibold d-block">Gross Collection Turnover</small>
            <h2 className="fw-bold my-2 text-monospace">PKR {paymentMetrics.totalCollected.toLocaleString()}</h2>
            <span className="small opacity-90"><i className="bi bi-check-circle-fill me-1"></i>Cleared Invoices</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 rounded p-3 bg-success-gradient text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #064e3b, #10b981)' }}>
            <small className="text-uppercase tracking-wider opacity-75 fw-semibold d-block">Current Month Collection</small>
            <h2 className="fw-bold my-2 text-monospace">PKR {paymentMetrics.thisMonthCollected.toLocaleString()}</h2>
            <span className="small opacity-90"><i className="bi bi-calendar-check me-1"></i>Current Cycle</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 rounded p-3 bg-warning-gradient text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #78350f, #f59e0b)' }}>
            <small className="text-uppercase tracking-wider opacity-75 fw-semibold d-block">Arrears / Outstanding Balance</small>
            <h2 className="fw-bold my-2 text-monospace">PKR {paymentMetrics.totalPendingArrears.toLocaleString()}</h2>
            <span className="small opacity-90"><i className="bi bi-exclamation-triangle-fill me-1"></i>Defaulter Risk Pool</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 rounded p-3 bg-dark-gradient text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #111827, #4b5563)' }}>
            <small className="text-uppercase tracking-wider opacity-75 fw-semibold d-block">Transaction Logs Counter</small>
            <h2 className="fw-bold my-2 text-monospace">{paymentRecords.length} Vouchers</h2>
            <span className="small opacity-90"><i className="bi bi-receipt me-1"></i>Processed Records</span>
          </div>
        </div>
      </div>

      {/* PAYMENT TRANSACTION HISTORY TABLE */}
      <h5 className="fw-bold mb-3 text-secondary"><i className="bi bi-clock-history me-2"></i>Live Transaction Ledger Streams</h5>
      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <table className="table table-hover border align-middle">
          <thead className="table-light sticky-top">
            <tr>
              <th>Receipt Ref#</th>
              <th>Student Identity</th>
              <th>Class/Grade</th>
              <th>Billing Month / Cycle</th>
              <th>Base Tuition</th>
              <th>Fine/Late Charge</th>
              <th>Net Collected</th>
              <th>Transaction Date</th>
              <th className="text-end">Proof Statement</th>
            </tr>
          </thead>
          <tbody>
            {paymentRecords.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-5 text-muted">
                  <i className="bi bi-cash-stack fs-1 d-block mb-2 text-secondary"></i>
                  No transactions found on the ledger database.
                </td>
              </tr>
            ) : (
              paymentRecords.map((record) => (
                <tr key={record._id}>
                  <td><small className="fw-bold text-monospace text-primary">{record.receiptNo}</small></td>
                  <td>
                    <div className="fw-bold text-dark">{record.studentName}</div>
                    <small className="text-muted text-monospace">{record.studentId}</small>
                  </td>
                  <td><span className="badge bg-light text-dark border">{record.classSeeking || 'N/A'}</span></td>
                  <td><span className="badge bg-info-subtle text-info-emphasis border border-info-subtle fw-semibold px-2 py-1">{record.billingMonth}</span></td>
                  <td>PKR {Number(record.amountPaid - (record.fineCharges || 0)).toLocaleString()}</td>
                  <td className="text-danger fw-semibold">+ PKR {(record.fineCharges || 0).toLocaleString()}</td>
                  <td><strong className="text-success">PKR {Number(record.amountPaid).toLocaleString()}</strong></td>
                  <td><small className="text-secondary">{new Date(record.paymentDate).toLocaleDateString()} {new Date(record.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></td>
                  <td className="text-end">
                    {/* Event handled by passing the raw object back to Dashboard logic */}
                    <button className="btn btn-sm btn-outline-dark" onClick={() => window.openReceipt(record)}>
                      🖨️ View Voucher
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}