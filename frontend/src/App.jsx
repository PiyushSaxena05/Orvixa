import { useState, useEffect } from 'react'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import Header from './components/Header'
import PaymentForm from './components/PaymentForm'
import TransactionCard from './components/TransactionCard'
import AssistantChat from './components/AssistantChat'
import Login from './components/Login'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [email, setEmail] = useState(localStorage.getItem('email'))
  const [transactions, setTransactions] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('http://localhost:8080/api/payments/history', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => console.error('Failed to fetch history:', err))
      .finally(() => setLoadingHistory(false))
  }, [token])

  useEffect(() => {
    if (!token) return
    const socket = new SockJS('http://localhost:8080/ws')
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        stompClient.subscribe(`/topic/transactions/${email}`, (message) => {
          const updatedTransaction = JSON.parse(message.body)
          setTransactions((prev) => {
            const exists = prev.find((t) => t.id === updatedTransaction.id)
            if (exists) {
              return prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
            }
            return [updatedTransaction, ...prev]
          })
        })
      },
    })
    stompClient.activate()
    return () => stompClient.deactivate()
  }, [token, email])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    setToken(null)
    setEmail(null)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-ink">
        <Header />
        <Login onAuth={(data) => { setToken(data.token); setEmail(data.email) }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <div className="max-w-md mx-auto mt-4 flex justify-between items-center">
        <span className="text-sm text-text-muted">{email}</span>
        <button onClick={handleLogout} className="text-sm text-danger underline">Logout</button>
      </div>
      <PaymentForm token={token} />

      <div className="max-w-md mx-auto mt-10 space-y-4 pb-16">
        {loadingHistory ? (
          <p className="text-center text-text-muted text-sm font-mono">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-text-muted text-sm font-mono">No transactions yet — make your first payment above.</p>
        ) : (
          transactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))
        )}
      </div>

      <AssistantChat token={token} />
    </div>
  )
}

export default App
