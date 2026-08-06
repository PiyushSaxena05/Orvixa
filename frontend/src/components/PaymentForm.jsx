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
    <div className="max-w-md mx-auto mt-16 bg-surface border border-border-soft rounded-2xl p-8">
      <p className="font-mono text-[11px] text-text-muted uppercase tracking-widest mb-6">
        New Payment
      </p>

      <div className="flex items-baseline gap-2 mb-8">
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

      {error && (
        <p className="text-sm text-danger mb-4 -mt-4">{error}</p>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-brass hover:bg-brass-dim transition-colors text-ink font-medium py-3.5 rounded-xl disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  )
}

export default PaymentForm
