import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  seedTestData,
  cleanupTestData,
  expectedResults,
  TEST_PROJECT_ID_VALUE,
} from '../utils/seedTestData';
import { projectService, invoiceService, expenseService, paymentService } from '../services';
import { formatCurrency } from '../utils';
import type { Expense, ExpenseCategory } from '../types';

interface ActualResults {
  budget: number;
  totalRevenue: number;
  approvedExpenses: number;
  pendingExpenses: number;
  draftExpenses: number;
  totalExpenses: number;
  profitLoss: number;
  profitMargin: number;
  budgetUtilization: number;
  totalPayments: number;
  outstandingAmount: number;
  expensesByCategory: Array<{ category: string; total: number; count: number }>;
}

const DevFinancialTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actual, setActual] = useState<ActualResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      await seedTestData();
      setSeeded(true);
    } catch (err: any) {
      setError(`Seed failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    setError(null);
    try {
      await cleanupTestData();
      setSeeded(false);
      setActual(null);
    } catch (err: any) {
      setError(`Cleanup failed: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const project = await projectService.getById(TEST_PROJECT_ID_VALUE);
      if (!project) throw new Error('Test project not found. Seed data first.');

      const invoices = await invoiceService.getByProjectId(TEST_PROJECT_ID_VALUE);
      const expenses = await expenseService.getByProjectId(TEST_PROJECT_ID_VALUE);
      const { payments } = await paymentService.getAll({ projectId: TEST_PROJECT_ID_VALUE });

      // Replicate the EXACT same calculation as ProjectDetailPage
      const budget = project.budget || 0;
      const totalRevenue = invoices.reduce(
        (sum, inv) => sum + (inv.financialSummary?.grandTotal || 0), 0
      );

      const approvedExpenses = expenses
        .filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + e.totalAmount, 0);
      const pendingExpenses = expenses
        .filter(e => e.status === 'submitted')
        .reduce((sum, e) => sum + e.totalAmount, 0);
      const draftExpenses = expenses
        .filter(e => e.status === 'draft')
        .reduce((sum, e) => sum + e.totalAmount, 0);
      const totalExpenses = expenses
        .filter(e => e.status !== 'rejected')
        .reduce((sum, e) => sum + e.totalAmount, 0);

      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      const profitLoss = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0
        ? Math.round((profitLoss / totalRevenue) * 1000) / 10
        : 0;
      const budgetUtilization = budget > 0
        ? Math.round((totalExpenses / budget) * 1000) / 10
        : 0;

      const categoryMap = new Map<ExpenseCategory, { total: number; count: number }>();
      expenses
        .filter(e => e.status !== 'rejected')
        .forEach(e => {
          const existing = categoryMap.get(e.category) || { total: 0, count: 0 };
          categoryMap.set(e.category, {
            total: existing.total + e.totalAmount,
            count: existing.count + 1,
          });
        });
      const expensesByCategory = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.total - a.total);

      setActual({
        budget,
        totalRevenue,
        approvedExpenses,
        pendingExpenses,
        draftExpenses,
        totalExpenses,
        profitLoss,
        profitMargin,
        budgetUtilization,
        totalPayments,
        outstandingAmount: totalRevenue - totalPayments,
        expensesByCategory,
      });
    } catch (err: any) {
      setError(`Verify failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const comparisons = useMemo(() => {
    if (!actual) return [];
    const exp = expectedResults;
    return [
      { metric: 'Budget', expected: exp.budget, actual: actual.budget },
      { metric: 'Total Revenue', expected: exp.totalRevenue, actual: actual.totalRevenue },
      { metric: 'Approved Expenses', expected: exp.approvedExpenses, actual: actual.approvedExpenses },
      { metric: 'Pending Expenses', expected: exp.pendingExpenses, actual: actual.pendingExpenses },
      { metric: 'Draft Expenses', expected: exp.draftExpenses, actual: actual.draftExpenses },
      { metric: 'Total Expenses (non-rejected)', expected: exp.totalExpenses, actual: actual.totalExpenses },
      { metric: 'Profit / Loss', expected: exp.profitLoss, actual: actual.profitLoss },
      { metric: 'Profit Margin %', expected: exp.profitMargin, actual: actual.profitMargin, isPercent: true },
      { metric: 'Budget Utilization %', expected: exp.budgetUtilization, actual: actual.budgetUtilization, isPercent: true },
      { metric: 'Total Payments', expected: exp.totalPayments, actual: actual.totalPayments },
      { metric: 'Outstanding Amount', expected: exp.outstandingAmount, actual: actual.outstandingAmount },
    ];
  }, [actual]);

  const allPassed = comparisons.length > 0 && comparisons.every(c => c.expected === c.actual);

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Financial Calculations Test
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This page seeds Firestore with known test data and verifies that the Project Detail Page
        calculations match the expected results.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Step 1: Seed Test Data</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Creates a test project with 2 invoices, 6 expenses (2 approved, 2 submitted, 1 draft, 1 rejected), and 2 payments.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? <><CircularProgress size={18} sx={{ mr: 1 }} /> Seeding...</> : 'Seed Test Data'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCleanup}
              disabled={cleaning}
            >
              {cleaning ? 'Cleaning...' : 'Cleanup Test Data'}
            </Button>
          </Box>
          {seeded && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Test data seeded successfully!
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Step 2: Verify Calculations</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fetches the seeded data from Firestore and runs the same calculation logic used
            by ProjectDetailPage. Compares actual vs expected.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? <><CircularProgress size={18} sx={{ mr: 1 }} /> Verifying...</> : 'Run Verification'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(`/projects/${TEST_PROJECT_ID_VALUE}`)}
            >
              Open Project Detail Page
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(`/expenses?projectId=${TEST_PROJECT_ID_VALUE}`)}
            >
              Open Expense List (filtered)
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Results Table */}
      {actual && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">Verification Results</Typography>
              <Chip
                label={allPassed ? 'ALL PASSED' : 'SOME FAILED'}
                color={allPassed ? 'success' : 'error'}
                variant="filled"
              />
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Metric</strong></TableCell>
                    <TableCell align="right"><strong>Expected</strong></TableCell>
                    <TableCell align="right"><strong>Actual</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisons.map((row) => {
                    const passed = row.expected === row.actual;
                    return (
                      <TableRow key={row.metric} sx={{ bgcolor: passed ? undefined : 'error.50' }}>
                        <TableCell>{row.metric}</TableCell>
                        <TableCell align="right">
                          {(row as any).isPercent ? `${row.expected}%` : formatCurrency(row.expected)}
                        </TableCell>
                        <TableCell align="right">
                          {(row as any).isPercent ? `${row.actual}%` : formatCurrency(row.actual)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={passed ? 'PASS' : 'FAIL'}
                            size="small"
                            color={passed ? 'success' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Expense Category Breakdown (non-rejected only)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {actual.expensesByCategory.map((cat) => (
                    <TableRow key={cat.category}>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{cat.category}</TableCell>
                      <TableCell align="right">{formatCurrency(cat.total)}</TableCell>
                      <TableCell align="right">{cat.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Expected Values Reference */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Expected Values Reference</Typography>
          <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 13 }}>
{`Test Scenario:
  Project Budget:     ₹10,00,000

  Invoices (Revenue):
    INV-001:          ₹3,50,000 (Interior Design)
    INV-002:          ₹2,00,000 (Furniture & Materials)
    Total Revenue:    ₹5,50,000

  Expenses:
    EXP-001 [APPROVED]:  ₹50,000  (Materials - Cement & Steel)
    EXP-002 [APPROVED]:  ₹80,000  (Labor - Carpenter)
    EXP-003 [SUBMITTED]: ₹25,000  (Transport)
    EXP-004 [SUBMITTED]: ₹45,000  (Equipment Rental)
    EXP-005 [DRAFT]:     ₹15,000  (Utilities - Electricity)
    EXP-006 [REJECTED]:  ₹60,000  (Professional Fees) ← EXCLUDED

    Approved Total:   ₹1,30,000
    Pending Total:    ₹70,000
    Draft Total:      ₹15,000
    Non-Rejected:     ₹2,15,000

  Payments:
    PAY-001:          ₹1,50,000
    PAY-002:          ₹50,000
    Total Payments:   ₹2,00,000

  Calculated Results:
    Profit/Loss:      ₹5,50,000 - ₹2,15,000 = ₹3,35,000
    Profit Margin:    60.9%
    Budget Used:      21.5%
    Outstanding:      ₹5,50,000 - ₹2,00,000 = ₹3,50,000`}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DevFinancialTestPage;
