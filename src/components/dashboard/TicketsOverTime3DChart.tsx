import React, { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Environment, Line } from '@react-three/drei';
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
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

// Types
interface TicketsOverTimeData {
  date: string;
  created: number;
  resolved: number;
  [key: string]: string | number;
}

interface TicketsOverTime3DChartProps {
  data: TicketsOverTimeData[];
  loading?: boolean;
  height?: number;
}

// 3D Data Point Component
interface DataPoint3DProps {
  position: [number, number, number];
  value: number;
  label: string;
  color: string;
  index: number;
  type: 'created' | 'resolved';
  isHovered: boolean;
  onHover: (key: string | null) => void;
  isDarkMode: boolean;
}

const DataPoint3D: React.FC<DataPoint3DProps> = ({
  position,
  value,
  label,
  color,
  index,
  type,
  isHovered,
  onHover,
  isDarkMode,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const hoverKey = `${type}-${index}`;

  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      const floatY = Math.sin(state.clock.elapsedTime * 2 + index * 0.5) * 0.02;
      meshRef.current.position.y = position[1] + floatY;

      // Scale on hover
      const targetScale = isHovered ? 1.5 : 1;
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1)
      );
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(hoverKey);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.6 : 0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Value label on hover */}
      {isHovered && (
        <Html position={[position[0], position[1] + 0.3, position[2]]} center>
          <Box
            sx={{
              background: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              color: isDarkMode ? 'white' : '#333',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              border: `2px solid ${color}`,
            }}
          >
            <div style={{ color, marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '16px' }}>{type === 'created' ? 'Created' : 'Resolved'}: <strong>{value}</strong></div>
          </Box>
        </Html>
      )}
    </group>
  );
};

// 3D Bar for area effect
interface AreaBar3DProps {
  position: [number, number, number];
  height: number;
  color: string;
  opacity: number;
}

const AreaBar3D: React.FC<AreaBar3DProps> = ({ position, height, color, opacity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [animatedHeight, setAnimatedHeight] = useState(0);

  useFrame(() => {
    setAnimatedHeight((prev) => THREE.MathUtils.lerp(prev, height, 0.05));
  });

  return (
    <mesh ref={meshRef} position={[position[0], animatedHeight / 2, position[2]]}>
      <boxGeometry args={[0.15, animatedHeight, 0.15]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        metalness={0.3}
        roughness={0.6}
      />
    </mesh>
  );
};

// Scene Component
interface Scene3DProps {
  data: TicketsOverTimeData[];
  hoveredKey: string | null;
  onHover: (key: string | null) => void;
  isDarkMode: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({
  data,
  hoveredKey,
  onHover,
  isDarkMode,
}) => {
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.created, d.resolved))
  );
  const spacing = 0.5;
  const heightScale = 1.5;
  const startX = -((data.length - 1) * spacing) / 2;

  // Generate line points
  const createdPoints: [number, number, number][] = data.map((item, i) => [
    startX + i * spacing,
    (item.created / maxValue) * heightScale,
    0.1,
  ]);

  const resolvedPoints: [number, number, number][] = data.map((item, i) => [
    startX + i * spacing,
    (item.resolved / maxValue) * heightScale,
    -0.1,
  ]);

  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const textOutline = isDarkMode ? '#000000' : '#ffffff';
  const createdColor = '#ff9800';
  const resolvedColor = '#4caf50';

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
      <pointLight position={[-3, 3, 3]} intensity={0.4} color="#ff9800" />
      <pointLight position={[3, 3, -3]} intensity={0.4} color="#4caf50" />

      <Environment preset={isDarkMode ? 'night' : 'studio'} />

      {/* Grid floor */}
      <gridHelper
        args={[4, 8, isDarkMode ? '#333366' : '#aaaacc', isDarkMode ? '#222244' : '#ccccdd']}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />

      {/* Area bars for created */}
      {data.map((item, i) => (
        <AreaBar3D
          key={`created-bar-${i}`}
          position={[startX + i * spacing, 0, 0.1]}
          height={(item.created / maxValue) * heightScale}
          color={createdColor}
          opacity={0.3}
        />
      ))}

      {/* Area bars for resolved */}
      {data.map((item, i) => (
        <AreaBar3D
          key={`resolved-bar-${i}`}
          position={[startX + i * spacing, 0, -0.1]}
          height={(item.resolved / maxValue) * heightScale}
          color={resolvedColor}
          opacity={0.3}
        />
      ))}

      {/* Created line */}
      <Line
        points={createdPoints}
        color={createdColor}
        lineWidth={3}
      />

      {/* Resolved line */}
      <Line
        points={resolvedPoints}
        color={resolvedColor}
        lineWidth={3}
      />

      {/* Data points - Created */}
      {data.map((item, i) => (
        <DataPoint3D
          key={`created-${i}`}
          position={createdPoints[i]}
          value={item.created}
          label={item.date}
          color={createdColor}
          index={i}
          type="created"
          isHovered={hoveredKey === `created-${i}`}
          onHover={onHover}
          isDarkMode={isDarkMode}
        />
      ))}

      {/* Data points - Resolved */}
      {data.map((item, i) => (
        <DataPoint3D
          key={`resolved-${i}`}
          position={resolvedPoints[i]}
          value={item.resolved}
          label={item.date}
          color={resolvedColor}
          index={i}
          type="resolved"
          isHovered={hoveredKey === `resolved-${i}`}
          onHover={onHover}
          isDarkMode={isDarkMode}
        />
      ))}

      {/* X-axis labels */}
      {data.map((item, i) => (
        <Text
          key={`label-${i}`}
          position={[startX + i * spacing, -0.15, 0]}
          fontSize={0.12}
          color={textColor}
          anchorX="center"
          anchorY="top"
          outlineWidth={0.01}
          outlineColor={textOutline}
        >
          {item.date}
        </Text>
      ))}

      {/* Y-axis labels */}
      {[0, 0.5, 1].map((ratio, i) => (
        <Text
          key={`y-label-${i}`}
          position={[startX - 0.3, ratio * heightScale, 0]}
          fontSize={0.1}
          color={textColor}
          anchorX="right"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor={textOutline}
        >
          {Math.round(ratio * maxValue)}
        </Text>
      ))}

      {/* Title */}
      <Text
        position={[0, heightScale + 0.3, 0]}
        fontSize={0.18}
        color={isDarkMode ? '#4fc3f7' : '#1976d2'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={textOutline}
        fontWeight="bold"
      >
        Tickets Over Time
      </Text>

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
};

// Summary Component
interface SummaryProps {
  data: TicketsOverTimeData[];
}

const Summary: React.FC<SummaryProps> = ({ data }) => {
  const totalCreated = data.reduce((sum, item) => sum + item.created, 0);
  const totalResolved = data.reduce((sum, item) => sum + item.resolved, 0);
  const netChange = totalResolved - totalCreated;

  return (
    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1.5 }}>
      <Chip
        icon={<TrendingUp sx={{ fontSize: 18, color: '#ff9800 !important' }} />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span>Created:</span>
            <strong style={{ fontSize: '1.1em', color: '#ff9800' }}>{totalCreated}</strong>
          </Box>
        }
        size="medium"
        sx={{
          backgroundColor: alpha('#ff9800', 0.15),
          borderLeft: '4px solid #ff9800',
        }}
      />
      <Chip
        icon={<TrendingDown sx={{ fontSize: 18, color: '#4caf50 !important' }} />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span>Resolved:</span>
            <strong style={{ fontSize: '1.1em', color: '#4caf50' }}>{totalResolved}</strong>
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
            <span>Net:</span>
            <strong style={{
              fontSize: '1.1em',
              color: netChange >= 0 ? '#4caf50' : '#f44336'
            }}>
              {netChange >= 0 ? '+' : ''}{netChange}
            </strong>
          </Box>
        }
        size="medium"
        sx={{
          backgroundColor: alpha(netChange >= 0 ? '#4caf50' : '#f44336', 0.15),
          borderLeft: `4px solid ${netChange >= 0 ? '#4caf50' : '#f44336'}`,
        }}
      />
    </Stack>
  );
};

// Main Component
export const TicketsOverTime3DChart: React.FC<TicketsOverTime3DChartProps> = React.memo(
  ({ data, loading = false, height = 350 }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);
    const [key, setKey] = useState(0);

    const handleReset = useCallback(() => {
      setKey((prev) => prev + 1);
      setHoveredKey(null);
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
              Tickets Over Time (3D)
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
            height: height - 120,
            borderRadius: 2,
            overflow: 'hidden',
            background: canvasBackground,
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Canvas
            key={key}
            shadows
            camera={{ position: [0, 2, 3.5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Scene3D
              data={data}
              hoveredKey={hoveredKey}
              onHover={setHoveredKey}
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

TicketsOverTime3DChart.displayName = 'TicketsOverTime3DChart';

export default TicketsOverTime3DChart;
