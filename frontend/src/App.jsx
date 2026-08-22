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

      <div className="max-w-md mx-auto mt-6 flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
            <span className="text-[11px] font-medium text-accent">
              {email ? email[0].toUpperCase() : '?'}
            </span>
          </div>
          <span className="text-sm text-text-primary">{email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-text-muted hover:text-danger transition-colors font-mono uppercase tracking-wider"
        >
          Logout
        </button>
      </div>

      <PaymentForm token={token} />

      <div className="max-w-md mx-auto mt-10 space-y-4 pb-16">
        <p className="font-mono text-[11px] text-text-muted uppercase tracking-widest px-1">
          Transaction history
        </p>

        {loadingHistory ? (
          <div className="flex items-center justify-center gap-2 py-10">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border-soft rounded-xl">
            <p className="text-sm text-text-muted">No transactions yet</p>
            <p className="text-xs text-text-muted/70 mt-1">Make your first payment above to get started</p>
          </div>
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
