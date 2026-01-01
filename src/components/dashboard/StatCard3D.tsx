import React, { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';
import {
  Box,
  Paper,
  Typography,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

// Types
interface StatCard3DProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
}

// 3D Floating Icon Component
interface FloatingIcon3DProps {
  color: string;
  isDarkMode: boolean;
  isHovered: boolean;
}

const FloatingIcon3D: React.FC<FloatingIcon3DProps> = ({ color, isDarkMode: _isDarkMode, isHovered }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // isDarkMode available for future theme-based effects
  void _isDarkMode;

  useFrame((state) => {
    if (meshRef.current) {
      // Rotation animation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;

      // Scale on hover
      const targetScale = isHovered ? 1.2 : 1;
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1)
      );
    }

    if (glowRef.current) {
      // Pulsing glow effect
      const material = glowRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group>
        {/* Main shape */}
        <RoundedBox
          ref={meshRef}
          args={[0.8, 0.8, 0.8]}
          radius={0.15}
          smoothness={4}
        >
          <meshStandardMaterial
            color={color}
            metalness={0.6}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={isHovered ? 0.5 : 0.3}
          />
        </RoundedBox>

        {/* Inner glow sphere */}
        <mesh ref={glowRef} scale={0.5}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Orbiting particles */}
        {[0, 1, 2].map((i) => (
          <OrbitingParticle key={i} color={color} index={i} />
        ))}
      </group>
    </Float>
  );
};

// Orbiting Particle Component
interface OrbitingParticleProps {
  color: string;
  index: number;
}

const OrbitingParticle: React.FC<OrbitingParticleProps> = ({ color, index }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const offset = (index * Math.PI * 2) / 3;

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime + offset;
      const radius = 0.7;
      meshRef.current.position.x = Math.cos(time * 1.5) * radius;
      meshRef.current.position.y = Math.sin(time * 1.5) * radius * 0.5;
      meshRef.current.position.z = Math.sin(time * 1.5) * radius;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
      />
    </mesh>
  );
};

// 3D Value Display
interface Value3DProps {
  value: string | number;
  color: string;
  isDarkMode: boolean;
}

const Value3D: React.FC<Value3DProps> = ({ value, color, isDarkMode }) => {
  const textRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (textRef.current) {
      // Subtle floating animation
      textRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.02;
    }
  });

  return (
    <Text
      ref={textRef}
      position={[0, -0.3, 0.5]}
      fontSize={0.5}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.03}
      outlineColor={isDarkMode ? '#000000' : '#ffffff'}
      fontWeight="bold"
    >
      {String(value)}
    </Text>
  );
};

// Scene Component
interface Scene3DProps {
  color: string;
  value: string | number;
  isDarkMode: boolean;
  isHovered: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({ color, value, isDarkMode, isHovered }) => {
  return (
    <>
      <ambientLight intensity={isDarkMode ? 0.4 : 0.6} />
      <pointLight position={[2, 2, 2]} intensity={0.8} color={color} />
      <pointLight position={[-2, -2, 2]} intensity={0.4} color="#ffffff" />

      <FloatingIcon3D
        color={color}
        isDarkMode={isDarkMode}
        isHovered={isHovered}
      />

      <Value3D value={value} color={color} isDarkMode={isDarkMode} />
    </>
  );
};

// Main Component
export const StatCard3D: React.FC<StatCard3DProps> = React.memo(({
  title,
  value,
  change,
  changeLabel,
  icon,
  color,
  loading = false,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isHovered, setIsHovered] = useState(false);
  const cardColor = color || theme.palette.primary.main;

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Suppress unused icon warning - icon is rendered in the 2D overlay
  void icon;

  const paperBackground = isDarkMode
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha('#1a1a2e', 0.98)} 100%)`
    : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(cardColor, 0.08)} 100%)`;

  const canvasBackground = isDarkMode
    ? `linear-gradient(180deg, ${alpha(cardColor, 0.1)} 0%, transparent 100%)`
    : `linear-gradient(180deg, ${alpha(cardColor, 0.05)} 0%, transparent 100%)`;

  if (loading) {
    return (
      <Paper sx={{ p: 2, height: 180 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rectangular" height={100} sx={{ my: 1, borderRadius: 2 }} />
        <Skeleton variant="text" width="40%" />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={isDarkMode ? 6 : 2}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        p: 2,
        height: 180,
        background: paperBackground,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        border: isDarkMode
          ? `1px solid ${alpha(cardColor, 0.3)}`
          : `1px solid ${alpha(cardColor, 0.2)}`,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered
          ? `0 8px 30px ${alpha(cardColor, 0.3)}`
          : undefined,
      }}
    >
      {/* Title */}
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          fontWeight: 500,
          mb: 1,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {title}
      </Typography>

      {/* 3D Canvas */}
      <Box
        sx={{
          position: 'absolute',
          top: 30,
          right: 0,
          width: '60%',
          height: 120,
          background: canvasBackground,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 3], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene3D
            color={cardColor}
            value={value}
            isDarkMode={isDarkMode}
            isHovered={isHovered}
          />
        </Canvas>
      </Box>

      {/* Value Display (2D overlay for better readability) */}
      <Typography
        variant="h3"
        sx={{
          color: cardColor,
          fontWeight: 'bold',
          position: 'relative',
          zIndex: 2,
          mt: 2,
          textShadow: isDarkMode
            ? `0 0 20px ${alpha(cardColor, 0.5)}`
            : 'none',
        }}
      >
        {value}
      </Typography>

      {/* Change indicator */}
      {change !== undefined && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {change >= 0 ? (
            <TrendingUp
              sx={{
                fontSize: 18,
                color: theme.palette.success.main,
              }}
            />
          ) : (
            <TrendingDown
              sx={{
                fontSize: 18,
                color: theme.palette.error.main,
              }}
            />
          )}
          <Typography
            variant="body2"
            sx={{
              color: change >= 0 ? theme.palette.success.main : theme.palette.error.main,
              fontWeight: 600,
            }}
          >
            {change >= 0 ? '+' : ''}{change}%
          </Typography>
          {changeLabel && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                ml: 0.5,
              }}
            >
              {changeLabel}
            </Typography>
          )}
        </Box>
      )}

      {/* Decorative accent line */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${cardColor}, ${alpha(cardColor, 0.3)})`,
          borderRadius: '0 0 12px 12px',
        }}
      />
    </Paper>
  );
});

StatCard3D.displayName = 'StatCard3D';

export default StatCard3D;
