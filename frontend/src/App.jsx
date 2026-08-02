import { useState, useEffect } from 'react'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import Header from './components/Header'
import PaymentForm from './components/PaymentForm'
import TransactionCard from './components/TransactionCard'
import AssistantChat from './components/AssistantChat'

const USER_ID = 'user_123'

function App() {
  const [transactions, setTransactions] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    fetch(`http://localhost:8080/api/payments/history/${USER_ID}`)
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => console.error('Failed to fetch history:', err))
      .finally(() => setLoadingHistory(false))
  }, [])

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws')
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        stompClient.subscribe(`/topic/transactions/${USER_ID}`, (message) => {
          const updatedTransaction = JSON.parse(message.body)

          setTransactions((prev) => {
            const exists = prev.find((t) => t.id === updatedTransaction.id)
            if (exists) {
              return prev.map((t) =>
                t.id === updatedTransaction.id ? updatedTransaction : t
              )
            }
            return [updatedTransaction, ...prev]
          })
        })
      },
    })
    stompClient.activate()

    return () => stompClient.deactivate()
  }, [])

  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <PaymentForm />

      <div className="max-w-md mx-auto mt-10 space-y-4 pb-16">
        {loadingHistory ? (
          <p className="text-center text-text-muted text-sm font-mono">
            Loading transactions...
          </p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-text-muted text-sm font-mono">
            No transactions yet — make your first payment above.
          </p>
        ) : (
          transactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))
        )}
      </div>

      <AssistantChat />
    </div>
  )
}

export default App
