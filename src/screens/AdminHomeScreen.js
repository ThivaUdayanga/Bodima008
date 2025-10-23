// src/screens/AdminDashboard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { logOut } from '../services/AuthService';
import { onSnapshot, query, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { notificationDoc, notificationsCol, postDoc } from '../services/firebase';

const PRIMARY = '#1f4582';

export default function AdminDashboard({ navigation }) {
  const [notifs, setNotifs] = React.useState([]);

  const onLogout = async () => {
    try {
      await logOut();
      navigation.replace('Login');
    } catch (e) {
      alert(e.message);
    }
  };

  React.useEffect(() => {
    const q = query(notificationsCol, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const onAccept = async (n) => {
    try {
      // 1) mark post verified
      await updateDoc(postDoc(n.postId), { verified: true, verifiedAt: serverTimestamp() });
      // 2) mark notification accepted
      await updateDoc(notificationDoc(n.postId), { status: 'accepted', handledAt: serverTimestamp() });
    } catch (e) {
      alert(e?.message || 'Failed to accept.');
    }
  };

  const onDecline = async (n) => {
    try {
      await updateDoc(notificationDoc(n.postId), { status: 'declined', handledAt: serverTimestamp() });
    } catch (e) {
      alert(e?.message || 'Failed to decline.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Top bar */}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Tiles */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: PRIMARY }]}
            onPress={() => navigation.navigate('AdminManageUsers')}
            activeOpacity={0.9}
          >
            <Text style={styles.tileText}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tile, { backgroundColor: PRIMARY }]}
            onPress={() => navigation.navigate('AdminManagePosts')}
            activeOpacity={0.9}
          >
            <Text style={styles.tileText}>Manage Posts</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications (under the buttons) */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        {notifs.length === 0 ? (
          <Text style={styles.emptyText}>No notifications</Text>
        ) : (
          <View>
            {notifs.map((n) => (
              <View key={n.id} style={styles.notifCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {n?.preview?.image ? (
                    <Image source={{ uri: n.preview.image }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]} />
                  )}
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.notifTitle}>Boost request</Text>
                    <Text style={styles.notifSub}>
                      Post: {n.postId.slice(0, 6)} · {n?.preview?.location || '—'}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 8 }} />

                {/* Buttons: Accept (green) / Decline (red).
                    After Accept => show Inactive (red, disabled) */}
                {n.status === 'accepted' ? (
                  <View style={{ flexDirection: 'row' }}>
                    <View style={styles.inactiveBtn}>
                      <Text style={styles.inactiveText}>Inactive</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      onPress={() => onAccept(n)}
                      style={styles.acceptBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>
                    <View style={{ width: 10 }} />
                    <TouchableOpacity
                      onPress={() => onDecline(n)}
                      style={styles.declineBtn}
                      activeOpacity={0.8}
                      disabled={n.status === 'declined'}
                    >
                      <Text style={styles.declineText}>
                        {n.status === 'declined' ? 'Declined' : 'Decline'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  logout: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    color: PRIMARY,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    padding: 20,
  },

  /* Tiles */
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tile: {
    flex: 1,
    height: 90,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tileText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  /* Notifications */
  sectionTitle: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: { color: '#6b7280' },
  notifCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
  },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#e5e7eb' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontWeight: '700', color: '#111827' },
  notifSub: { color: '#6b7280', marginTop: 2, fontSize: 12 },
  acceptBtn: {
    flex: 1, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#16a34a',
  },
  acceptText: { color: '#fff', fontWeight: '700' },
  declineBtn: {
    flex: 1, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ef4444',
  },
  declineText: { color: '#fff', fontWeight: '700' },
  inactiveBtn: {
    flex: 1, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ef4444',
  },
  inactiveText: { color: '#fff', fontWeight: '700' },
});
