import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const [location, setLocation] = useState(null)
  const [cityName, setCityName] = useState('Detecting...')
  const [activeCategory, setActiveCategory] = useState('')
  const [radius, setRadius] = useState(10)

  return (
    <AppContext.Provider value={{
      location, setLocation,
      cityName, setCityName,
      activeCategory, setActiveCategory,
      radius, setRadius,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)