import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const { width: SW, height: SH } = Dimensions.get('window');

function Dot({ x, y, size, color, delay, moveY }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const transY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(transY, { toValue: moveY, duration: 3000, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: transY }],
      }}
    />
  );
}

const DOTS = [
  { x: SW * 0.15, y: SH * 0.35, s: 6, c: 'rgba(124,92,252,0.4)', d: 200, m: -20 },
  { x: SW * 0.75, y: SH * 0.32, s: 8, c: 'rgba(157,132,253,0.35)', d: 400, m: -25 },
  { x: SW * 0.4, y: SH * 0.6, s: 5, c: 'rgba(92,140,252,0.35)', d: 600, m: -18 },
  { x: SW * 0.6, y: SH * 0.55, s: 10, c: 'rgba(124,92,252,0.3)', d: 300, m: -22 },
  { x: SW * 0.25, y: SH * 0.5, s: 7, c: 'rgba(200,180,255,0.25)', d: 500, m: -15 },
  { x: SW * 0.8, y: SH * 0.45, s: 5, c: 'rgba(124,92,252,0.35)', d: 700, m: -20 },
  { x: SW * 0.5, y: SH * 0.38, s: 9, c: 'rgba(157,132,253,0.3)', d: 350, m: -28 },
  { x: SW * 0.3, y: SH * 0.65, s: 6, c: 'rgba(92,140,252,0.4)', d: 450, m: -16 },
  { x: SW * 0.7, y: SH * 0.62, s: 4, c: 'rgba(124,92,252,0.35)', d: 550, m: -24 },
  { x: SW * 0.55, y: SH * 0.42, s: 7, c: 'rgba(200,180,255,0.25)', d: 650, m: -19 },
];

export default function SplashScreen({ onFinish }) {
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const leftX = useRef(new Animated.Value(-50)).current;
  const rightX = useRef(new Animated.Value(50)).current;
  const midScaleX = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(15)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Glow
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
      // Phase 2: H logo appears + bars slide in
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, damping: 12, stiffness: 90, useNativeDriver: true }),
        Animated.spring(leftX, { toValue: 0, damping: 14, stiffness: 100, useNativeDriver: true }),
        Animated.spring(rightX, { toValue: 0, damping: 14, stiffness: 100, useNativeDriver: true }),
      ]),
      // Phase 3: Middle bar
      Animated.spring(midScaleX, { toValue: 1, damping: 14, stiffness: 110, useNativeDriver: true }),
      // Phase 4: Title + subtitle
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, damping: 15, stiffness: 100, useNativeDriver: true }),
      ]),
      Animated.timing(subOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Phase 5: Hold
      Animated.delay(800),
      // Phase 6: Fade out
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={['#0a0a0f', '#0f0f1a', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Particles */}
      {DOTS.map((d, i) => (
        <Dot key={i} x={d.x} y={d.y} size={d.s} color={d.c} delay={d.d} moveY={d.m} />
      ))}

      {/* Center glow */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}>
        <LinearGradient
          colors={['rgba(124,92,252,0.2)', 'rgba(92,140,252,0.08)', 'transparent']}
          style={styles.glowInner}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
        />
      </Animated.View>

      {/* H Logo */}
      <Animated.View style={[styles.hWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        {/* Left bar */}
        <Animated.View style={{ transform: [{ translateX: leftX }] }}>
          <LinearGradient
            colors={['#9d84fd', '#7c5cfc']}
            style={styles.vBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>

        {/* Middle bar */}
        <Animated.View style={[styles.mBarWrap, { transform: [{ scaleX: midScaleX }] }]}>
          <LinearGradient
            colors={['#7c5cfc', '#5c8cfc']}
            style={styles.mBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>

        {/* Right bar */}
        <Animated.View style={{ transform: [{ translateX: rightX }] }}>
          <LinearGradient
            colors={['#7c5cfc', '#5c8cfc']}
            style={[styles.vBar, styles.vBarRight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      </Animated.View>

      {/* Title */}
      <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        HAZECLUB
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text style={[styles.sub, { opacity: subOpacity }]}>
        A comunidade começa aqui
      </Animated.Text>
    </Animated.View>
  );
}

const BW = 22;
const BH = 100;
const G = 32;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
  },
  glowInner: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
  },
  hWrap: {
    width: G * 2 + BW * 2,
    height: BH,
    marginBottom: 28,
  },
  vBar: {
    width: BW,
    height: BH,
    borderRadius: 9,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  vBarRight: {
    left: G + BW,
  },
  mBarWrap: {
    position: 'absolute',
    left: BW - 2,
    top: (BH - BW) / 2,
  },
  mBar: {
    width: G + 4,
    height: BW,
    borderRadius: 9,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f0f0f5',
    letterSpacing: 6,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    letterSpacing: 1,
  },
});
