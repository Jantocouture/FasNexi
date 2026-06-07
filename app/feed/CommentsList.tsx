import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { fetchComments, createComment } from '../api/commentsClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CommentsList({ postId }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [postId]);

  const load = async () => {
    try {
      const res = await fetchComments(postId);
      setComments(res.comments || []);
    } catch (e) { console.warn(e); }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const r = await createComment(postId, { content });
      if (r.comment) {
        setComments(prev => [...prev, r.comment]);
        setContent('');
      }
    } catch (e) { Alert.alert('Error', String(e)); }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList data={comments} keyExtractor={(i) => i.id} renderItem={({ item }) => (
        <View style={{ paddingVertical: 8 }}>
          <Text style={{ fontWeight: '600' }}>{item.author?.name || 'User'}</Text>
          <Text>{item.content}</Text>
        </View>
      )} />

      <View style={styles.composer}>
        <TextInput placeholder="Write a comment..." value={content} onChangeText={setContent} style={styles.input} />
        <Button title={loading ? 'Posting...' : 'Post'} onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ composer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 }, input: { flex: 1, borderWidth: 1, borderColor: '#eee', padding: 8, marginRight: 8, borderRadius: 6 } });
