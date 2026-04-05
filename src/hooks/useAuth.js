import {useState, useEffect} from "react"
import {supabase} from "../lib/supabaseClient.js"

const useAuth = () => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    useEffect (() => {

        supabase.auth.getSession().then(({ data: { session }}) => { setUser(session?.user ?? null); setLoading(false)})
        const {data: listener} = supabase.auth.onAuthStateChange((_e , session) => setUser(session?.user ?? null))
        return () => listener.subscription.unsubscribe()
    }, [])
    return {user, loading, signOut: () => supabase.auth.signOut()}

}

export default useAuth