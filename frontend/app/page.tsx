import { redirect } from 'next/navigation';

// Using regular dashboard directory - no route groups needed
export default function HomePage() {
  redirect('/dashboard');
}
