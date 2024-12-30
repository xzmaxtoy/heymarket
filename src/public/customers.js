// State management
let state = {
    customers: [],
    selectedCustomers: new Set(),
    currentPage: 1,
    totalPages: 1,
    pageSize: 50,
    filters: []
};

// Column definitions with filter types
const columnTypes = {
    name: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_null', 'is_not_null'] },
    phone: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_null', 'is_not_null'] },
    email: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_null', 'is_not_null'] },
    city: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'is_null', 'is_not_null'] },
    date_active: { type: 'date', operators: ['equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'] },
    credit: { type: 'number', operators: ['equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'] },
    point: { type: 'number', operators: ['equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'] },
    date_create: { type: 'date', operators: ['equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'] },
    fashion_percentage: { type: 'number', operators: ['equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'] },
    shaper_percentage: { type: 'number', operators: ['equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'] },
    bra_percentage: { type: 'number', operators: ['equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'] },
    other_percentage: { type: 'number', operators: ['equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'] },
    birthday: { type: 'date', operators: ['equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'] },
    address: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'is_null', 'is_not_null'] },
    postcode: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'is_null', 'is_not_null'] },
    remarks: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'is_null', 'is_not_null'] },
    ref_cus_id: { type: 'text', operators: ['equals', 'is_null', 'is_not_null'] },
    staff_id: { type: 'text', operators: ['equals', 'is_null', 'is_not_null'] },
    card_store_id: { type: 'text', operators: ['equals', 'is_null', 'is_not_null'] },
    store_active: { type: 'boolean', operators: ['equals', 'is_null', 'is_not_null'] },
    cus_id: { type: 'text', operators: ['equals', 'is_null', 'is_not_null'] },
    code: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'is_null', 'is_not_null'] },
    option1: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'is_null', 'is_not_null'] },
    option2: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'is_null', 'is_not_null'] },
    option3: { type: 'text', operators: ['equals', 'contains', 'not_contains', 'is_null', 'is_not_null'] }
};

// DOM Elements
const elements = {
    nameFilter: document.getElementById('nameFilter'),
    phoneFilter: document.getElementById('phoneFilter'),
    emailFilter: document.getElementById('emailFilter'),
    cityFilter: document.getElementById('cityFilter'),
    dateFromFilter: document.getElementById('dateFromFilter'),
    dateToFilter: document.getElementById('dateToFilter'),
    applyFilters: document.getElementById('applyFilters'),
    clearFilters: document.getElementById('clearFilters'),
    selectAll: document.getElementById('selectAll'),
    sendMessage: document.getElementById('sendMessage'),
    selectAllCheckbox: document.getElementById('selectAllCheckbox'),
    customerTableBody: document.getElementById('customerTableBody'),
    selectedCount: document.getElementById('selectedCount'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),
    showingCount: document.getElementById('showingCount'),
    totalCount: document.getElementById('totalCount'),
    messageForm: document.getElementById('messageForm'),
    messageTemplate: document.getElementById('messageTemplate'),
    previewMessage: document.getElementById('previewMessage'),
    confirmSend: document.getElementById('confirmSend'),
    cancelSend: document.getElementById('cancelSend'),
    previewArea: document.getElementById('previewArea'),
    status: document.getElementById('status')
};

// Initialize
async function init() {
    await loadCities();
    await loadCustomers();
    setupEventListeners();
}

// Load unique cities for filter dropdown
async function loadCities() {
    try {
        const response = await fetch('/api/customers/cities');
        const data = await response.json();
        if (data.success) {
            const options = data.data.map(city => 
                `<option value="${city}">${city}</option>`
            ).join('');
            elements.cityFilter.innerHTML = '<option value="">All Cities</option>' + options;
        }
    } catch (error) {
        showStatus('Failed to load cities', 'error');
    }
}

// Load customers with current filters and pagination
async function loadCustomers() {
    try {
        // Build query parameters
        const queryParams = new URLSearchParams({
            page: state.currentPage.toString(),
            pageSize: state.pageSize.toString()
        });

        // Add encoded filters if any exist
        if (state.filters.length > 0) {
            queryParams.append('filters', encodeURIComponent(JSON.stringify(state.filters)));
        }

        const response = await fetch(`/api/customers?${queryParams}`);
        const data = await response.json();
        
        if (data.success) {
            state.customers = data.data;
            state.totalPages = data.pagination.totalPages;
            updateTable();
            updatePagination(data.pagination);
        }
    } catch (error) {
        showStatus('Failed to load customers', 'error');
    }
}

// Initialize filter row
function initializeFilterRow(row) {
    const columnSelect = row.querySelector('.filter-column');
    const operatorSelect = row.querySelector('.filter-operator');
    const valueContainer = row.querySelector('.filter-value-container');

    // Populate column options
    Object.entries(columnTypes).forEach(([column, config]) => {
        const option = document.createElement('option');
        option.value = column;
        option.textContent = columns.find(col => col.id === column)?.label || column;
        columnSelect.appendChild(option);
    });

    // Handle column change
    columnSelect.addEventListener('change', () => {
        const column = columnSelect.value;
        const columnType = columnTypes[column];
        
        // Update operators
        operatorSelect.innerHTML = '';
        columnType.operators.forEach(operator => {
            const option = document.createElement('option');
            option.value = operator;
            option.textContent = operator.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            operatorSelect.appendChild(option);
        });

        updateValueInput(columnType.type, operatorSelect.value, valueContainer);
    });

    // Handle operator change
    operatorSelect.addEventListener('change', () => {
        const column = columnSelect.value;
        const columnType = columnTypes[column];
        updateValueInput(columnType.type, operatorSelect.value, valueContainer);
    });

    // Initialize with first column
    columnSelect.dispatchEvent(new Event('change'));
}

// Update value input based on column type and operator
function updateValueInput(type, operator, container) {
    let html = '';
    const baseClasses = 'filter-value input-field';

    if (['is_null', 'is_not_null'].includes(operator)) {
        // No input needed for null checks
        container.innerHTML = '';
        return;
    }

    if (operator === 'between') {
        if (type === 'date') {
            html = `
                <div class="grid grid-cols-2 gap-2">
                    <input type="date" class="${baseClasses}" data-index="1">
                    <input type="date" class="${baseClasses}" data-index="2">
                </div>
            `;
        } else {
            html = `
                <div class="grid grid-cols-2 gap-2">
                    <input type="${type}" class="${baseClasses}" placeholder="From" data-index="1">
                    <input type="${type}" class="${baseClasses}" placeholder="To" data-index="2">
                </div>
            `;
        }
    } else if (operator === 'in_list') {
        html = `<textarea class="${baseClasses}" placeholder="Enter values, one per line"></textarea>`;
    } else {
        switch (type) {
            case 'date':
                html = `<input type="date" class="${baseClasses}">`;
                break;
            case 'number':
                html = `<input type="number" class="${baseClasses}">`;
                break;
            case 'boolean':
                html = `
                    <select class="${baseClasses}">
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                `;
                break;
            default:
                html = `<input type="text" class="${baseClasses}" placeholder="Enter value">`;
        }
    }

    container.innerHTML = `
        <label class="block text-sm font-medium text-gray-700 mb-1">Value</label>
        ${html}
    `;
}

// Add new filter row
function addFilterRow() {
    const template = document.getElementById('filterRowTemplate');
    const clone = template.content.cloneNode(true);
    const row = clone.querySelector('.filter-row');
    
    // Initialize the new row
    initializeFilterRow(row);
    
    // Add remove button handler
    row.querySelector('.remove-filter').addEventListener('click', () => {
        row.remove();
    });
    
    document.getElementById('filterContainer').appendChild(row);
}

// Column definitions
const columns = [
    { id: 'name', label: 'Name' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'city', label: 'City' },
    { id: 'date_active', label: 'Date Active' },
    { id: 'credit', label: 'Credit' },
    { id: 'point', label: 'Points' },
    { id: 'date_create', label: 'Date Created' },
    { id: 'fashion_percentage', label: 'Fashion %' },
    { id: 'shaper_percentage', label: 'Shaper %' },
    { id: 'bra_percentage', label: 'Bra %' },
    { id: 'other_percentage', label: 'Other %' },
    { id: 'birthday', label: 'Birthday' },
    { id: 'address', label: 'Address' },
    { id: 'postcode', label: 'Postcode' },
    { id: 'remarks', label: 'Remarks' },
    { id: 'ref_cus_id', label: 'Ref Customer ID' },
    { id: 'staff_id', label: 'Staff ID' },
    { id: 'card_store_id', label: 'Card Store ID' },
    { id: 'store_active', label: 'Store Active' },
    { id: 'cus_id', label: 'Customer ID' },
    { id: 'code', label: 'Code' },
    { id: 'option1', label: 'Option 1' },
    { id: 'option2', label: 'Option 2' },
    { id: 'option3', label: 'Option 3' }
].map(col => ({ ...col, visible: false })); // Initialize all columns as hidden

// Load column settings from Supabase
async function loadColumnSettings() {
    try {
        const { data, error } = await supabase
            .from('sms_app_settings')
            .select('value')
            .eq('key', 'customer_columns')
            .single();
        
        if (error) {
            console.error('Failed to load column settings:', error);
            return;
        }
        
        if (data?.value) {
            // Update columns with saved visibility settings
            columns.forEach(column => {
                if (data.value[column.id] !== undefined) {
                    column.visible = data.value[column.id];
                }
            });
        }
    } catch (error) {
        console.error('Failed to load column settings:', error);
    }
}

// Save column settings to Supabase
async function saveColumnSettings() {
    try {
        const settings = {};
        columns.forEach(column => {
            settings[column.id] = column.visible;
        });

        const { error } = await supabase
            .from('sms_app_settings')
            .upsert({
                key: 'customer_columns',
                value: settings,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            });

        if (error) {
            console.error('Failed to save column settings:', error);
        }
    } catch (error) {
        console.error('Failed to save column settings:', error);
    }
}

// Import dependencies
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import config from './config.js';

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Initialize column controls
async function initializeColumnControls() {
    // Set up column visibility toggle
    const toggleButton = document.getElementById('toggleColumnVisibility');
    const panel = document.getElementById('columnVisibilityPanel');
    const arrow = document.getElementById('columnVisibilityArrow');

    toggleButton.addEventListener('click', () => {
        const isHidden = panel.classList.contains('hidden');
        panel.classList.toggle('hidden');
        arrow.style.transform = isHidden ? 'rotate(180deg)' : '';
    });

    // Load settings and initialize columns
    await loadColumnSettings();
    
    // Update column controls
    const columnControls = document.getElementById('columnControls');
    columnControls.innerHTML = columns.map(column => `
        <label class="flex items-center space-x-2">
            <input type="checkbox" 
                class="column-toggle rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                data-column="${column.id}"
                ${column.visible ? 'checked' : ''}>
            <span class="text-sm text-gray-700">${column.label}</span>
        </label>
    `).join('');

    // Add event listeners for column toggles
    document.querySelectorAll('.column-toggle').forEach(toggle => {
        toggle.addEventListener('change', async (e) => {
            const columnId = e.target.dataset.column;
            const visible = e.target.checked;
            toggleColumn(columnId, visible);
            await saveColumnSettings();
        });
    });

    // Update table headers based on initial settings
    columns.forEach(column => {
        const th = document.querySelector(`th[data-column="${column.id}"]`);
        if (th) {
            th.classList.toggle('hidden', !column.visible);
        }
    });
}

// Toggle column visibility
function toggleColumn(columnId, visible) {
    // Update columns array
    const column = columns.find(col => col.id === columnId);
    if (column) {
        column.visible = visible;
    }

    // Update table header
    const th = document.querySelector(`th[data-column="${columnId}"]`);
    if (th) {
        th.classList.toggle('hidden', !visible);
    }

    // Update all table cells for this column
    const cells = document.querySelectorAll(`td[data-column="${columnId}"]`);
    cells.forEach(cell => {
        cell.classList.toggle('hidden', !visible);
    });
}

// Format cell value based on column type
function formatCellValue(column, value) {
    if (!value && value !== 0) return '';

    switch (column) {
        case 'date_active':
        case 'date_create':
            return new Date(value).toLocaleDateString();
        case 'birthday':
            const customer = arguments[2];
            return `${customer.bir_dd || ''}/${customer.bir_mm || ''}/${customer.bir_yy || ''}`;
        case 'fashion_percentage':
        case 'shaper_percentage':
        case 'bra_percentage':
        case 'other_percentage':
            return `${value}%`;
        case 'credit':
        case 'point':
            return value.toLocaleString();
        default:
            return value;
    }
}

// Update table with current customers
function updateTable() {
    elements.customerTableBody.innerHTML = state.customers.map(customer => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="checkbox" 
                    class="customer-checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    data-id="${customer.id}"
                    ${state.selectedCustomers.has(customer.id) ? 'checked' : ''}>
            </td>
            ${columns.map(column => `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.visible ? '' : 'hidden'}"
                    data-column="${column.id}">
                    ${formatCellValue(column.id, customer[column.id], customer)}
                </td>
            `).join('')}
        </tr>
    `).join('');

    updateSelectedCount();
}

// Update pagination controls
function updatePagination({ page, pageSize, total, totalPages }) {
    elements.prevPage.disabled = page <= 1;
    elements.nextPage.disabled = page >= totalPages;
    elements.pageInfo.textContent = `Page ${page} of ${totalPages}`;
    elements.showingCount.textContent = state.customers.length;
    elements.totalCount.textContent = total;
}

// Update selected customers count
function updateSelectedCount() {
    elements.selectedCount.textContent = `Selected: ${state.selectedCustomers.size} customers`;
    elements.sendMessage.disabled = state.selectedCustomers.size === 0;
    elements.sendMessage.classList.toggle('opacity-50', state.selectedCustomers.size === 0);
    elements.sendMessage.classList.toggle('cursor-not-allowed', state.selectedCustomers.size === 0);
}

// Show status message
function showStatus(message, type = 'success') {
    elements.status.textContent = message;
    elements.status.className = `mt-6 p-4 rounded-md ${
        type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
    }`;
    elements.status.classList.remove('hidden');
    setTimeout(() => {
        elements.status.classList.add('hidden');
    }, 5000);
}

// Preview message for selected customers
function previewMessage() {
    const template = elements.messageTemplate.value;
    if (!template) {
        showStatus('Please enter a message template', 'error');
        return;
    }

    const previews = state.customers
        .filter(customer => state.selectedCustomers.has(customer.id))
        .slice(0, 3)
        .map(customer => {
            const message = template.replace(/\{(\w+)\}/g, (match, key) => customer[key] || match);
            return `
                <div class="bg-white p-4 rounded-md shadow-sm">
                    <div class="text-sm text-gray-500 mb-1">To: ${customer.name} (${customer.phone})</div>
                    <div class="text-gray-900">${message}</div>
                </div>
            `;
        })
        .join('');

    elements.previewArea.innerHTML = `
        ${previews}
        ${state.selectedCustomers.size > 3 ? 
            `<div class="text-sm text-gray-500 mt-2">... and ${state.selectedCustomers.size - 3} more</div>` 
            : ''}
    `;
}

// Send batch message
async function sendBatchMessage() {
    const template = elements.messageTemplate.value;
    if (!template) {
        showStatus('Please enter a message template', 'error');
        return;
    }

    const selectedCustomers = state.customers.filter(c => state.selectedCustomers.has(c.id));
    const recipients = selectedCustomers.map(customer => ({
        phoneNumber: customer.phone,
        variables: customer
    }));

    try {
        const response = await fetch('/api/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: template,
                recipients,
                options: {
                    priority: 'normal'
                }
            })
        });

        const data = await response.json();
        if (data.success) {
            showStatus(`Batch message created successfully. Batch ID: ${data.data.batchId}`);
            elements.messageForm.classList.add('hidden');
            state.selectedCustomers.clear();
            updateSelectedCount();
            updateTable();
        } else {
            throw new Error(data.message || 'Failed to create batch');
        }
    } catch (error) {
        showStatus(error.message, 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add filter button
    document.getElementById('addFilter').addEventListener('click', addFilterRow);

    // Filter events
    elements.applyFilters.addEventListener('click', async () => {
        // Collect all filter values
        state.filters = [];
        document.querySelectorAll('.filter-row').forEach(row => {
            const column = row.querySelector('.filter-column').value;
            const operator = row.querySelector('.filter-operator').value;
            
            // For null checks, we don't need a value
            if (['is_null', 'is_not_null'].includes(operator)) {
                state.filters.push({
                    column,
                    operator
                });
            } else {
                const valueContainer = row.querySelector('.filter-value-container');
                if (operator === 'between') {
                    const value1 = valueContainer.querySelector('[data-index="1"]')?.value;
                    const value2 = valueContainer.querySelector('[data-index="2"]')?.value;
                    if (value1 && value2) {
                        state.filters.push({
                            column,
                            operator,
                            value: value1,
                            value2: value2
                        });
                    }
                } else {
                    const valueInput = valueContainer.querySelector('.filter-value');
                    if (valueInput) {
                        const value = valueInput.value;
                        if (value || value === '0' || value === false) {
                            state.filters.push({
                                column,
                                operator,
                                value
                            });
                        }
                    }
                }
            }
        });

        state.currentPage = 1;
        await loadCustomers();
    });

    elements.clearFilters.addEventListener('click', async () => {
        // Clear all filter rows
        document.getElementById('filterContainer').innerHTML = '';
        state.filters = [];
        state.currentPage = 1;
        await loadCustomers();
    });

    // Pagination events
    elements.prevPage.addEventListener('click', async () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            await loadCustomers();
        }
    });

    elements.nextPage.addEventListener('click', async () => {
        if (state.currentPage < state.totalPages) {
            state.currentPage++;
            await loadCustomers();
        }
    });

    // Selection events
    elements.selectAllCheckbox.addEventListener('change', () => {
        const checked = elements.selectAllCheckbox.checked;
        state.customers.forEach(customer => {
            if (checked) {
                state.selectedCustomers.add(customer.id);
            } else {
                state.selectedCustomers.delete(customer.id);
            }
        });
        updateTable();
    });

    elements.customerTableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('customer-checkbox')) {
            const customerId = e.target.dataset.id;
            if (e.target.checked) {
                state.selectedCustomers.add(customerId);
            } else {
                state.selectedCustomers.delete(customerId);
            }
            updateSelectedCount();
        }
    });

    // Message form events
    elements.sendMessage.addEventListener('click', () => {
        elements.messageForm.classList.remove('hidden');
        elements.previewArea.innerHTML = '';
    });

    elements.previewMessage.addEventListener('click', previewMessage);
    elements.confirmSend.addEventListener('click', sendBatchMessage);
    elements.cancelSend.addEventListener('click', () => {
        elements.messageForm.classList.add('hidden');
        elements.messageTemplate.value = '';
        elements.previewArea.innerHTML = '';
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeColumnControls();
    init();
});
