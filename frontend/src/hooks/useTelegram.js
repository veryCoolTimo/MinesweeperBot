import { useEffect, useState, useCallback } from 'react'

export function useTelegram() {
  const [tg, setTg] = useState(null)
  const [user, setUser] = useState(null)
  const [colorScheme, setColorScheme] = useState('light')

  useEffect(() => {
    const telegram = window.Telegram?.WebApp

    if (telegram) {
      telegram.ready()
      telegram.expand()

      setTg(telegram)
      setUser(telegram.initDataUnsafe?.user || null)
      setColorScheme(telegram.colorScheme || 'light')

      // Apply theme
      document.documentElement.setAttribute('data-theme', telegram.colorScheme)

      // Listen for theme changes
      telegram.onEvent('themeChanged', () => {
        setColorScheme(telegram.colorScheme)
        document.documentElement.setAttribute('data-theme', telegram.colorScheme)
      })

      // Setup main button
      telegram.MainButton.setParams({
        text: 'NEW GAME',
        color: '#007aff',
        text_color: '#ffffff',
        is_visible: false
      })

      // Enable haptic feedback
      if (telegram.HapticFeedback) {
        telegram.HapticFeedback.impactOccurred('light')
      }
    } else {
      // Development fallback
      setUser({ id: 0, first_name: 'Dev', username: 'developer' })
    }
  }, [])

  const hapticFeedback = useCallback((type = 'light') => {
    if (tg?.HapticFeedback) {
      if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type)
      } else {
        tg.HapticFeedback.impactOccurred(type)
      }
    }
  }, [tg])

  const showMainButton = useCallback((text, onClick) => {
    if (tg?.MainButton) {
      tg.MainButton.setText(text)
      tg.MainButton.show()
      tg.MainButton.onClick(onClick)
    }
  }, [tg])

  const hideMainButton = useCallback(() => {
    if (tg?.MainButton) {
      tg.MainButton.hide()
    }
  }, [tg])

  const sendData = useCallback((data) => {
    if (tg) {
      tg.sendData(JSON.stringify(data))
    }
  }, [tg])

  const close = useCallback(() => {
    if (tg) {
      tg.close()
    }
  }, [tg])

  return {
    tg,
    user,
    colorScheme,
    hapticFeedback,
    showMainButton,
    hideMainButton,
    sendData,
    close
  }
}
