import { redirect } from 'next/navigation';

export default function ImportPage() {
  // Redirect to the new import system
  redirect('/dashboard/import');
}
