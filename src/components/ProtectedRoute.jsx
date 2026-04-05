import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'   // check if logged in

const ProtectedRoute = ({children}) => {
    const {user, loading} = useAuth()
    if (loading) return <div className="flex items-center justify-cetner h-64 text-muted text-sm">Loading...</div>
    if (!user) return <Navigate to="/login" replace />
    return children
}
export default ProtectedRoute