import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
  useMediaQuery,
  Typography,
  Stack,
  Skeleton,
  alpha,
} from '@mui/material';

export interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row: T) => React.ReactNode;
  hide?: 'mobile' | 'tablet' | 'never';
}

export interface ResponsiveListProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  keyExtractor?: (row: T) => string;
}

function ResponsiveList<T extends { id: string }>({
  data,
  columns,
  loading = false,
  page = 0,
  rowsPerPage = 10,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  renderMobileCard,
  emptyMessage = 'No data found',
  keyExtractor = (row) => row.id,
}: ResponsiveListProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const getVisibleColumns = () => {
    return columns.filter((col) => {
      if (col.hide === 'mobile' && isMobile) return false;
      if (col.hide === 'tablet' && (isMobile || isTablet)) return false;
      return true;
    });
  };

  const visibleColumns = getVisibleColumns();

  const renderLoadingSkeleton = () => {
    if (isMobile) {
      return (
        <Stack spacing={2}>
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
                <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ))}
        </Stack>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableCell key={col.id}>
                  <Skeleton variant="text" width={80} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(5)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {visibleColumns.map((col) => (
                  <TableCell key={col.id}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderDefaultMobileCard = (row: T) => (
    <Card
      sx={{
        mb: 2,
        cursor: onRowClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onRowClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        } : {},
      }}
      onClick={() => onRowClick?.(row)}
    >
      <CardContent>
        <Stack spacing={1}>
          {columns.slice(0, 4).map((col) => {
            const value = (row as any)[col.id];
            const formattedValue = col.format ? col.format(value, row) : value;

            return (
              <Box key={col.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {col.label}
                </Typography>
                <Typography variant="body2">
                  {formattedValue ?? '-'}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return renderLoadingSkeleton();
  }

  if (data.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 2,
          bgcolor: alpha(theme.palette.grey[500], 0.05),
          borderRadius: 2,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  if (isMobile && renderMobileCard) {
    return (
      <>
        <Stack spacing={0}>
          {data.map((row) => (
            <Box key={keyExtractor(row)}>
              {renderMobileCard(row)}
            </Box>
          ))}
        </Stack>
        {onPageChange && onRowsPerPageChange && (
          <TablePagination
            component="div"
            count={totalCount ?? data.length}
            page={page}
            onPageChange={(_, newPage) => onPageChange(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[5, 10, 25]}
          />
        )}
      </>
    );
  }

  if (isMobile) {
    return (
      <>
        <Stack spacing={0}>
          {data.map((row) => (
            <Box key={keyExtractor(row)}>
              {renderDefaultMobileCard(row)}
            </Box>
          ))}
        </Stack>
        {onPageChange && onRowsPerPageChange && (
          <TablePagination
            component="div"
            count={totalCount ?? data.length}
            page={page}
            onPageChange={(_, newPage) => onPageChange(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[5, 10, 25]}
          />
        )}
      </>
    );
  }

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || 'left'}
                  style={{ minWidth: col.minWidth }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={keyExtractor(row)}
                hover
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
                onClick={() => onRowClick?.(row)}
              >
                {visibleColumns.map((col) => {
                  const value = (row as any)[col.id];
                  const formattedValue = col.format ? col.format(value, row) : value;

                  return (
                    <TableCell key={col.id} align={col.align || 'left'}>
                      {formattedValue ?? '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {onPageChange && onRowsPerPageChange && (
        <TablePagination
          component="div"
          count={totalCount ?? data.length}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 25, 50]}
        />
      )}
    </>
  );
}

export default ResponsiveList;
