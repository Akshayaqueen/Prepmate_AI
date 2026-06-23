/**
 * AnimatedCounter — counts up from 0 to `value` on mount.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, TextStyle, StyleProp } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}

export default function AnimatedCounter({
  value,
  duration = 900,
  prefix = '',
  suffix = '',
  style,
}: AnimatedCounterProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [value, duration, anim]);

  return (
    <Animated.Text style={style}>
      {prefix}
      {display}
      {suffix}
    </Animated.Text>
  );
}
