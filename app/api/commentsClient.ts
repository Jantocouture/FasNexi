import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.API_BASE || 'http://localhost:4000';

export async function fetchComments(postId) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`);
  return res.json();
}

export async function createComment(postId, payload) {
  const token = await AsyncStorage.getItem('authToken');
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  return res.json();
}
