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
  AttachMoney,
  TrendingUp,
} from '@mui/icons-material';

// Types
interface RevenueData {
  month: string;
  invoiced: number;
  received: number;
  pending: number;
  [key: string]: string | number;
}

interface Revenue3DChartProps {
  data: RevenueData[];
  loading?: boolean;
  height?: number;
}

// Format currency
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

// 3D Stacked Bar Component
interface StackedBar3DProps {
  position: [number, number, number];
  month: string;
  invoiced: number;
  received: number;
  pending: number;
  maxValue: number;
  index: number;
  hoveredSegment: string | null;
  onHover: (segment: string | null) => void;
  isDarkMode: boolean;
}

const StackedBar3D: React.FC<StackedBar3DProps> = ({
  position,
  month,
  invoiced,
  received,
  pending,
  maxValue,
  index,
  hoveredSegment,
  onHover,
  isDarkMode,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [animatedReceived, setAnimatedReceived] = useState(0);
  const [animatedPending, setAnimatedPending] = useState(0);

  const heightScale = 1.8;
  const receivedHeight = (received / maxValue) * heightScale;
  const pendingHeight = (pending / maxValue) * heightScale;

  const receivedColor = '#4caf50';
  const pendingColor = '#ff9800';

  const isReceivedHovered = hoveredSegment === `received-${index}`;
  const isPendingHovered = hoveredSegment === `pending-${index}`;
  const isAnyHovered = isReceivedHovered || isPendingHovered;

  useFrame(() => {
    setAnimatedReceived((prev) => THREE.MathUtils.lerp(prev, receivedHeight, 0.05));
    setAnimatedPending((prev) => THREE.MathUtils.lerp(prev, pendingHeight, 0.05));

    if (groupRef.current) {
      const targetY = isAnyHovered ? 0.05 : 0;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        0.1
      );
    }
  });

  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const textOutline = isDarkMode ? '#000000' : '#ffffff';

  return (
    <group ref={groupRef} position={position}>
      {/* Received bar (bottom) */}
      <RoundedBox
        args={[0.4, animatedReceived, 0.4]}
        position={[0, animatedReceived / 2, 0]}
        radius={0.03}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(`received-${index}`);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={receivedColor}
          metalness={0.4}
          roughness={0.3}
          emissive={receivedColor}
          emissiveIntensity={isReceivedHovered ? 0.5 : 0.15}
        />
      </RoundedBox>

      {/* Pending bar (top) */}
      <RoundedBox
        args={[0.4, animatedPending, 0.4]}
        position={[0, animatedReceived + animatedPending / 2, 0]}
        radius={0.03}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(`pending-${index}`);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={pendingColor}
          metalness={0.4}
          roughness={0.3}
          emissive={pendingColor}
          emissiveIntensity={isPendingHovered ? 0.5 : 0.15}
        />
      </RoundedBox>

      {/* Glowing top */}
      <mesh position={[0, animatedReceived + animatedPending, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 16]} />
        <meshStandardMaterial
          color={pendingColor}
          emissive={pendingColor}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Total value on top */}
      <Text
        position={[0, animatedReceived + animatedPending + 0.2, 0]}
        fontSize={0.15}
        color={isDarkMode ? '#4fc3f7' : '#1976d2'}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.015}
        outlineColor={textOutline}
        fontWeight="bold"
      >
        {formatCurrency(invoiced)}
      </Text>

      {/* Month label */}
      <Text
        position={[0, -0.15, 0]}
        fontSize={0.14}
        color={textColor}
        anchorX="center"
        anchorY="top"
        outlineWidth={0.012}
        outlineColor={textOutline}
        fontWeight="bold"
      >
        {month}
      </Text>

      {/* Hover tooltip */}
      {isAnyHovered && (
        <Html position={[0, animatedReceived + animatedPending + 0.6, 0]} center>
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
              border: `3px solid ${isReceivedHovered ? receivedColor : pendingColor}`,
              minWidth: '160px',
            }}
          >
            <div style={{ color: '#1976d2', marginBottom: '8px', fontSize: '16px' }}>
              {month}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Invoiced:</span>
              <strong>{formatCurrency(invoiced)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: receivedColor }}>
              <span>Received:</span>
              <strong>{formatCurrency(received)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: pendingColor }}>
              <span>Pending:</span>
              <strong>{formatCurrency(pending)}</strong>
            </div>
          </Box>
        </Html>
      )}
    </group>
  );
};

// Scene Component
interface Scene3DProps {
  data: RevenueData[];
  hoveredSegment: string | null;
  onHover: (segment: string | null) => void;
  isDarkMode: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({
  data,
  hoveredSegment,
  onHover,
  isDarkMode,
}) => {
  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.invoiced)),
    [data]
  );
  const spacing = 0.7;
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
      <pointLight position={[-3, 3, 3]} intensity={0.4} color="#4caf50" />
      <pointLight position={[3, 3, -3]} intensity={0.4} color="#ff9800" />

      <Environment preset={isDarkMode ? 'night' : 'studio'} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[6, 3]} />
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
        args={[6, 12, isDarkMode ? '#333366' : '#aaaacc', isDarkMode ? '#222244' : '#ccccdd']}
        position={[0, 0, 0]}
      />

      {/* Title */}
      <Text
        position={[0, 2.4, 0]}
        fontSize={0.2}
        color={isDarkMode ? '#4fc3f7' : '#1976d2'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={isDarkMode ? '#000000' : '#ffffff'}
        fontWeight="bold"
      >
        Revenue Overview
      </Text>

      {/* Stacked bars */}
      {data.map((item, index) => (
        <StackedBar3D
          key={index}
          position={[startX + index * spacing, 0, 0]}
          month={item.month}
          invoiced={item.invoiced}
          received={item.received}
          pending={item.pending}
          maxValue={maxValue}
          index={index}
          hoveredSegment={hoveredSegment}
          onHover={onHover}
          isDarkMode={isDarkMode}
        />
      ))}

      {/* Legend in 3D */}
      <group position={[startX - 0.5, 1.8, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshStandardMaterial color="#4caf50" />
        </mesh>
        <Text
          position={[0.15, 0, 0]}
          fontSize={0.1}
          color={isDarkMode ? '#aaaaaa' : '#666666'}
          anchorX="left"
          anchorY="middle"
        >
          Received
        </Text>

        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshStandardMaterial color="#ff9800" />
        </mesh>
        <Text
          position={[0.15, -0.2, 0]}
          fontSize={0.1}
          color={isDarkMode ? '#aaaaaa' : '#666666'}
          anchorX="left"
          anchorY="middle"
        >
          Pending
        </Text>
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate
        autoRotateSpeed={0.2}
      />
    </>
  );
};

// Summary Component
interface SummaryProps {
  data: RevenueData[];
}

const Summary: React.FC<SummaryProps> = ({ data }) => {
  const theme = useTheme();
  const totalInvoiced = data.reduce((sum, item) => sum + item.invoiced, 0);
  const totalReceived = data.reduce((sum, item) => sum + item.received, 0);
  const totalPending = data.reduce((sum, item) => sum + item.pending, 0);
  const collectionRate = Math.round((totalReceived / totalInvoiced) * 100);

  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center" sx={{ mt: 1.5 }}>
      <Chip
        icon={<AttachMoney sx={{ fontSize: 18, color: `${theme.palette.primary.main} !important` }} />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span>Invoiced:</span>
            <strong style={{ fontSize: '1.1em' }}>{formatCurrency(totalInvoiced)}</strong>
          </Box>
        }
        size="medium"
        sx={{
          backgroundColor: alpha(theme.palette.primary.main, 0.15),
          borderLeft: `4px solid ${theme.palette.primary.main}`,
        }}
      />
      <Chip
        icon={<TrendingUp sx={{ fontSize: 18, color: '#4caf50 !important' }} />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span>Received:</span>
            <strong style={{ fontSize: '1.1em', color: '#4caf50' }}>{formatCurrency(totalReceived)}</strong>
          </Box>
        }
        size="medium"
        sx={{
          backgroundColor: alpha('#4caf50', 0.15),
          borderLeft: '4px solid #4caf50',
        }}
      />
      <Chip
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span>Pending:</span>
            <strong style={{ fontSize: '1.1em', color: '#ff9800' }}>{formatCurrency(totalPending)}</strong>
          </Box>
        }
        size="medium"
        sx={{
          backgroundColor: alpha('#ff9800', 0.15),
          borderLeft: '4px solid #ff9800',
        }}
      />
      <Chip
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span>Collection:</span>
            <strong style={{ fontSize: '1.1em', color: collectionRate >= 80 ? '#4caf50' : '#ff9800' }}>
              {collectionRate}%
            </strong>
          </Box>
        }
        size="medium"
        sx={{
          backgroundColor: alpha(collectionRate >= 80 ? '#4caf50' : '#ff9800', 0.15),
          borderLeft: `4px solid ${collectionRate >= 80 ? '#4caf50' : '#ff9800'}`,
        }}
      />
    </Stack>
  );
};

// Main Component
export const Revenue3DChart: React.FC<Revenue3DChartProps> = React.memo(
  ({ data, loading = false, height = 400 }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
    const [key, setKey] = useState(0);

    const handleReset = useCallback(() => {
      setKey((prev) => prev + 1);
      setHoveredSegment(null);
    }, []);

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
              Revenue Overview (3D)
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
            height: height - 130,
            borderRadius: 2,
            overflow: 'hidden',
            background: canvasBackground,
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Canvas
            key={key}
            shadows
            camera={{ position: [0, 2.5, 5], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Scene3D
              data={data}
              hoveredSegment={hoveredSegment}
              onHover={setHoveredSegment}
              isDarkMode={isDarkMode}
            />
          </Canvas>
        </Box>

        {/* Summary */}
        <Summary data={data} />
      </Paper>
    );
  }
);

Revenue3DChart.displayName = 'Revenue3DChart';

export default Revenue3DChart;
