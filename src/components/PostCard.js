// src/components/PostCard.js
import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, FlatList, Linking,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const PRIMARY = '#1f4582';
const RADIUS = 12;

export default function PostCard({
  post,
  variant = 'feed', // 'feed' | 'profile'
  onToggleFavorite, // (postId) => void
  isFavorite = false,
  onEdit,           // () => void
  onBoost,          // () => void
}) {
  const [idx, setIdx] = useState(0);
  const [cardW, setCardW] = useState(null); // measure actual card width
  const listRef = useRef(null);

  // --- normalize images coming from Firestore (array, string, undefined)
  const images = useMemo(() => {
    let arr = [];
    if (Array.isArray(post?.images)) arr = post.images;
    else if (typeof post?.images === 'string' && post.images.trim()) arr = [post.images.trim()];
    // only keep truthy strings
    arr = arr.filter(u => typeof u === 'string' && u.startsWith('http'));
    if (arr.length === 0) return [null]; // placeholder
    return arr.slice(0, 3);
  }, [post?.images]);

  const phone = String(post?.contact || '').trim();

  return (
    <View
      style={[styles.card, variant === 'feed' && { borderColor: '#1d4ed8' }]}
      onLayout={(e) => setCardW(e.nativeEvent.layout.width)}
    >
      {/* Images carousel */}
      <View style={{ width: '100%', height: 170 }}>
        {/* VERIFIED BADGE */}
        {post?.verified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
          </View>
        ) : null}
        {cardW && (
          <FlatList
            ref={listRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            getItemLayout={(_, i) => ({
              length: cardW,
              offset: cardW * i,
              index: i,
            })}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / cardW);
              setIdx(i);
            }}
            renderItem={({ item }) => (
              <View style={{ width: cardW, height: 170 }}>
                {item ? (
                  <Image
                    source={{ uri: item }}
                    style={styles.image}
                    progressiveRenderingEnabled
                  />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <Ionicons name="image" size={28} color="#9ca3af" />
                  </View>
                )}
              </View>
            )}
          />

        )};
      </View>

      {/* dots */}
      <View style={styles.dots}>
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
        ))}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.location}>{post?.location || '—'}</Text>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
          </View>
        </View>

        <View style={styles.rowSpace}>
          <Text style={styles.price}>
            {post?.price ? `LKR ${Number(post.price).toFixed(2)}` : 'LKR —'}
            {post?.per ? ` (${post.per})` : ''}
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.typeText}>{post?.type || '—'}</Text>
            <Text style={styles.spaceText}>{post?.space ? `${post.space} person` : ''}</Text>
          </View>
        </View>

        {!!post?.description && (
          <Text numberOfLines={2} style={styles.desc}>
            {post.description} <Text style={{ color: PRIMARY }}>…see more</Text>
          </Text>
        )}

        {/* Footer (variant-specific) */}
        {variant === 'feed' ? (
          <View style={[styles.rowSpace, { marginTop: 10 }]}>
            <TouchableOpacity onPress={() => onToggleFavorite?.(post?.id)} style={styles.iconBtn}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#e11d48' : '#6b7280'}
              />
            </TouchableOpacity>

            {phone ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${phone}`)}
                style={styles.phonePill}
                activeOpacity={0.8}
              >
                <Feather name="phone" size={16} color="#111827" />
                <Text style={styles.phoneText}>  {phone}</Text>
              </TouchableOpacity>
            ) : <View /> }
          </View>
        ) : (
          <View style={[styles.rowSpace, { marginTop: 12 }]}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e5e7eb' }]} onPress={onEdit}>
              <Text style={[styles.actionText, { color: '#111827' }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e5e7eb' }]} onPress={onBoost}>
              <Text style={[styles.actionText, { color: '#111827' }]}>Boost</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: RADIUS,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    marginVertical: 8,
  },
  image: { width: '100%', height: 170, resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff' },
  dots: { flexDirection: 'row', alignSelf: 'center', marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3, backgroundColor: '#cbd5e1' },
  dotActive: { backgroundColor: '#111827' },

  body: { padding: 12, backgroundColor: '#f8fafc' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowSpace: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  location: { color: '#111827', fontWeight: '700' },
  price: { marginTop: 4, color: '#111827', fontWeight: '700' },
  typeText: { color: '#374151', fontWeight: '600' },
  spaceText: { color: '#6b7280', fontSize: 12 },
  desc: { color: '#374151', marginTop: 6 },

  iconBtn: { padding: 6, borderRadius: 999, backgroundColor: '#fff' },

  phonePill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, backgroundColor: '#e5e7eb',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  phoneText: { color: '#111827', fontWeight: '700' },

  actionBtn: {
    flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6,
  },
  actionText: { fontWeight: '700' },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});