import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const Debug: React.FC = () => {
  const { tokens, user, isAuthenticated } = useAuth()
  const [result, setResult] = useState<string>('')

  const testCartAPI = async () => {
    try {
      setResult('Testing cart API...')
      console.log('Testing with token:', tokens ? `${tokens.access.substring(0, 20)}...` : 'No token')
      
      const response = await fetch('http://localhost:8000/api/cart/', {
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      setResult(`Cart API Response (${response.status}): ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Cart API Error: ${error}`)
    }
  }

  const testOrdersAPI = async () => {
    try {
      setResult('Testing orders API...')
      const response = await fetch('http://localhost:8000/api/orders/', {
        headers: {
          'Authorization': `Bearer ${tokens?.access}`
        }
      })
      
      const data = await response.json()
      setResult(`Orders API Response: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Orders API Error: ${error}`)
    }
  }

  const testAuth = async () => {
    try {
      setResult('Testing auth endpoint...')
      const response = await fetch('http://localhost:8000/api/cart/test-auth/', {
        headers: {
          'Authorization': `Bearer ${tokens?.access}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      setResult(`Auth Test Response (${response.status}): ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Auth Test Error: ${error}`)
    }
  }

  const testAddToCart = async () => {
    try {
      setResult('Testing add to cart...')
      const response = await fetch('http://localhost:8000/api/cart/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`
        },
        body: JSON.stringify({
          product_id: 10,
          quantity: 1
        })
      })
      
      const data = await response.json()
      setResult(`Add to Cart Response (${response.status}): ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Add to Cart Error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>API Debug Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Authentication Status:</h3>
              <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
              <p>User: {user?.username || 'None'}</p>
              <p>Token: {tokens ? 'Present' : 'Missing'}</p>
              <p>Token Preview: {tokens ? `${tokens.access.substring(0, 20)}...` : 'No token'}</p>
            </div>
            
            <div className="space-y-2">
              <Button onClick={testAuth} variant="outline">Test Auth Endpoint</Button>
              <Button onClick={testCartAPI} variant="outline">Test Cart API</Button>
              <Button onClick={testOrdersAPI} variant="outline">Test Orders API</Button>
              <Button onClick={testAddToCart} variant="outline">Test Add to Cart</Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">API Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {result || 'No test run yet'}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  )
}

export default Debug