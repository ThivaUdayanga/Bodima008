// src/screens/AdminManageUserScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  onSnapshot, query, orderBy, limit, where, getDocs, updateDoc
} from 'firebase/firestore';
import { usersCol, userDoc } from '../services/firebase';

const PRIMARY = '#1f4582';

export default function AdminManageUserScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  // Default list: newest users
  useEffect(() => {
    const q = query(usersCol, orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const onSearch = async () => {
    const email = search.trim().toLowerCase();
    if (!email) return; // keep default feed
    setLoading(true);
    try {
      // Exact email search. Ensure you store emails in lowercase at signup.
      const q = query(usersCol, where('email', '==', email));
      const rs = await getDocs(q);
      setUsers(rs.docs.map(d => ({ id: d.id, ...d.data() })));
      Keyboard.dismiss();
    } catch (e) {
      alert(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleDisabled = async (u) => {
    try {
      const nextDisabled = !u?.disabled;              // true => inactive
      await updateDoc(userDoc(u.id), {
        disabled: nextDisabled,
        status: nextDisabled ? 'inactive' : 'active', // optional field for UI
        updatedAt: new Date(),
      });
      // no setState needed; onSnapshot keeps list fresh
    } catch (e) {
      alert(e?.message || 'Failed to update user status');
    }
  };

  const renderUser = ({ item }) => {
    const isInactive = !!item.disabled;
    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.name} numberOfLines={1}>
              {item.displayName || item.name || '(no name)'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {item.email || '—'}
            </Text>
          </View>

          {/* Status pill */}
          <TouchableOpacity
            onPress={() => toggleDisabled(item)}
            activeOpacity={0.85}
            style={[styles.statusPill, isInactive ? styles.pillRed : styles.pillGreen]}
          >
            <Text style={[styles.pillText, isInactive ? styles.pillTextRed : styles.pillTextGreen]}>
              {isInactive ? 'Inactive' : 'Active'}
            </Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>User</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search bar like your screenshot */}
      <View style={styles.searchWrap}>
        <Ionicons name="menu" size={18} color="#6b7280" />
        <TextInput
          placeholder="Search Name / Email"
          placeholderTextColor="#6b7280"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        <TouchableOpacity onPress={onSearch} style={{ padding: 6 }}>
          <Ionicons name="search" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={renderUser}
        ListEmptyComponent={
          <Text style={{ alignSelf: 'center', marginTop: 40, color: '#6b7280' }}>
            {loading ? 'Searching…' : 'No users found'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56, backgroundColor: PRIMARY,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
  },
  headerTitle: {
    flex: 1, textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 16,
  },

  searchWrap: {
    marginTop: 10,
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
    flex: 1, color: '#111827', paddingVertical: 8,
  },

  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  name: { color: '#111827', fontWeight: '700' },
  email: { color: '#6b7280', marginTop: 2 },

  statusPill: {
    minWidth: 84, height: 30,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 10,
  },
  pillText: { fontWeight: '700' },
  pillGreen: { backgroundColor: '#6ee7b7' },
  pillRed: { backgroundColor: '#fca5a5' },
  pillTextGreen: { color: '#065f46' },
  pillTextRed: { color: '#7f1d1d' },
});
