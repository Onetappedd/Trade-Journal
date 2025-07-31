import { useAuth } from '../context/auth-provider'

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav>
      {/* ...existing code... */}
      {user && (
        <>
          <span>Hello, {user.email}</span>
          <button onClick={signOut}>Sign Out</button>
        </>
      )}
      {/* ...existing code... */}
    </nav>
  )
}