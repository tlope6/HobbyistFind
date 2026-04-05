import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const [location, setLocation] = useState(null)
  const [cityName, setCityName] = useState('Detecting...')
  const [activeCategory, setActiveCategory] = useState('')

  return (
    <AppContext.Provider value={{
      location, setLocation,
      cityName, setCityName,
      activeCategory, setActiveCategory,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)