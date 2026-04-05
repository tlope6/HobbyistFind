import { useState, useEffect } from "react";
import {getUserLocation} from "../services/locationService.js"
const useLocation = () => {
    const [location, setLocation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    useEffect(() => {
        getUserLocation().then(setLocation).catch((err) => {setError(err.message); setLocation(FALLBACK_LOCATION)}).finally(() => setLoading(false))
    }, [])
    return {location, loading, error}
}
export default useLocation