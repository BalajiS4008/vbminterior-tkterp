import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Environment, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  Box,
  Paper,
  Typography,
  Skeleton,
  useTheme,
  alpha,
  Chip,
  Stack,
  IconButton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  ViewInAr,
  Refresh,
  Flag,
} from '@mui/icons-material';

// Types
interface PriorityData {
  priority: string;
  count: number;
  color: string;
  [key: string]: string | number;
}

interface PriorityDistribution3DChartProps {
  data: PriorityData[];
  loading?: boolean;
  height?: number;
}

// 3D Priority Bar Component
interface PriorityBar3DProps {
  position: [number, number, number];
  priority: string;
  count: number;
  color: string;
  maxCount: number;
  index: number;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  isDarkMode: boolean;
}

const PriorityBar3D: React.FC<PriorityBar3DProps> = ({
  position,
  priority,
  count,
  color,
  maxCount,
  index,
  isHovered,
  onHover,
  onClick,
  isDarkMode,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const barRef = useRef<THREE.Mesh>(null);
  const [animatedHeight, setAnimatedHeight] = useState(0);

  const targetHeight = (count / maxCount) * 1.8 + 0.2;

  useFrame((state) => {
    // Animate height
    setAnimatedHeight((prev) => THREE.MathUtils.lerp(prev, targetHeight, 0.05));

    if (groupRef.current) {
      // Hover lift
      const targetY = isHovered ? 0.1 : 0;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        0.1
      );
    }

    if (barRef.current) {
      // Rotation on hover
      const targetRotation = isHovered ? Math.sin(state.clock.elapsedTime * 3) * 0.05 : 0;
      barRef.current.rotation.y = THREE.MathUtils.lerp(
        barRef.current.rotation.y,
        targetRotation,
        0.1
      );

      // Emissive pulse
      const material = barRef.current.material as THREE.MeshStandardMaterial;
      const targetEmissive = isHovered ? 0.5 : 0.2;
      material.emissiveIntensity = THREE.MathUtils.lerp(
        material.emissiveIntensity,
        targetEmissive,
        0.1
      );
    }
  });

  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const textOutline = isDarkMode ? '#000000' : '#ffffff';

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(index);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(index);
      }}
    >
      {/* Bar */}
      <RoundedBox
        ref={barRef}
        args={[0.5, animatedHeight, 0.5]}
        position={[0, animatedHeight / 2, 0]}
        radius={0.05}
        smoothness={4}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.4}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </RoundedBox>

      {/* Top cap glow */}
      <mesh position={[0, animatedHeight, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.05, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Priority icon/flag */}
      <mesh position={[0, animatedHeight + 0.15, 0]}>
        <coneGeometry args={[0.08, 0.15, 4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Count on top */}
      <Text
        position={[0, animatedHeight + 0.35, 0]}
        fontSize={0.25}
        color={color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.025}
        outlineColor={textOutline}
        fontWeight="bold"
      >
        {count}
      </Text>

      {/* Priority label */}
      <Text
        position={[0, -0.2, 0]}
        fontSize={0.14}
        color={textColor}
        anchorX="center"
        anchorY="top"
        outlineWidth={0.012}
        outlineColor={textOutline}
        fontWeight="bold"
      >
        {priority}
      </Text>

      {/* Hover tooltip */}
      {isHovered && (
        <Html position={[0, animatedHeight + 0.7, 0]} center>
          <Box
            sx={{
              background: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              color: isDarkMode ? 'white' : '#333',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              border: `3px solid ${color}`,
            }}
          >
            <div style={{ color, marginBottom: '6px', fontSize: '16px' }}>
              <Flag sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              {priority} Priority
            </div>
            <div style={{ fontSize: '20px' }}>
              Tickets: <strong>{count}</strong>
            </div>
          </Box>
        </Html>
      )}
    </group>
  );
};

// Scene Component
interface Scene3DProps {
  data: PriorityData[];
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  isDarkMode: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({
  data,
  hoveredIndex,
  onHover,
  onClick,
  isDarkMode,
}) => {
  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count)), [data]);
  const spacing = 0.8;
  const startX = -((data.length - 1) * spacing) / 2;

  return (
    <>
      <ambientLight intensity={isDarkMode ? 0.5 : 0.7} />
      <spotLight
        position={[5, 10, 5]}
        angle={0.3}
        penumbra={1}
        intensity={isDarkMode ? 0.8 : 1}
        castShadow
      />
      <pointLight position={[-3, 3, 3]} intensity={0.5} color="#d32f2f" />
      <pointLight position={[3, 3, -3]} intensity={0.5} color="#4caf50" />

      <Environment preset={isDarkMode ? 'night' : 'studio'} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[5, 3]} />
        <meshStandardMaterial
          color={isDarkMode ? '#1a1a2e' : '#e8e8f0'}
          metalness={0.3}
          roughness={0.8}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Grid */}
      <gridHelper
        args={[5, 10, isDarkMode ? '#333366' : '#aaaacc', isDarkMode ? '#222244' : '#ccccdd']}
        position={[0, 0, 0]}
      />

      {/* Title */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.2}
        color={isDarkMode ? '#4fc3f7' : '#1976d2'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={isDarkMode ? '#000000' : '#ffffff'}
        fontWeight="bold"
      >
        Priority Distribution
      </Text>

      {/* Priority bars */}
      {data.map((item, index) => (
        <PriorityBar3D
          key={index}
          position={[startX + index * spacing, 0, 0]}
          priority={item.priority}
          count={item.count}
          color={item.color}
          maxCount={maxCount}
          index={index}
          isHovered={hoveredIndex === index}
          onHover={onHover}
          onClick={onClick}
          isDarkMode={isDarkMode}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={6}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
};

// Legend Component
interface LegendProps {
  data: PriorityData[];
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
}

const Legend: React.FC<LegendProps> = ({ data, hoveredIndex, onHover }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ mt: 1.5 }}>
      {data.map((item, index) => (
        <Chip
          key={index}
          icon={<Flag sx={{ fontSize: 16, color: `${item.color} !important` }} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span>{item.priority}:</span>
              <strong style={{ fontSize: '1.1em' }}>{item.count}</strong>
              <span style={{ opacity: 0.7 }}>({((item.count / total) * 100).toFixed(0)}%)</span>
            </Box>
          }
          size="medium"
          onMouseEnter={() => onHover(index)}
          onMouseLeave={() => onHover(null)}
          sx={{
            backgroundColor: alpha(item.color, hoveredIndex === index ? 0.35 : 0.15),
            borderLeft: `4px solid ${item.color}`,
            transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
        />
      ))}
    </Stack>
  );
};

// Main Component
export const PriorityDistribution3DChart: React.FC<PriorityDistribution3DChartProps> = React.memo(
  ({ data, loading = false, height = 350 }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [_selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [key, setKey] = useState(0);

    const handleReset = useCallback(() => {
      setKey((prev) => prev + 1);
      setHoveredIndex(null);
      setSelectedIndex(null);
    }, []);

    const handleClick = useCallback((index: number) => {
      setSelectedIndex((prev) => (prev === index ? null : index));
    }, []);

    // selectedIndex available for future use (e.g., detailed panel)
    void _selectedIndex;

    const canvasBackground = isDarkMode
      ? 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)'
      : 'linear-gradient(180deg, #f0f4f8 0%, #e4e8f0 100%)';

    const paperBackground = isDarkMode
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha('#1a1a2e', 0.98)} 100%)`
      : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`;

    if (loading) {
      return (
        <Paper sx={{ p: 3, height, background: paperBackground }}>
          <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={height - 100} sx={{ borderRadius: 2 }} />
        </Paper>
      );
    }

    return (
      <Paper
        elevation={isDarkMode ? 8 : 3}
        sx={{
          p: 2,
          height,
          background: paperBackground,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          border: isDarkMode ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewInAr sx={{ color: theme.palette.primary.main }} />
            <Typography
              variant="h6"
              sx={{
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
              }}
            >
              Priority Distribution (3D)
            </Typography>
          </Box>
          <MuiTooltip title="Reset View">
            <IconButton size="small" onClick={handleReset}>
              <Refresh fontSize="small" />
            </IconButton>
          </MuiTooltip>
        </Box>

        {/* 3D Canvas */}
        <Box
          sx={{
            height: height - 110,
            borderRadius: 2,
            overflow: 'hidden',
            background: canvasBackground,
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Canvas
            key={key}
            shadows
            camera={{ position: [0, 2, 4], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Scene3D
              data={data}
              hoveredIndex={hoveredIndex}
              onHover={setHoveredIndex}
              onClick={handleClick}
              isDarkMode={isDarkMode}
            />
          </Canvas>
        </Box>

        {/* Legend */}
        <Legend
          data={data}
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
        />
      </Paper>
    );
  }
);

PriorityDistribution3DChart.displayName = 'PriorityDistribution3DChart';

export default PriorityDistribution3DChart;
