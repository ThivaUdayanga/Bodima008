import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { usersCol, postsCol, postDoc } from '../services/firebase';

const PRIMARY = '#1f4582';

export default function AdminManagePosts({ navigation }) {
  const [search, setSearch] = useState('');
  const [targetUser, setTargetUser] = useState(null); // { id, email, displayName }
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load latest posts for the searched user (live)
  useEffect(() => {
    if (!targetUser?.id) {
      setPosts([]);
      return;
    }
    const q = query(
      postsCol,
      where('ownerId', '==', targetUser.id),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [targetUser?.id]);

  const onSearchUser = async () => {
    const email = search.trim().toLowerCase();
    if (!email) return;
    setLoading(true);
    try {
      // exact email match; make sure you store user.email in lowercase
      const q = query(usersCol, where('email', '==', email), limit(1));
      const rs = await getDocs(q);
      if (rs.empty) {
        setTargetUser(null);
        setPosts([]);
        alert('No user found for that email.');
      } else {
        const doc = rs.docs[0];
        const u = { id: doc.id, ...doc.data() };
        setTargetUser({ id: doc.id, email: u.email, displayName: u.displayName || u.name || '' });
        Keyboard.dismiss();
      }
    } catch (e) {
      alert(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const onToggleVisible = async (post) => {
    try {
      const next = !(post?.visible ?? true);
      await updateDoc(postDoc(post.id), {
        visible: next,
        updatedAt: new Date(),
      });
    } catch (e) {
      alert(e?.message || 'Failed to update visibility');
    }
  };

  const onEdit = (post) => {
    // If you have an EditPost screen, navigate there. Otherwise keep the alert.
    // navigation.navigate('EditPost', { id: post.id });
    alert('Edit: ' + post.id);
  };

  const renderPost = ({ item }) => {
    const firstImg = Array.isArray(item.images) ? item.images?.[0] : (item.images || null);
    const isVisible = item?.visible !== false; // default true when missing

    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row' }}>
          <View style={styles.thumbWrap}>
            {firstImg ? (
              <Image source={{ uri: firstImg }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="image" size={20} color="#9ca3af" />
              </View>
            )}
            {!isVisible && (
              <View style={styles.hiddenBadge}>
                <Ionicons name="eye-off" size={14} color="#b91c1c" />
                <Text style={styles.hiddenText}>Hidden</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title} numberOfLines={1}>
              {item.location || '—'}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              LKR {item.price ? Number(item.price).toFixed(2) : '—'} · {item.type || '—'}
            </Text>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnNeutral]}
                onPress={() => onEdit(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.btnNeutralText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, isVisible ? styles.btnGreen : styles.btnRed]}
                onPress={() => onToggleVisible(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>
                  {isVisible ? 'Invisible' : 'Visible'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Posts</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="mail" size={18} color="#6b7280" />
        <TextInput
          placeholder="Search User by Email"
          placeholderTextColor="#6b7280"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="search"
          onSubmitEditing={onSearchUser}
        />
        <TouchableOpacity onPress={onSearchUser} style={{ padding: 6 }}>
          <Ionicons name="search" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Selected user info */}
      <View style={styles.userBar}>
        <Text style={styles.userBarText}>
          {targetUser
            ? `User: ${targetUser.displayName || '(no name)'} • ${targetUser.email}`
            : 'Search a user to view posts'}
        </Text>
      </View>

      {/* Posts */}
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={renderPost}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading
              ? 'Searching…'
              : targetUser
                ? 'No posts for this user.'
                : 'No data'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  searchWrap: {
    marginTop: 12,
    marginHorizontal: 16,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eeecf4',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    paddingVertical: 8,
  },

  userBar: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userBarText: { color: '#374151' },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    padding: 12,
    marginBottom: 12,
  },
  thumbWrap: { width: 88, height: 88, borderRadius: 10, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbPlaceholder: { backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },

  hiddenBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hiddenText: { color: '#b91c1c', fontSize: 12, fontWeight: '700' },

  title: { color: '#111827', fontWeight: '700' },
  sub: { color: '#6b7280', marginTop: 2 },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnNeutral: { backgroundColor: '#e5e7eb' },
  btnNeutralText: { color: '#111827', fontWeight: '700' },
  btnGreen: { backgroundColor: '#16a34a' }, // Visible -> shows "Invisible"
  btnRed: { backgroundColor: '#ef4444' },   // Hidden  -> shows "Visible"

  empty: { alignSelf: 'center', marginTop: 36, color: '#6b7280' },
});
