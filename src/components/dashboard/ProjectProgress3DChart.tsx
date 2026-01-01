import React, { useRef, useState, useCallback } from 'react';
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
  LinearProgress,
} from '@mui/material';
import {
  ViewInAr,
  Refresh,
  TrendingUp,
} from '@mui/icons-material';

// Types
interface ProjectProgressData {
  name: string;
  progress: number;
  target: number;
  [key: string]: string | number;
}

interface ProjectProgress3DChartProps {
  data: ProjectProgressData[];
  loading?: boolean;
  height?: number;
}

// Color helpers
const getProgressColor = (progress: number, target: number): string => {
  const ratio = progress / target;
  if (ratio >= 0.9) return '#4caf50'; // Green - on track or ahead
  if (ratio >= 0.7) return '#ff9800'; // Orange - slightly behind
  if (ratio >= 0.5) return '#f57c00'; // Dark orange - behind
  return '#f44336'; // Red - significantly behind
};

// 3D Progress Bar Component
interface ProgressBar3DProps {
  position: [number, number, number];
  name: string;
  progress: number;
  target: number;
  index: number;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  isDarkMode: boolean;
  maxWidth: number;
}

const ProgressBar3D: React.FC<ProgressBar3DProps> = ({
  position,
  name,
  progress,
  target,
  index,
  isHovered,
  onHover,
  onClick,
  isDarkMode,
  maxWidth,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const progressMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const progressColor = getProgressColor(progress, target);
  const progressWidth = (progress / 100) * maxWidth;
  const targetWidth = (target / 100) * maxWidth;

  useFrame(() => {
    // Animate progress bar width
    setAnimatedProgress((prev) => THREE.MathUtils.lerp(prev, progressWidth, 0.05));

    if (groupRef.current) {
      // Hover animation - slight lift
      const targetY = isHovered ? position[1] + 0.1 : position[1];
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        0.1
      );
    }

    if (progressMaterialRef.current) {
      // Pulse effect when hovered
      const targetEmissive = isHovered ? 0.4 : 0.15;
      progressMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        progressMaterialRef.current.emissiveIntensity,
        targetEmissive,
        0.1
      );
    }
  });

  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const textOutline = isDarkMode ? '#000000' : '#ffffff';
  const bgBarColor = isDarkMode ? '#2a2a3e' : '#e0e0e0';

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
      {/* Project Name */}
      <Text
        position={[-maxWidth / 2 - 0.15, 0, 0]}
        fontSize={0.16}
        color={textColor}
        anchorX="right"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor={textOutline}
        fontWeight="bold"
        maxWidth={1.8}
        textAlign="right"
      >
        {name}
      </Text>

      {/* Background bar (target) */}
      <RoundedBox
        args={[targetWidth, 0.25, 0.15]}
        position={[targetWidth / 2 - maxWidth / 2, 0, 0]}
        radius={0.05}
        smoothness={4}
      >
        <meshStandardMaterial
          color={bgBarColor}
          metalness={0.2}
          roughness={0.8}
          transparent
          opacity={0.6}
        />
      </RoundedBox>

      {/* Progress bar */}
      {animatedProgress > 0.01 && (
        <RoundedBox
          args={[animatedProgress, 0.28, 0.18]}
          position={[animatedProgress / 2 - maxWidth / 2, 0, 0.02]}
          radius={0.06}
          smoothness={4}
        >
          <meshStandardMaterial
            ref={progressMaterialRef}
            color={progressColor}
            metalness={0.4}
            roughness={0.3}
            emissive={progressColor}
            emissiveIntensity={0.15}
          />
        </RoundedBox>
      )}

      {/* Progress percentage */}
      <Text
        position={[maxWidth / 2 + 0.15, 0, 0]}
        fontSize={0.22}
        color={progressColor}
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={textOutline}
        fontWeight="bold"
      >
        {progress}%
      </Text>

      {/* Target indicator line */}
      <mesh position={[targetWidth - maxWidth / 2, 0, 0.1]}>
        <boxGeometry args={[0.02, 0.35, 0.02]} />
        <meshStandardMaterial
          color={isDarkMode ? '#ffffff' : '#666666'}
          emissive={isDarkMode ? '#ffffff' : '#666666'}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Hover tooltip */}
      {isHovered && (
        <Html position={[0, 0.5, 0]} center>
          <Box
            sx={{
              background: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              color: isDarkMode ? 'white' : '#333',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: isDarkMode
                ? '0 4px 20px rgba(0,0,0,0.5)'
                : '0 4px 20px rgba(0,0,0,0.2)',
              border: `3px solid ${progressColor}`,
              minWidth: '180px',
            }}
          >
            <div style={{ color: progressColor, marginBottom: '8px', fontSize: '16px' }}>
              {name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Progress:</span>
              <strong style={{ color: progressColor, fontSize: '18px' }}>{progress}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Target:</span>
              <strong>{target}%</strong>
            </div>
            <div style={{
              marginTop: '8px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: alpha(progressColor, 0.2),
              textAlign: 'center',
              fontSize: '12px'
            }}>
              {progress >= target ? 'On Track' : progress >= target * 0.8 ? 'Slightly Behind' : 'Behind Schedule'}
            </div>
          </Box>
        </Html>
      )}
    </group>
  );
};

// 3D Scene
interface Scene3DProps {
  data: ProjectProgressData[];
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
  const barSpacing = 0.55;
  const maxWidth = 1.8;
  const startY = ((data.length - 1) * barSpacing) / 2;
  const xOffset = 0.6; // Shift bars to the right to make room for names

  return (
    <>
      <ambientLight intensity={isDarkMode ? 0.5 : 0.7} />
      <spotLight
        position={[5, 10, 5]}
        angle={0.3}
        penumbra={1}
        intensity={isDarkMode ? 0.8 : 1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-3, 3, 3]} intensity={0.4} color="#4fc3f7" />
      <pointLight position={[3, 3, -3]} intensity={0.4} color="#f48fb1" />

      <Environment preset={isDarkMode ? 'night' : 'studio'} />

      {/* Background panel */}
      <mesh position={[xOffset, 0, -0.2]} receiveShadow>
        <planeGeometry args={[5, data.length * barSpacing + 1]} />
        <meshStandardMaterial
          color={isDarkMode ? '#1a1a2e' : '#f5f5f5'}
          metalness={0.1}
          roughness={0.9}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Title */}
      <Text
        position={[xOffset, startY + 0.45, 0]}
        fontSize={0.18}
        color={isDarkMode ? '#4fc3f7' : '#1976d2'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={isDarkMode ? '#000000' : '#ffffff'}
        fontWeight="bold"
      >
        Project Progress Overview
      </Text>

      {/* Progress bars */}
      {data.map((item, index) => (
        <ProgressBar3D
          key={index}
          position={[xOffset, startY - index * barSpacing, 0]}
          name={item.name}
          progress={item.progress}
          target={item.target}
          index={index}
          isHovered={hoveredIndex === index}
          onHover={onHover}
          onClick={onClick}
          isDarkMode={isDarkMode}
          maxWidth={maxWidth}
        />
      ))}

      {/* Legend */}
      <group position={[xOffset, -startY - 0.6, 0]}>
        <mesh position={[-0.8, 0, 0]}>
          <boxGeometry args={[0.15, 0.08, 0.05]} />
          <meshStandardMaterial color="#4caf50" />
        </mesh>
        <Text
          position={[-0.6, 0, 0]}
          fontSize={0.1}
          color={isDarkMode ? '#aaaaaa' : '#666666'}
          anchorX="left"
          anchorY="middle"
        >
          On Track
        </Text>

        <mesh position={[0.1, 0, 0]}>
          <boxGeometry args={[0.15, 0.08, 0.05]} />
          <meshStandardMaterial color="#ff9800" />
        </mesh>
        <Text
          position={[0.3, 0, 0]}
          fontSize={0.1}
          color={isDarkMode ? '#aaaaaa' : '#666666'}
          anchorX="left"
          anchorY="middle"
        >
          Behind
        </Text>

        <mesh position={[1.0, 0, 0]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color={isDarkMode ? '#ffffff' : '#666666'} />
        </mesh>
        <Text
          position={[1.15, 0, 0]}
          fontSize={0.1}
          color={isDarkMode ? '#aaaaaa' : '#666666'}
          anchorX="left"
          anchorY="middle"
        >
          Target
        </Text>
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
      />
    </>
  );
};

// Summary Stats Component
interface SummaryStatsProps {
  data: ProjectProgressData[];
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ data }) => {
  const theme = useTheme();

  const avgProgress = Math.round(data.reduce((sum, item) => sum + item.progress, 0) / data.length);
  const onTrack = data.filter(item => item.progress >= item.target * 0.9).length;
  const behind = data.length - onTrack;

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="center"
      sx={{ mt: 1 }}
    >
      <Chip
        icon={<TrendingUp sx={{ fontSize: 18 }} />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span>Avg:</span>
            <strong style={{ fontSize: '1.1em' }}>{avgProgress}%</strong>
          </Box>
        }
        size="medium"
        sx={{
          backgroundColor: alpha(theme.palette.primary.main, 0.15),
          borderLeft: `4px solid ${theme.palette.primary.main}`,
        }}
      />
      <Chip
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span>On Track:</span>
            <strong style={{ color: '#4caf50', fontSize: '1.1em' }}>{onTrack}</strong>
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
            <span>Behind:</span>
            <strong style={{ color: '#ff9800', fontSize: '1.1em' }}>{behind}</strong>
          </Box>
        }
        size="medium"
        sx={{
          backgroundColor: alpha('#ff9800', 0.15),
          borderLeft: '4px solid #ff9800',
        }}
      />
    </Stack>
  );
};

// Main Component
export const ProjectProgress3DChart: React.FC<ProjectProgress3DChartProps> = React.memo(
  ({ data, loading = false, height = 400 }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [key, setKey] = useState(0);

    const handleReset = useCallback(() => {
      setKey((prev) => prev + 1);
      setHoveredIndex(null);
      setSelectedIndex(null);
    }, []);

    const handleClick = useCallback((index: number) => {
      setSelectedIndex((prev) => (prev === index ? null : index));
    }, []);

    // Theme-aware background colors
    const canvasBackground = isDarkMode
      ? 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)'
      : 'linear-gradient(180deg, #f0f4f8 0%, #e4e8f0 100%)';

    const paperBackground = isDarkMode
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha('#1a1a2e', 0.98)} 100%)`
      : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`;

    if (loading) {
      return (
        <Paper
          sx={{
            p: 3,
            height,
            background: paperBackground,
          }}
        >
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
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
              Project Progress (3D)
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
            border: isDarkMode
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Canvas
            key={key}
            shadows
            camera={{ position: [0.5, 0, 4], fov: 45 }}
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

        {/* Summary Stats */}
        <SummaryStats data={data} />

        {/* Selected project detail */}
        {selectedIndex !== null && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 70,
              left: '50%',
              transform: 'translateX(-50%)',
              background: alpha(getProgressColor(data[selectedIndex].progress, data[selectedIndex].target), isDarkMode ? 0.25 : 0.15),
              border: `2px solid ${getProgressColor(data[selectedIndex].progress, data[selectedIndex].target)}`,
              borderRadius: 2,
              px: 2.5,
              py: 1,
              minWidth: '250px',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: isDarkMode ? 'white' : theme.palette.text.primary,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              {data[selectedIndex].name}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Progress</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {data[selectedIndex].progress}% / {data[selectedIndex].target}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={data[selectedIndex].progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getProgressColor(data[selectedIndex].progress, data[selectedIndex].target),
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          </Box>
        )}
      </Paper>
    );
  }
);

ProjectProgress3DChart.displayName = 'ProjectProgress3DChart';

export default ProjectProgress3DChart;
