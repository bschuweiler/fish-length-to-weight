import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import App from './App.jsx'

const theme = createTheme({
  primaryColor: 'teal',
  components: {
    // Prevent iOS Safari from zooming on input focus (triggers when font-size < 16px).
    // Class-level override needed because Mantine's class selectors outspecify bare
    // element rules in global CSS.
    Input: {
      styles: { input: { fontSize: 'max(16px, 1em)' } },
    },
    NativeSelect: {
      styles: { input: { fontSize: 'max(16px, 1em)' } },
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
)
