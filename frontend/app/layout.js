import './globals.css'

export const metadata = {
  title: 'JARVIS - Communication Coach',
  description: 'AI-powered communication skills trainer',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
