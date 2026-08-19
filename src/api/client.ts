import { auth } from '../lib/firebase.ts';

export async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const user = auth?.currentUser;
    if (user) {
      const token = await user.getIdToken().catch(() => null);
      if (token) {
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
      }
    }
  } catch (e) {
    // Firebase auth token retrieval fallback
  }

  // Check stored local customer session
  try {
    const localUserRaw = localStorage.getItem('albarakah_customer_user');
    if (localUserRaw) {
      const localUser = JSON.parse(localUserRaw);
      if (localUser?.email) {
        const encodedName = encodeURIComponent(localUser.name || localUser.email.split('@')[0]);
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer session:${localUser.email}:${encodedName}`,
        };
      }
    }
  } catch (e) {
    // Local storage ignore
  }

  return {
    'Content-Type': 'application/json',
  };
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}
