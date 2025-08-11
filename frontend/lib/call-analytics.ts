export async function callAnalytics(path: string, payload: any) {
  const res = await fetch(`/api/analytics/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  let data
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || res.statusText
    const err = new Error(msg)
    // @ts-ignore
    err.status = res.status
    throw err
  }
  return data
}
