const STORAGE_KEY = 'expense-tracker-items';

const expenseForm = document.getElementById('expenseForm');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const expenseList = document.getElementById('expenseList');

const totalSpentEl = document.getElementById('totalSpent');
const monthlyTotalEl = document.getElementById('monthlyTotal');
const transactionCountEl = document.getElementById('transactionCount');
const largestExpenseEl = document.getElementById('largestExpense');
const topCategoryEl = document.getElementById('topCategory');

const defaultExpenses = [
  { id: 1, title: 'Groceries', amount: 54.2, category: 'Food', date: getIsoDate(-2) },
  { id: 2, title: 'Train Ticket', amount: 22.5, category: 'Transport', date: getIsoDate(-5) },
  { id: 3, title: 'Movie Night', amount: 18.0, category: 'Entertainment', date: getIsoDate(-9) },
];

let expenses = loadExpenses();

function getIsoDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

function loadExpenses() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultExpenses));
    return defaultExpenses;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultExpenses;
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultExpenses));
    return defaultExpenses;
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function getMonthKey(dateString) {
  if (!dateString) return '';
  const dt = new Date(dateString + 'T00:00:00');
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function renderSummary() {
  const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const currentMonth = getCurrentMonthKey();
  const monthlyTotal = expenses
    .filter((item) => getMonthKey(item.date) === currentMonth)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const largest = expenses.reduce((max, item) => {
    return Number(item.amount || 0) > Number(max.amount || 0) ? item : max;
  }, { amount: 0 });

  const categoryTotals = expenses.reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + Number(item.amount || 0);
    return totals;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  totalSpentEl.textContent = formatCurrency(total);
  monthlyTotalEl.textContent = formatCurrency(monthlyTotal);
  transactionCountEl.textContent = expenses.length;
  largestExpenseEl.textContent = formatCurrency(Number(largest.amount || 0));
  topCategoryEl.textContent = topCategory ? topCategory[0] : '-';
}

function renderExpenses() {
  if (!expenses.length) {
    expenseList.innerHTML = '<div class="empty-state">No expenses added yet. Start by recording your first spending item.</div>';
    return;
  }

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  expenseList.innerHTML = sortedExpenses
    .map(
      (expense) => `
        <div class="expense-item">
          <div class="expense-meta">
            <div class="expense-title">
              <span>${escapeHtml(expense.title)}</span>
              <span class="category-badge">${escapeHtml(expense.category)}</span>
            </div>
            <span class="expense-date">${new Date(expense.date + 'T00:00:00').toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}</span>
          </div>

          <div class="expense-right">
            <span class="expense-amount">${formatCurrency(Number(expense.amount))}</span>
            <button class="delete-btn" data-id="${expense.id}" aria-label="Delete ${escapeHtml(expense.title)}">×</button>
          </div>
        </div>
      `
    )
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function addExpense(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!title || !amount || amount <= 0 || !date) {
    alert('Please enter a valid expense, amount, and date.');
    return;
  }

  expenses.unshift({
    id: Date.now() + Math.random(),
    title,
    amount,
    category,
    date,
  });

  saveExpenses();
  expenseForm.reset();
  dateInput.value = new Date().toISOString().split('T')[0];
  render();
}

function removeExpense(id) {
  expenses = expenses.filter((item) => item.id !== id);
  saveExpenses();
  render();
}

expenseForm.addEventListener('submit', addExpense);
expenseList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('.delete-btn');

  if (!deleteButton) return;

  removeExpense(Number(deleteButton.dataset.id));
});

function render() {
  renderSummary();
  renderExpenses();
}

dateInput.value = new Date().toISOString().split('T')[0];
render();
