let allOrdenes = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarOrdenes();
  setupEventListeners();
});

function setupEventListeners() {
  // Filtros
  const searchInput = document.getElementById('search-cliente');
  const yearSelect = document.getElementById('filter-year');
  const monthSelect = document.getElementById('filter-month');
  const tipoSelect = document.getElementById('filter-tipo');

  let debounceTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(filtrarOrdenes, 300);
  });

  yearSelect.addEventListener('change', filtrarOrdenes);
  monthSelect.addEventListener('change', filtrarOrdenes);
  tipoSelect.addEventListener('change', filtrarOrdenes);

  // Modal eliminar
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('delete-modal');
  const btnCancel = document.getElementById('btn-cancel');
  const btnConfirm = document.getElementById('btn-confirm');

  overlay.addEventListener('click', closeDeleteModal);
  btnCancel.addEventListener('click', closeDeleteModal);
  btnConfirm.addEventListener('click', confirmDelete);
}

async function cargarOrdenes() {
  const loading = document.getElementById('loading');
  const ordenesContainer = document.getElementById('ordenes-container');
  const noResults = document.getElementById('no-results');

  loading.hidden = false;
  noResults.hidden = true;
  ordenesContainer.innerHTML = '';

  try {
    const response = await fetch('/api/ordenes');
    if (!response.ok) throw new Error('Error al cargar órdenes');

    const data = await response.json();
    allOrdenes = data.ordenes || [];
    
    populateYearFilter();
    filtrarOrdenes();
  } catch (error) {
    console.error('Error:', error);
    ordenesContainer.innerHTML = '<p style="text-align:center; color:red;">Error al cargar órdenes</p>';
  } finally {
    loading.hidden = true;
  }
}

function populateYearFilter() {
  const yearSelect = document.getElementById('filter-year');
  const years = [...new Set(allOrdenes.map(o => new Date(o.fecha).getFullYear()))].sort((a, b) => b - a);
  
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });
}

function filtrarOrdenes() {
  const searchText = document.getElementById('search-cliente').value.toLowerCase();
  const selectedYear = document.getElementById('filter-year').value;
  const selectedMonth = document.getElementById('filter-month').value;
  const selectedTipo = document.getElementById('filter-tipo').value;

  const filtered = allOrdenes.filter(orden => {
    const matchSearch = !searchText || 
                       orden.nombre_cliente.toLowerCase().includes(searchText) ||
                       orden.cc_cliente.toString().includes(searchText);
    
    const ordenDate = new Date(orden.fecha);
    const matchYear = !selectedYear || ordenDate.getFullYear().toString() === selectedYear;
    const matchMonth = !selectedMonth || (ordenDate.getMonth() + 1).toString() === selectedMonth;
    const matchTipo = !selectedTipo || orden.tipo_dispositivo === selectedTipo;

    return matchSearch && matchYear && matchMonth && matchTipo;
  });

  renderOrdenes(filtered);
}

function renderOrdenes(ordenes) {
  const container = document.getElementById('ordenes-container');
  const noResults = document.getElementById('no-results');

  if (ordenes.length === 0) {
    container.innerHTML = '';
    noResults.hidden = false;
    return;
  }

  noResults.hidden = true;
  container.innerHTML = ordenes.map(orden => {
    const fecha = new Date(orden.fecha);
    const fechaFormato = fecha.toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return `
      <div class="orden-card" data-id-orden="${orden.id_orden}">
        <div class="orden-card__header">
          <span class="orden-card__id">#${orden.id_orden}</span>
          <div class="orden-card__actions">
            <span class="orden-card__tipo orden-card__tipo--${orden.tipo_dispositivo}">
              ${orden.tipo_dispositivo}
            </span>
            <button class="delete-btn" aria-label="Eliminar orden">&times;</button>
          </div>
        </div>
        <div class="orden-card__body" onclick="window.location.href='/admin/orden/${orden.id_orden}'">
            <div class="orden-card__info">
              <div><strong>Cliente:</strong> ${orden.nombre_cliente}</div>
              <div><strong>CC:</strong> ${orden.cc_cliente}</div>
              <div><strong>Dispositivo:</strong> ${orden.marca} ${orden.modelo || ''}</div>
              ${orden.imei ? `<div><strong>IMEI:</strong> ${orden.imei}</div>` : ''}
            </div>
            <div class="orden-card__fecha">${fechaFormato}</div>
        </div>
      </div>
    `;
  }).join('');

  addDeleteEventListeners();
}

function addDeleteEventListeners() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = e.target.closest('.orden-card');
            const idOrden = card.dataset.idOrden;
            openDeleteModal(idOrden, card);
        });
    });
}

// Estado del modal
let deleteContext = { id: null, card: null };

function openDeleteModal(id, card) {
  deleteContext = { id, card };
  document.getElementById('delete-orden-id').textContent = `#${id}`;
  document.getElementById('modal-overlay').hidden = false;
  document.getElementById('delete-modal').hidden = false;
}

function closeDeleteModal() {
  document.getElementById('modal-overlay').hidden = true;
  document.getElementById('delete-modal').hidden = true;
  deleteContext = { id: null, card: null };
}

async function confirmDelete() {
  const { id, card } = deleteContext;
  if (!id || !card) return closeDeleteModal();

  try {
    const response = await fetch(`/api/orden/${id}`, { method: 'DELETE' });
    if (response.ok) {
      card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      card.style.transform = 'scale(0.9)';
      card.style.opacity = '0';
      setTimeout(() => {
        card.remove();
        allOrdenes = allOrdenes.filter(o => o.id_orden.toString() !== id);
        if (document.querySelectorAll('.orden-card').length === 0) {
          document.getElementById('no-results').hidden = false;
        }
      }, 300);
    } else {
      alert('Error al eliminar la orden.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de red al eliminar la orden.');
  } finally {
    closeDeleteModal();
  }
}
