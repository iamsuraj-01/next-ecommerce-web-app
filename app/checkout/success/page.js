'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Package } from 'lucide-react'

export default function CheckoutSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      // Update order status to paid
      updateOrderStatus()
    }
  }, [sessionId])

  const updateOrderStatus = async () => {
    try {
      // In a real app, you would verify the session with Stripe
      // and update the order status via a webhook or API call
      setTimeout(() => setLoading(false), 1000)
    } catch (error) {
      console.error('Error updating order:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your order...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your order has been placed successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              You will receive an email confirmation shortly with your order details.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={() => router.push('/')}
            >
              Continue Shopping
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push('/?view=orders')}
            >
              <Package className="h-4 w-4 mr-2" />
              View Orders
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
