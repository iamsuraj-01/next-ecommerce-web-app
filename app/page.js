'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShoppingCart, User, LogOut, Package, Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Home, LayoutDashboard } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [orders, setOrders] = useState([])
  
  const [currentView, setCurrentView] = useState('home')
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Electronics',
    stock: '',
    image_url: ''
  })
  
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProducts()
      fetchCart()
      fetchOrders()
    } else {
      fetchProducts()
    }
  }, [user])

  useEffect(() => {
    filterProducts()
  }, [products, selectedCategory, searchQuery])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const response = await fetch('/api/auth/user')
      const data = await response.json()
      setUser(data.user)
    }
    setLoading(false)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const response = await fetch('/api/auth/user')
          const data = await response.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    
    try {
      const endpoint = authMode === 'signin' ? '/api/auth/signin' : '/api/auth/signup'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setAuthError(data.error || 'Authentication failed')
        return
      }

      toast({
        title: authMode === 'signin' ? 'Welcome back!' : 'Account created!',
        description: authMode === 'signin' ? 'You have successfully signed in.' : 'You can now start shopping.',
      })

      setEmail('')
      setPassword('')
      await checkAuth()
    } catch (error) {
      setAuthError('An error occurred. Please try again.')
    }
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    setUser(null)
    setCart([])
    setCurrentView('home')
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    })
  }

  const fetchProducts = async () => {
    const response = await fetch('/api/products')
    const data = await response.json()
    setProducts(data)
  }

  const filterProducts = () => {
    let filtered = products
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredProducts(filtered)
  }

  const fetchCart = async () => {
    const response = await fetch('/api/cart')
    if (response.ok) {
      const data = await response.json()
      setCart(data)
    }
  }

  const fetchOrders = async () => {
    const response = await fetch('/api/orders')
    if (response.ok) {
      const data = await response.json()
      setOrders(data)
    }
  }

  const addToCart = async (product) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to cart.',
        variant: 'destructive'
      })
      return
    }

    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, quantity: 1 })
    })

    if (response.ok) {
      await fetchCart()
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      })
    }
  }

  const updateCartQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return

    const response = await fetch(`/api/cart/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQuantity })
    })

    if (response.ok) {
      await fetchCart()
    }
  }

  const removeFromCart = async (itemId) => {
    const response = await fetch(`/api/cart/${itemId}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      await fetchCart()
      toast({
        title: 'Removed from cart',
        description: 'Item has been removed from your cart.',
      })
    }
  }

  const handleCheckout = async () => {
    const items = cart.map(item => ({
      product_id: item.product_id,
      name: item.products.name,
      price: parseFloat(item.products.price),
      quantity: item.quantity,
      image_url: item.products.image_url
    }))

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const response = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, total })
    })

    const data = await response.json()

    if (response.ok && data.url) {
      window.location.href = data.url
    } else {
      toast({
        title: 'Checkout failed',
        description: 'Unable to proceed to checkout. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const createProduct = async (e) => {
    e.preventDefault()
    
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock)
      })
    })

    if (response.ok) {
      await fetchProducts()
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: 'Electronics',
        stock: '',
        image_url: ''
      })
      toast({
        title: 'Product created',
        description: 'New product has been added successfully.',
      })
    }
  }

  const deleteProduct = async (productId) => {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      await fetchProducts()
      toast({
        title: 'Product deleted',
        description: 'Product has been removed.',
      })
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })

    if (response.ok) {
      await fetchOrders()
      toast({
        title: 'Order updated',
        description: 'Order status has been updated.',
      })
    }
  }

  const cartTotal = cart.reduce((sum, item) => 
    sum + (parseFloat(item.products.price) * item.quantity), 0
  )

  const categories = ['all', ...new Set(products.map(p => p.category))]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-600 p-3 rounded-full">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">ShopHub</CardTitle>
            <CardDescription className="text-center">
              {authMode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {authError && (
                <p className="text-sm text-red-600">{authError}</p>
              )}
              <Button type="submit" className="w-full">
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="link"
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
                setAuthError('')
              }}
            >
              {authMode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </CardFooter>
        </Card>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-900">ShopHub</span>
              </div>
              <div className="hidden md:flex space-x-4">
                <Button
                  variant={currentView === 'home' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('home')}
                  className="flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Shop</span>
                </Button>
                <Button
                  variant={currentView === 'orders' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('orders')}
                  className="flex items-center space-x-2"
                >
                  <Package className="h-4 w-4" />
                  <span>Orders</span>
                </Button>
                {user?.role === 'admin' && (
                  <Button
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('admin')}
                    className="flex items-center space-x-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Admin</span>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-600">{user?.email}</span>
                {user?.role === 'admin' && (
                  <Badge variant="secondary">Admin</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
              <h1 className="text-4xl font-bold mb-2">Welcome to ShopHub</h1>
              <p className="text-lg opacity-90">Discover amazing products at great prices</p>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    <img
                      src={product.image_url || 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2">
                      {product.category}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-indigo-600">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedProduct(product)}>
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{selectedProduct?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <img
                            src={selectedProduct?.image_url || 'https://via.placeholder.com/400'}
                            alt={selectedProduct?.name}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          <p className="text-gray-600">{selectedProduct?.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-indigo-600">
                              ${parseFloat(selectedProduct?.price || 0).toFixed(2)}
                            </span>
                            <Badge>{selectedProduct?.category}</Badge>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => {
                              addToCart(selectedProduct)
                            }}
                            disabled={selectedProduct?.stock === 0}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">My Orders</h2>
            {orders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-500 mb-4">Start shopping to create your first order</p>
                  <Button onClick={() => setCurrentView('home')}>
                    Browse Products
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                          <CardDescription>
                            {new Date(order.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={order.status === 'paid' ? 'default' : 'secondary'}
                          >
                            {order.status}
                          </Badge>
                          <p className="text-2xl font-bold text-indigo-600 mt-2">
                            ${parseFloat(order.total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {order.order_items?.map(item => (
                          <div key={item.id} className="flex items-center space-x-4 py-2 border-t">
                            <img
                              src={item.products.image_url || 'https://via.placeholder.com/100'}
                              alt={item.products.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{item.products.name}</p>
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            </div>
                            <p className="font-medium">
                              ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'admin' && user?.role === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Admin Dashboard</h2>
            <Tabs defaultValue="products">
              <TabsList>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">All Orders</TabsTrigger>
              </TabsList>
              <TabsContent value="products" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createProduct} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Product Name</Label>
                          <Input
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={newProduct.category}
                            onValueChange={(value) => setNewProduct({...newProduct, category: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Electronics">Electronics</SelectItem>
                              <SelectItem value="Accessories">Accessories</SelectItem>
                              <SelectItem value="Clothing">Clothing</SelectItem>
                              <SelectItem value="Home">Home</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock</Label>
                          <Input
                            type="number"
                            value={newProduct.stock}
                            onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input
                          value={newProduct.image_url}
                          onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                        />
                      </div>
                      <Button type="submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Manage Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {products.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <img
                              src={product.image_url || 'https://via.placeholder.com/100'}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">
                                ${parseFloat(product.price).toFixed(2)} • Stock: {product.stock}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="orders">
                <div className="space-y-4">
                  {orders.map(order => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                            <CardDescription>
                              {new Date(order.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="text-right space-y-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xl font-bold text-indigo-600">
                              ${parseFloat(order.total).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {order.order_items?.map(item => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-t">
                              <div className="flex items-center space-x-4">
                                <img
                                  src={item.products.image_url || 'https://via.placeholder.com/100'}
                                  alt={item.products.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div>
                                  <p className="font-medium text-sm">{item.products.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <p className="font-medium">
                                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shopping Cart</DialogTitle>
            <DialogDescription>
              {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center space-x-4 py-2 border-b">
                      <img
                        src={item.products.image_url || 'https://via.placeholder.com/100'}
                        alt={item.products.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.products.name}</p>
                        <p className="text-sm text-indigo-600">
                          ${parseFloat(item.products.price).toFixed(2)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity === 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <Button className="w-full" onClick={handleCheckout}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
