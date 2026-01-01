import React from 'react';
import { Box, Typography, alpha } from '@mui/material';

interface WelcomeBannerProps {
  userName: string;
  subtitle?: string;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  userName,
  subtitle = 'Ready to start your day with some pitch decks?',
}) => {
  return (
    <Box
      sx={{
        position: 'relative',
        background: 'linear-gradient(135deg, #e8e0f0 0%, #d4c8e8 50%, #c9b8e0 100%)',
        borderRadius: 3,
        p: { xs: 2, sm: 3 },
        mb: 3,
        minHeight: { xs: 120, sm: 140 },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Text Content */}
      <Box sx={{ zIndex: 1, maxWidth: { xs: '60%', sm: '50%' } }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#2d2d2d',
            mb: 0.5,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          Hi, {userName}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: alpha('#2d2d2d', 0.7),
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      {/* Illustration */}
      <Box
        sx={{
          position: 'absolute',
          right: { xs: -20, sm: 20, md: 40 },
          bottom: 0,
          width: { xs: 140, sm: 180, md: 200 },
          height: { xs: 120, sm: 140, md: 160 },
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {/* SVG Illustration of woman with laptop */}
        <svg
          viewBox="0 0 200 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Desk/Table */}
          <ellipse cx="100" cy="170" rx="80" ry="8" fill="#b8a8d0" opacity="0.4" />

          {/* Coffee Cup */}
          <rect x="45" y="140" width="18" height="20" rx="2" fill="#ffffff" />
          <rect x="43" y="138" width="22" height="4" rx="1" fill="#e0e0e0" />
          <path d="M63 145 Q70 148 63 155" stroke="#e0e0e0" strokeWidth="2" fill="none" />

          {/* Laptop */}
          <rect x="70" y="125" width="70" height="45" rx="3" fill="#4a4a5a" />
          <rect x="73" y="128" width="64" height="38" rx="2" fill="#7ecbf5" />
          <rect x="55" y="168" width="100" height="5" rx="1" fill="#5a5a6a" />

          {/* Screen Content - simple lines */}
          <rect x="78" y="133" width="35" height="3" rx="1" fill="#ffffff" opacity="0.8" />
          <rect x="78" y="140" width="50" height="2" rx="1" fill="#ffffff" opacity="0.5" />
          <rect x="78" y="146" width="45" height="2" rx="1" fill="#ffffff" opacity="0.5" />
          <rect x="78" y="152" width="40" height="2" rx="1" fill="#ffffff" opacity="0.5" />

          {/* Woman's Body - Yellow Cardigan */}
          <path
            d="M85 95 Q75 100 70 130 L80 135 Q85 115 90 105 Z"
            fill="#f5c842"
          />
          <path
            d="M115 95 Q125 100 130 130 L120 135 Q115 115 110 105 Z"
            fill="#f5c842"
          />
          <path
            d="M85 95 Q100 90 115 95 Q115 110 115 125 Q100 130 85 125 Q85 110 85 95"
            fill="#f5c842"
          />

          {/* Inner shirt */}
          <path
            d="M92 95 Q100 93 108 95 L108 115 Q100 118 92 115 Z"
            fill="#ffffff"
          />

          {/* Neck */}
          <rect x="95" y="75" width="10" height="20" rx="5" fill="#f5d0c5" />

          {/* Head */}
          <ellipse cx="100" cy="55" rx="22" ry="25" fill="#f5d0c5" />

          {/* Hair */}
          <path
            d="M78 50 Q75 30 100 25 Q125 30 122 50 Q125 60 120 70 Q110 55 100 55 Q90 55 80 70 Q75 60 78 50"
            fill="#2d2340"
          />
          <path
            d="M78 50 Q82 65 80 80 Q75 85 72 75 Q70 60 78 50"
            fill="#2d2340"
          />
          <path
            d="M122 50 Q118 65 120 80 Q125 85 128 75 Q130 60 122 50"
            fill="#2d2340"
          />

          {/* Face */}
          {/* Eyes closed - relaxed look */}
          <path d="M90 52 Q93 50 96 52" stroke="#2d2340" strokeWidth="1.5" fill="none" />
          <path d="M104 52 Q107 50 110 52" stroke="#2d2340" strokeWidth="1.5" fill="none" />

          {/* Slight smile */}
          <path d="M95 65 Q100 68 105 65" stroke="#c9a090" strokeWidth="1.5" fill="none" />

          {/* Blush */}
          <ellipse cx="87" cy="60" rx="4" ry="2" fill="#f0b0a0" opacity="0.5" />
          <ellipse cx="113" cy="60" rx="4" ry="2" fill="#f0b0a0" opacity="0.5" />

          {/* Arms */}
          <path
            d="M70 130 Q65 140 75 155 L80 153 Q75 140 78 132"
            fill="#f5c842"
          />
          <path
            d="M130 130 Q135 140 125 155 L120 153 Q125 140 122 132"
            fill="#f5c842"
          />

          {/* Hands */}
          <ellipse cx="77" cy="157" rx="6" ry="5" fill="#f5d0c5" />
          <ellipse cx="123" cy="157" rx="6" ry="5" fill="#f5d0c5" />
        </svg>
      </Box>
    </Box>
  );
};

export default WelcomeBanner;
