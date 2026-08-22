import { useState } from 'react'

function PaymentForm({ token }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setError('')

    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      const orderRes = await fetch('http://localhost:8080/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          currency: 'INR',
        }),
      })

      if (!orderRes.ok) {
        throw new Error('Could not start payment. Please try again.')
      }

      const order = await orderRes.json()

      const options = {
        key: order.razorpayKeyId,
        amount: order.amountInPaise,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: 'Orvixa',
        handler: async function (response) {
          const verifyRes = await fetch('http://localhost:8080/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          })
          const result = await verifyRes.json()
          console.log('Payment verified:', result)
        },
      }

      const rzp = new window.Razorpay(options)

      rzp.on('payment.failed', async function (response) {
        const verifyRes = await fetch('http://localhost:8080/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpayOrderId: response.error.metadata.order_id,
            razorpayPaymentId: response.error.metadata.payment_id,
            razorpaySignature: 'invalid',
          }),
        })
        const result = await verifyRes.json()
        console.log('Payment marked as failed:', result)
      })

      rzp.open()
    } catch (err) {
      console.error('Payment failed:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-surface border border-border-soft rounded-2xl p-8 shadow-2xl shadow-black/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative">
        <p className="font-mono text-[11px] text-text-muted uppercase tracking-widest">
          New Payment
        </p>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" className="text-accent">
            <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Secured</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2 relative">
        <span className="font-display text-3xl text-text-muted">₹</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setError('')
          }}
          placeholder="0.00"
          className="font-mono text-5xl bg-transparent text-text-primary outline-none w-full placeholder:text-text-muted/40"
        />
      </div>
      <p className="text-xs text-text-muted mb-6">Enter the amount you want to pay</p>

      {error && (
        <div className="flex items-start gap-2 mb-4 text-sm text-danger">
          <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-accent hover:bg-accent-dim transition-colors text-ink font-semibold py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>

      <p className="text-center text-[11px] text-text-muted mt-4 font-mono">
        Powered by Razorpay · PCI-DSS compliant checkout
      </p>
    </div>
  )
}

export default PaymentForm
