import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en')
  const [translations, setTranslations] = useState({})

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const translationModule = await import(`../locales/${language}.json`)
        setTranslations(translationModule.default)
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error)
        // Fallback to English if translation fails
        if (language !== 'en') {
          const fallbackModule = await import('../locales/en.json')
          setTranslations(fallbackModule.default)
        }
      }
    }

    loadTranslations()
  }, [language])

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('stellar-stake-house-language')
    if (savedLanguage && ['en', 'pt-br'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage)
    localStorage.setItem('stellar-stake-house-language', newLanguage)
  }

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key // Return the key if translation is not found
      }
    }
    
    if (typeof value === 'string') {
      // Replace parameters in the translation
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match
      })
    }
    
    return value
  }

  const value = {
    language,
    changeLanguage,
    t,
    translations,
    availableLanguages: [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'pt-br', name: 'Português (BR)', flag: '🇧🇷' }
    ]
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export default LanguageContext