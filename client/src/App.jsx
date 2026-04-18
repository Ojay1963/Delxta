import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingState from './components/LoadingState'

const Home = lazy(() => import('./pages/Home'))
const Menu = lazy(() => import('./pages/Menu'))
const OrderCheckout = lazy(() => import('./pages/OrderCheckout'))
const PaystackCallback = lazy(() => import('./pages/PaystackCallback'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const OrderDetails = lazy(() => import('./pages/OrderDetails'))
const Reservations = lazy(() => import('./pages/Reservations'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const Profile = lazy(() => import('./pages/Profile'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingState message="Loading page..." />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route
                    path="/order"
                    element={
                      <ProtectedRoute>
                        <OrderCheckout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment/callback"
                    element={
                      <ProtectedRoute>
                        <PaystackCallback />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order/success/:id"
                    element={
                      <ProtectedRoute>
                        <OrderSuccess />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reservations"
                    element={
                      <ProtectedRoute>
                        <Reservations />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/edit"
                    element={
                      <ProtectedRoute>
                        <EditProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
