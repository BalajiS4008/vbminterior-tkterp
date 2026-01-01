import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Html, Environment, Float } from '@react-three/drei';
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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  ThreeDRotation,
  ViewInAr,
  PieChart as PieChartIcon,
  Refresh,
} from '@mui/icons-material';

// Types
interface TicketStatusData {
  status: string;
  count: number;
  color: string;
  [key: string]: string | number;
}

interface TicketStatus3DChartProps {
  data: TicketStatusData[];
  loading?: boolean;
  height?: number;
}

// 3D Pie Slice Component
interface PieSlice3DProps {
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  height: number;
  color: string;
  status: string;
  count: number;
  total: number;
  index: number;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  isDarkMode: boolean;
}

const PieSlice3D: React.FC<PieSlice3DProps> = ({
  startAngle,
  endAngle,
  innerRadius,
  outerRadius,
  height,
  color,
  status,
  count,
  total,
  index,
  isHovered,
  onHover,
  onClick,
  isDarkMode,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create the 3D pie slice geometry
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const segments = 32;
    const angleStep = (endAngle - startAngle) / segments;

    // Start at inner radius
    shape.moveTo(
      Math.cos(startAngle) * innerRadius,
      Math.sin(startAngle) * innerRadius
    );

    // Draw outer arc
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + angleStep * i;
      shape.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
    }

    // Draw inner arc (reverse)
    for (let i = segments; i >= 0; i--) {
      const angle = startAngle + angleStep * i;
      shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    }

    shape.closePath();

    const extrudeSettings = {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [startAngle, endAngle, innerRadius, outerRadius, height]);

  // Animation
  useFrame((state) => {
    if (meshRef.current) {
      const targetY = isHovered ? 0.3 : 0;
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        0.1
      );

      // Subtle floating animation
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2 + index) * 0.01;
    }
  });

  const percentage = ((count / total) * 100).toFixed(1);
  const midAngle = (startAngle + endAngle) / 2;
  const labelRadius = outerRadius + 0.4;
  const labelX = Math.cos(midAngle) * labelRadius;
  const labelZ = Math.sin(midAngle) * labelRadius;

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(index);
    document.body.style.cursor = 'pointer';
  }, [index, onHover]);

  const handlePointerOut = useCallback(() => {
    onHover(null);
    document.body.style.cursor = 'auto';
  }, [onHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(index);
  }, [index, onClick]);

  const textOutlineColor = isDarkMode ? '#000000' : '#ffffff';

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={isHovered ? 0.3 : 0.1}
        />
      </mesh>

      {/* 3D Label */}
      {isHovered && (
        <Html
          position={[labelX, height + 0.5, labelZ]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <Box
            sx={{
              background: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              color: isDarkMode ? 'white' : '#333',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: isDarkMode
                ? '0 4px 20px rgba(0,0,0,0.5)'
                : '0 4px 20px rgba(0,0,0,0.2)',
              border: `3px solid ${color}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ color, marginBottom: '6px', fontSize: '18px' }}>{status}</div>
            <div style={{ fontSize: '20px' }}>Count: <strong>{count}</strong></div>
            <div style={{ fontSize: '16px', opacity: 0.8 }}>({percentage}%)</div>
          </Box>
        </Html>
      )}

      {/* Count and percentage text - LARGER */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <Text
          position={[labelX, height / 2 + 0.15, labelZ]}
          fontSize={0.28}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor={textOutlineColor}
          fontWeight="bold"
        >
          {count}
        </Text>
        <Text
          position={[labelX, height / 2 - 0.12, labelZ]}
          fontSize={0.16}
          color={isDarkMode ? '#ffffff' : '#333333'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor={textOutlineColor}
        >
          {percentage}%
        </Text>
      </Float>
    </group>
  );
};

// 3D Bar Chart Alternative View
interface Bar3DProps {
  position: [number, number, number];
  height: number;
  color: string;
  status: string;
  count: number;
  total: number;
  index: number;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  isDarkMode: boolean;
}

const Bar3D: React.FC<Bar3DProps> = ({
  position,
  height,
  color,
  status,
  count,
  total,
  index,
  isHovered,
  onHover,
  onClick,
  isDarkMode,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [animatedHeight, setAnimatedHeight] = useState(0);

  useFrame(() => {
    // Animate height on mount
    setAnimatedHeight((prev) => THREE.MathUtils.lerp(prev, height, 0.05));

    if (meshRef.current) {
      const targetScale = isHovered ? 1.1 : 1;
      meshRef.current.scale.x = THREE.MathUtils.lerp(
        meshRef.current.scale.x,
        targetScale,
        0.1
      );
      meshRef.current.scale.z = THREE.MathUtils.lerp(
        meshRef.current.scale.z,
        targetScale,
        0.1
      );
    }
  });

  const percentage = ((count / total) * 100).toFixed(1);
  const textOutlineColor = isDarkMode ? '#000000' : '#ffffff';
  const labelColor = isDarkMode ? '#ffffff' : '#333333';

  return (
    <group position={position}>
      {/* Bar */}
      <mesh
        ref={meshRef}
        position={[0, animatedHeight / 2, 0]}
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
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.5, animatedHeight, 0.5]} />
        <meshStandardMaterial
          color={color}
          metalness={0.4}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={isHovered ? 0.4 : 0.1}
        />
      </mesh>

      {/* Glowing top cap */}
      <mesh position={[0, animatedHeight, 0]}>
        <boxGeometry args={[0.52, 0.03, 0.52]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Status label - LARGER */}
      <Text
        position={[0, -0.25, 0]}
        fontSize={0.18}
        color={labelColor}
        anchorX="center"
        anchorY="top"
        maxWidth={1}
        outlineWidth={0.015}
        outlineColor={textOutlineColor}
        fontWeight="bold"
      >
        {status}
      </Text>

      {/* Value on top - MUCH LARGER */}
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <Text
          position={[0, animatedHeight + 0.25, 0]}
          fontSize={0.3}
          color={color}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.03}
          outlineColor={textOutlineColor}
          fontWeight="bold"
        >
          {count}
        </Text>
      </Float>

      {/* Hover tooltip */}
      {isHovered && (
        <Html position={[0, animatedHeight + 0.6, 0]} center>
          <Box
            sx={{
              background: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              color: isDarkMode ? 'white' : '#333',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: isDarkMode
                ? '0 4px 20px rgba(0,0,0,0.5)'
                : '0 4px 20px rgba(0,0,0,0.2)',
              border: `3px solid ${color}`,
            }}
          >
            <div style={{ color, fontSize: '18px', marginBottom: '4px' }}>{status}</div>
            <div style={{ fontSize: '20px' }}>Count: <strong>{count}</strong></div>
            <div style={{ fontSize: '16px', opacity: 0.8 }}>Share: {percentage}%</div>
          </Box>
        </Html>
      )}
    </group>
  );
};

// Animated Center Sphere
interface CenterSphereProps {
  total: number;
  isDarkMode: boolean;
}

const CenterSphere: React.FC<CenterSphereProps> = ({ total, isDarkMode }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const textOutline = isDarkMode ? '#000000' : '#ffffff';

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={isDarkMode ? '#ffffff' : '#666666'}
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={1}
        />
      </mesh>
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.22}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.025}
        outlineColor={textOutline}
        fontWeight="bold"
      >
        {`Total`}
      </Text>
      <Text
        position={[0, 0.35, 0]}
        fontSize={0.28}
        color={isDarkMode ? '#4fc3f7' : '#1976d2'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.025}
        outlineColor={textOutline}
        fontWeight="bold"
      >
        {total}
      </Text>
    </group>
  );
};

// Ground plane with grid
interface GroundProps {
  isDarkMode: boolean;
}

const Ground: React.FC<GroundProps> = ({ isDarkMode }) => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[3, 64]} />
      <meshStandardMaterial
        color={isDarkMode ? '#1a1a2e' : '#e8e8f0'}
        metalness={0.5}
        roughness={0.8}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
};

// Scene for Pie Chart view
interface PieScene3DProps {
  data: TicketStatusData[];
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  isDarkMode: boolean;
}

const PieScene3D: React.FC<PieScene3DProps> = ({
  data,
  hoveredIndex,
  onHover,
  onClick,
  isDarkMode,
}) => {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data]);

  const slices = useMemo(() => {
    let currentAngle = 0;
    return data.map((item, index) => {
      const sliceAngle = (item.count / total) * Math.PI * 2;
      const slice = {
        ...item,
        startAngle: currentAngle,
        endAngle: currentAngle + sliceAngle,
        index,
      };
      currentAngle += sliceAngle;
      return slice;
    });
  }, [data, total]);

  return (
    <>
      <ambientLight intensity={isDarkMode ? 0.4 : 0.6} />
      <spotLight
        position={[5, 10, 5]}
        angle={0.3}
        penumbra={1}
        intensity={isDarkMode ? 1 : 1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4fc3f7" />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#f48fb1" />

      <Environment preset={isDarkMode ? 'city' : 'studio'} />

      <Ground isDarkMode={isDarkMode} />
      <CenterSphere total={total} isDarkMode={isDarkMode} />

      {slices.map((slice) => (
        <PieSlice3D
          key={slice.index}
          startAngle={slice.startAngle}
          endAngle={slice.endAngle}
          innerRadius={0.5}
          outerRadius={1.5}
          height={0.3 + (slice.count / total) * 0.5}
          color={slice.color}
          status={slice.status}
          count={slice.count}
          total={total}
          index={slice.index}
          isHovered={hoveredIndex === slice.index}
          onHover={onHover}
          onClick={onClick}
          isDarkMode={isDarkMode}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
};

// Scene for Bar Chart view
interface BarScene3DProps {
  data: TicketStatusData[];
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  isDarkMode: boolean;
}

const BarScene3D: React.FC<BarScene3DProps> = ({
  data,
  hoveredIndex,
  onHover,
  onClick,
  isDarkMode,
}) => {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data]);
  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count)), [data]);

  return (
    <>
      <ambientLight intensity={isDarkMode ? 0.4 : 0.6} />
      <spotLight
        position={[5, 10, 5]}
        angle={0.3}
        penumbra={1}
        intensity={isDarkMode ? 1 : 1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4fc3f7" />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#f48fb1" />

      <Environment preset={isDarkMode ? 'city' : 'studio'} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial
          color={isDarkMode ? '#1a1a2e' : '#e8e8f0'}
          metalness={0.5}
          roughness={0.8}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Grid lines */}
      <gridHelper
        args={[6, 12, isDarkMode ? '#333366' : '#aaaacc', isDarkMode ? '#222244' : '#ccccdd']}
        position={[0, 0, 0]}
      />

      {data.map((item, index) => {
        const xPos = (index - (data.length - 1) / 2) * 0.9;
        const normalizedHeight = (item.count / maxCount) * 2;

        return (
          <Bar3D
            key={index}
            position={[xPos, 0, 0]}
            height={normalizedHeight}
            color={item.color}
            status={item.status}
            count={item.count}
            total={total}
            index={index}
            isHovered={hoveredIndex === index}
            onHover={onHover}
            onClick={onClick}
            isDarkMode={isDarkMode}
          />
        );
      })}

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
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
  data: TicketStatusData[];
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
}

const Legend: React.FC<LegendProps> = ({ data, hoveredIndex, onHover, onClick }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ mt: 1.5 }}>
      {data.map((item, index) => (
        <Chip
          key={index}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <strong>{item.status}:</strong>
              <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{item.count}</span>
              <span style={{ opacity: 0.7 }}>({((item.count / total) * 100).toFixed(0)}%)</span>
            </Box>
          }
          size="medium"
          onClick={() => onClick(index)}
          onMouseEnter={() => onHover(index)}
          onMouseLeave={() => onHover(null)}
          sx={{
            backgroundColor: alpha(item.color, hoveredIndex === index ? 0.35 : 0.2),
            borderLeft: `5px solid ${item.color}`,
            fontWeight: hoveredIndex === index ? 'bold' : 'normal',
            transform: hoveredIndex === index ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            py: 0.5,
            '&:hover': {
              backgroundColor: alpha(item.color, 0.35),
            },
          }}
        />
      ))}
    </Stack>
  );
};

// Main Component
export const TicketStatus3DChart: React.FC<TicketStatus3DChartProps> = React.memo(
  ({ data, loading = false, height = 400 }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'pie' | 'bar'>('pie');
    const [key, setKey] = useState(0);

    const handleViewChange = useCallback(
      (_: React.MouseEvent<HTMLElement>, newView: 'pie' | 'bar' | null) => {
        if (newView) {
          setViewMode(newView);
        }
      },
      []
    );

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
              Ticket Status Distribution (3D)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  padding: '4px 8px',
                },
              }}
            >
              <ToggleButton value="pie">
                <MuiTooltip title="3D Pie Chart">
                  <PieChartIcon fontSize="small" />
                </MuiTooltip>
              </ToggleButton>
              <ToggleButton value="bar">
                <MuiTooltip title="3D Bar Chart">
                  <ThreeDRotation fontSize="small" />
                </MuiTooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <MuiTooltip title="Reset View">
              <IconButton size="small" onClick={handleReset}>
                <Refresh fontSize="small" />
              </IconButton>
            </MuiTooltip>
          </Box>
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
            camera={{ position: [3, 3, 3], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
          >
            {viewMode === 'pie' ? (
              <PieScene3D
                data={data}
                hoveredIndex={hoveredIndex}
                onHover={setHoveredIndex}
                onClick={handleClick}
                isDarkMode={isDarkMode}
              />
            ) : (
              <BarScene3D
                data={data}
                hoveredIndex={hoveredIndex}
                onHover={setHoveredIndex}
                onClick={handleClick}
                isDarkMode={isDarkMode}
              />
            )}
          </Canvas>
        </Box>

        {/* Legend */}
        <Legend
          data={data}
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
          onClick={handleClick}
        />

        {/* Selected item detail */}
        {selectedIndex !== null && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 70,
              left: '50%',
              transform: 'translateX(-50%)',
              background: alpha(data[selectedIndex].color, isDarkMode ? 0.25 : 0.15),
              border: `2px solid ${data[selectedIndex].color}`,
              borderRadius: 2,
              px: 2.5,
              py: 1,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: isDarkMode ? 'white' : theme.palette.text.primary,
                fontWeight: 'bold',
                fontSize: '1.1rem',
              }}
            >
              Selected: {data[selectedIndex].status} - <strong>{data[selectedIndex].count}</strong> tickets
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }
);

TicketStatus3DChart.displayName = 'TicketStatus3DChart';

export default TicketStatus3DChart;
