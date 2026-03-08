// CONSTANTES
const DB_KEY = 'fuelTrackerData';
const STORAGE_KEY = 'fuelTrackerItems';
let chart = null;
let currentFilter = 'all';

// INICIALIZACIÓN
function init() {
    setCurrentDate();
    loadVehicleName();
    loadTheme();
    loadData();
    attachEventListeners();
    registerServiceWorker();
}

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;
}

function loadVehicleName() {
    const vehicleName = localStorage.getItem('fuelTrackerVehicleName') || 'Gestor de consumo';
    document.getElementById('header-subtitle').textContent = vehicleName;
    document.getElementById('vehicleNameInput').value = vehicleName === 'Gestor de consumo' ? '' : vehicleName;
}

function saveVehicleName() {
    const input = document.getElementById('vehicleNameInput');
    const vehicleName = input.value.trim() || 'Gestor de consumo';
    localStorage.setItem('fuelTrackerVehicleName', vehicleName);
    document.getElementById('header-subtitle').textContent = vehicleName;
    alert('Nombre guardado ✓');
}

function attachEventListeners() {
    // Botones navegación
    document.getElementById('settingsBtn').addEventListener('click', toggleSettings);
    initThemeListeners();

    // Formulario
    document.getElementById('km').addEventListener('input', calculateConsumption);
    document.getElementById('litros').addEventListener('input', calculateConsumption);
    document.getElementById('saveBtn').addEventListener('click', saveEntry);

    // Importar/Exportar
    document.getElementById('importFile').addEventListener('change', handleFileSelect);
    document.getElementById('importBtn').addEventListener('click', importData);
    document.getElementById('exportJsonBtn').addEventListener('click', () => exportData('json'));
    document.getElementById('exportCsvBtn').addEventListener('click', () => exportData('csv'));
    document.getElementById('clearBtn').addEventListener('click', clearAllData);
    document.getElementById('helpBtn').addEventListener('click', showHelp);
    document.getElementById('backToSettingsBtn').addEventListener('click', backToSettings);
    document.getElementById('saveVehicleNameBtn').addEventListener('click', saveVehicleName);

    // Filtros
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderStats();
        });
    });
}

// TEMA OSCURO
function loadTheme() {
    const theme = localStorage.getItem('fuelTrackerTheme') || 'light';
    applyTheme(theme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    // Actualizar botones activos
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

function initThemeListeners() {
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            localStorage.setItem('fuelTrackerTheme', theme);
            applyTheme(theme);
        });
    });

    // Escuchar cambios del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const theme = localStorage.getItem('fuelTrackerTheme') || 'light';
        if (theme === 'system') {
            applyTheme('system');
        }
    });
}

function toggleSettings() {
    const mainScreen = document.getElementById('mainScreen');
    const settingsScreen = document.getElementById('settingsScreen');

    mainScreen.classList.toggle('active');
    settingsScreen.classList.toggle('active');

    if (settingsScreen.classList.contains('active')) {
        renderStats();
    }
}

function showSettings() {
    document.getElementById('mainScreen').classList.remove('active');
    document.getElementById('settingsScreen').classList.add('active');
    renderStats();
}

function showMain() {
    document.getElementById('settingsScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.add('active');
}

function showHelp() {
    document.getElementById('settingsScreen').classList.remove('active');
    document.getElementById('helpScreen').classList.add('active');
}

function backToSettings() {
    document.getElementById('helpScreen').classList.remove('active');
    document.getElementById('settingsScreen').classList.add('active');
}

// CÁLCULO DE CONSUMO
function calculateConsumption() {
    const km = parseFloat(document.getElementById('km').value);
    const litros = parseFloat(document.getElementById('litros').value);

    if (km && litros && km > 0 && litros > 0) {
        const data = getAllData();
        if (data.length === 0) {
            showConsumption(null);
            return;
        }

        const lastEntry = data[data.length - 1];
        const kmDiff = km - lastEntry.km;

        if (kmDiff <= 0) {
            showConsumption(null);
            return;
        }

        const consumo = (litros * 100) / kmDiff;
        showConsumption(consumo);
    } else {
        showConsumption(null);
    }
}

function showConsumption(value) {
    const display = document.getElementById('consumptionDisplay');
    const valueEl = document.getElementById('consumptionValue');

    if (value !== null && !isNaN(value)) {
        display.classList.remove('empty');
        valueEl.textContent = value.toFixed(2);
    } else {
        display.classList.add('empty');
        valueEl.textContent = '-';
    }
}

// ESTADÍSTICAS EN PANTALLA PRINCIPAL
function updateMainStats() {
    const data = getAllData();
    const consumos = data.filter(d => d.consumo !== null).map(d => d.consumo);

    if (consumos.length === 0) {
        document.getElementById('statAvg').textContent = '-';
        document.getElementById('statMax').textContent = '-';
        document.getElementById('statMin').textContent = '-';
        document.getElementById('statLitros').textContent = '-';
        document.getElementById('statGasto').textContent = '-';
        document.getElementById('statPrecioMedio').textContent = '-';
        document.getElementById('statTotalKm').textContent = '-';
        document.getElementById('statRepostajes').textContent = '-';
        return;
    }

    const promedio = consumos.reduce((a, b) => a + b, 0) / consumos.length;
    const maximo = Math.max(...consumos);
    const minimo = Math.min(...consumos);
    const totalLitros = data.reduce((sum, d) => sum + d.litros, 0);

    document.getElementById('statAvg').textContent = promedio.toFixed(2) + ' l/100km';
    document.getElementById('statMax').textContent = maximo.toFixed(2) + ' l/100km';
    document.getElementById('statMin').textContent = minimo.toFixed(2) + ' l/100km';
    document.getElementById('statLitros').textContent = totalLitros.toFixed(1) + ' L';
    const totalGasto = data.reduce((sum, d) => sum + (d.coste || 0), 0);
    const conPrecio = data.filter(d => d.precio);
    const precioMedio = conPrecio.length > 0 ? conPrecio.reduce((sum, d) => sum + d.precio, 0) / conPrecio.length : 0;
    document.getElementById('statGasto').textContent = totalGasto > 0 ? totalGasto.toFixed(2) + ' €' : '-';
    document.getElementById('statPrecioMedio').textContent = precioMedio > 0 ? precioMedio.toFixed(3) + ' €/L' : '-';
    const totalKm = data.length > 1 ? data[data.length - 1].km - data[0].km : 0;
    document.getElementById('statTotalKm').textContent = totalKm > 0 ? totalKm + ' km' : '-';
    document.getElementById('statRepostajes').textContent = data.length;
    // Mostrar el último consumo guardado cuando el formulario está vacío
    const kmInput = document.getElementById('km').value;
    const litrosInput = document.getElementById('litros').value;
    if (!kmInput && !litrosInput) {
        const lastWithConsumo = [...data].reverse().find(d => d.consumo !== null);
        showConsumption(lastWithConsumo ? lastWithConsumo.consumo : null);
    }

    // Actualizar alertas de anomalías
    updateAlerts();

    // Dibujar sparkline
    drawSparkline(data);
}

function drawSparkline(data) {
    if (data.length < 2) {
        document.getElementById('sparklineContainer').style.display = 'none';
        return;
    }

    document.getElementById('sparklineContainer').style.display = 'block';
    const canvas = document.getElementById('sparklineChart');
    const ctx = canvas.getContext('2d');

    const recent = data.slice(-10).filter(d => d.consumo !== null);
    if (recent.length === 0) {
        document.getElementById('sparklineContainer').style.display = 'none';
        return;
    }

    const values = recent.map(d => d.consumo);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    const width = canvas.width;
    const height = canvas.height;
    const pointSpacing = width / (recent.length - 1 || 1);

    // Limpiar
    ctx.clearRect(0, 0, width, height);

    // Dibujar línea
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    recent.forEach((d, i) => {
        const x = i * pointSpacing;
        const y = height - ((d.consumo - minValue) / range) * (height - 10) - 5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dibujar puntos
    ctx.fillStyle = '#667eea';
    recent.forEach((d, i) => {
        const x = i * pointSpacing;
        const y = height - ((d.consumo - minValue) / range) * (height - 10) - 5;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// GUARDAR ENTRADA
function saveEntry() {
    const fecha = document.getElementById('fecha').value;
    const km = parseFloat(document.getElementById('km').value);
    const litros = parseFloat(document.getElementById('litros').value);
    const precio = parseFloat(document.getElementById('precio').value) || null;

    if (!fecha || !km || !litros || km <= 0 || litros <= 0) {
        alert('Por favor, rellena todos los campos correctamente');
        return;
    }

    const data = getAllData();

    // VALIDACIÓN 1: Comprobar fecha posterior a la última
    if (data.length > 0) {
        const lastEntry = data[data.length - 1];
        const lastFecha = new Date(lastEntry.fecha);
        const currentFecha = new Date(fecha);

        if (currentFecha < lastFecha) {
            const confirmFecha = confirm(`⚠️ La fecha seleccionada (${fecha}) es anterior a la última fecha registrada (${lastEntry.fecha}).\n\n¿Deseas continuar guardando?`);
            if (!confirmFecha) {
                return;
            }
        }

        // VALIDACIÓN 2: Comprobar km inferior al último
        if (km < lastEntry.km) {
            const confirmKm = confirm(`⚠️ Los km introducidos (${km}) son inferiores al último registro (${lastEntry.km}) km.\n\n¿Deseas continuar guardando?`);
            if (!confirmKm) {
                return;
            }
        }
    }

    let consumo = null;

    if (data.length > 0) {
        const lastEntry = data[data.length - 1];
        const kmDiff = km - lastEntry.km;
        if (kmDiff > 0) {
            consumo = (litros * 100) / kmDiff;
        }
    }

    const entry = {
        id: Date.now(),
        fecha,
        km,
        litros,
        consumo: consumo ? parseFloat(consumo.toFixed(2)) : null,
        precio,
        coste: (precio && litros) ? parseFloat((precio * litros).toFixed(2)) : null
    };

    data.push(entry);
    saveData(data);

    // Limpiar formulario
    document.getElementById('km').value = '';
    document.getElementById('litros').value = '';
    document.getElementById('precio').value = '';
    setCurrentDate();
    showConsumption(consumo);

    loadData();
    alert('Repostaje guardado ✓');
}

// DATOS - LOCALSTROAGE
function getAllData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function recalculateConsumptions(data) {
    for (let i = 1; i < data.length; i++) {
        const current = data[i];
        const previous = data[i - 1];

        const kmDiff = current.km - previous.km;
        if (kmDiff > 0 && current.litros > 0) {
            current.consumo = parseFloat(((current.litros * 100) / kmDiff).toFixed(2));
        } else {
            current.consumo = null;
        }
    }
    return data;
}

function loadData() {
    const data = getAllData();
    displayHistory(data);
    updateKmPlaceholder(data);
    updateMainStats();
}

function updateKmPlaceholder(data) {
    const kmInput = document.getElementById('km');
    if (data.length > 0) {
        const lastKm = data[data.length - 1].km;
        kmInput.placeholder = lastKm;
    } else {
        kmInput.placeholder = '--';
    }
}

// MOSTRAR HISTÓRICO
function displayHistory(data) {
    const historyList = document.getElementById('historyList');

    if (data.length === 0) {
        historyList.innerHTML = '<li class="empty-message">Sin repostajes aún</li>';
        return;
    }

    // Últimos 10 en orden inverso
    const recent = data.slice(-10).reverse();
    historyList.innerHTML = recent.map(entry => `
        <li class="history-item" data-id="${entry.id}">
            <div class="history-item-delete-bg">🗑️</div>
            <div class="history-item-wrapper">
                <div class="history-item-content">
                    <div class="history-info">
                        <div class="history-date">${formatDate(entry.fecha)}</div>
<div class="history-details">${entry.km} km • ${entry.litros} L${entry.precio ? ' • ' + entry.precio.toFixed(3) + ' €/L' : ''}${entry.coste ? ' • ' + entry.coste.toFixed(2) + ' €' : ''}</div>                            </div>
                    <div class="history-consumption">${entry.consumo ? entry.consumo.toFixed(2) + ' l/100km' : '-'}</div>
                </div>
            </div>
        </li>
    `).join('');

    // Añadir event listeners para swipe
    document.querySelectorAll('.history-item').forEach(item => {
        let startX = 0;
        let isSwiped = false;

        item.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isSwiped = item.classList.contains('swiped');
        }, false);

        item.addEventListener('touchmove', (e) => {
            if (!isSwiped) {
                const currentX = e.touches[0].clientX;
                const diff = startX - currentX;

                if (diff > 50) {
                    item.classList.add('swiped');
                    isSwiped = true;
                }
            } else {
                const currentX = e.touches[0].clientX;
                const diff = startX - currentX;

                if (diff < 30) {
                    item.classList.remove('swiped');
                    isSwiped = false;
                }
            }
        }, false);

        item.addEventListener('touchend', (e) => {
            const currentX = e.changedTouches[0].clientX;
            const diff = startX - currentX;

            if (diff < 30) {
                item.classList.remove('swiped');
            }
        }, false);

        item.querySelector('.history-item-delete-bg').addEventListener('click', () => {
            if (confirm('¿Deseas eliminar este repostaje?')) {
                deleteEntry(item.dataset.id);
            }
        });

        // Click para editar
        item.querySelector('.history-item-content').addEventListener('click', () => {
            openEditModal(item.dataset.id);
        });
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

// EDITAR REPOSTAJE
let editingId = null;

function openEditModal(entryId) {
    const data = getAllData();
    const entry = data.find(d => d.id == entryId);
    if (!entry) return;

    editingId = entryId;
    document.getElementById('editFecha').value = entry.fecha;
    document.getElementById('editKm').value = entry.km;
    document.getElementById('editLitros').value = entry.litros;
    document.getElementById('editPrecio').value = entry.precio || '';
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingId = null;
}

function saveEdit() {
    const fecha = document.getElementById('editFecha').value;
    const km = parseFloat(document.getElementById('editKm').value);
    const litros = parseFloat(document.getElementById('editLitros').value);
    const precio = parseFloat(document.getElementById('editPrecio').value) || null;

    if (!fecha || !km || !litros || km <= 0 || litros <= 0) {
        alert('Por favor, rellena todos los campos correctamente');
        return;
    }

    const data = getAllData();
    const index = data.findIndex(d => d.id == editingId);
    if (index === -1) return;

    data[index].fecha = fecha;
    data[index].km = km;
    data[index].litros = litros;
    data[index].precio = precio;
    data[index].coste = (precio && litros) ? parseFloat((precio * litros).toFixed(2)) : null;

    // Reordenar por fecha y km por si se cambió la fecha
    data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || a.km - b.km);

    // Recalcular todos los consumos
    const recalculated = recalculateConsumptions(data);
    saveData(recalculated);

    closeEditModal();
    loadData();
    renderStats();
    alert('Repostaje actualizado ✓');
}

// Cerrar modal al hacer clic fuera
document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('editModal')) {
        closeEditModal();
    }
});

function deleteEntry(entryId) {
    const data = getAllData();
    const filteredData = data.filter(entry => entry.id != entryId);

    // Recalcular consumos
    const recalculated = recalculateConsumptions(filteredData);
    saveData(recalculated);

    loadData();
    renderStats();
    alert('Repostaje eliminado ✓');
}

// PANTALLA CONFIGURACIÓN
function showSettings() {
    document.getElementById('mainScreen').classList.remove('active');
    document.getElementById('settingsScreen').classList.add('active');
    renderStats();
}

function showMain() {
    document.getElementById('settingsScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.add('active');
}

// ESTADÍSTICAS

function filterDataByPeriod(data, period) {
    if (period === 'all') {
        return data;
    }

    const now = new Date();
    let cutoffDate = new Date();

    if (period === 'month') {
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    } else if (period === '3months') {
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    }

    return data.filter(d => new Date(d.fecha) >= cutoffDate);
}

function detectAnomalies(data) {
    if (data.length === 0) return null;

    const consumos = data.filter(d => d.consumo !== null).map(d => d.consumo);
    if (consumos.length < 1) return null;

    const lastEntry = data[data.length - 1];
    if (!lastEntry.consumo) return null;

    // Si solo hay 1 repostaje, no hay anomalía aún
    if (consumos.length === 1) return null;

    const promedio = consumos.slice(0, -1).reduce((a, b) => a + b, 0) / (consumos.length - 1);
    const diferencia = Math.abs(lastEntry.consumo - promedio);
    const porcentajeDiferencia = (diferencia / promedio) * 100;

    // Alerta si la diferencia es mayor al 30% del promedio
    if (porcentajeDiferencia > 30) {
        return {
            tipo: 'warning',
            mensaje: `⚠️ Consumo anómalo: ${lastEntry.consumo.toFixed(2)} l/100km (promedio anterior: ${promedio.toFixed(2)} l/100km, +${porcentajeDiferencia.toFixed(1)}%)`
        };
    }

    return null;
}

function updateAlerts() {
    const data = getAllData();
    const alertContainer = document.getElementById('alertContainer');

    if (!alertContainer) {
        console.error('❌ alertContainer no encontrado');
        return;
    }

    const anomaly = detectAnomalies(data);
    console.log('📊 Anomalía:', anomaly);

    if (anomaly) {
        const html = `<div class="alert-box ${anomaly.tipo}">${anomaly.mensaje}</div>`;
        alertContainer.innerHTML = html;
        console.log('✅ Alerta mostrada:', html);
    } else {
        alertContainer.innerHTML = '';
        console.log('ℹ️ Sin anomalías');
    }
}

function renderStats() {
    const allData = getAllData();
    const data = filterDataByPeriod(allData, currentFilter);

    if (data.length === 0) {
        document.getElementById('statsContainer').innerHTML = '<div class="no-data-message">Sin datos en este período</div>';
        return;
    }

    // Calcular estadísticas
    const consumos = data.filter(d => d.consumo !== null).map(d => d.consumo);
    const promedio = consumos.length > 0 ? consumos.reduce((a, b) => a + b, 0) / consumos.length : 0;
    const maximo = consumos.length > 0 ? Math.max(...consumos) : 0;
    const minimo = consumos.length > 0 ? Math.min(...consumos) : 0;
    const totalLitros = data.reduce((sum, d) => sum + d.litros, 0);
    const totalKm = data.length > 1 ? data[data.length - 1].km - data[0].km : 0;
    const totalRepostajes = data.length;

    const statsHTML = `
        <div class="chart-container">
            <canvas id="consumptionChart"></canvas>
        </div>
    `;

    document.getElementById('statsContainer').innerHTML = statsHTML;

    // Renderizar gráfica
    setTimeout(() => {
        renderChart(data);
    }, 100);
}

function renderChart(data) {
    const ctx = document.getElementById('consumptionChart');
    if (!ctx) return;

    const chartData = data.filter(d => d.consumo !== null).map(d => ({
        fecha: d.fecha,
        consumo: d.consumo
    }));

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => formatDate(d.fecha)),
            datasets: [{
                label: 'Consumo (l/100km)',
                data: chartData.map(d => d.consumo),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(1);
                        }
                    }
                }
            }
        }
    });
}

// IMPORTAR DATOS
let selectedFile = null;

function handleFileSelect(e) {
    selectedFile = e.target.files[0];
}

function importData() {
    if (!selectedFile) {
        alert('Por favor, selecciona un archivo primero');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            let data = [];

            if (selectedFile.name.endsWith('.json')) {
                data = JSON.parse(e.target.result);
            } else if (selectedFile.name.endsWith('.csv')) {
                data = parseCSV(e.target.result);
            } else {
                alert('Formato no soportado. Usa JSON o CSV');
                return;
            }

            if (!Array.isArray(data)) {
                alert('Formato inválido');
                return;
            }

            // Recalcular consumos
            data = recalculateConsumptions(data);
            saveData(data);
            loadData();
            showMain();
            alert(`${data.length} repostajes importados ✓`);
            selectedFile = null;
            document.getElementById('importFile').value = '';
        } catch (error) {
            alert('Error al importar: ' + error.message);
        }
    };
    reader.readAsText(selectedFile);
}

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV vacío o inválido');

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const [fecha, km, litros, consumo] = lines[i].split(',');
        if (fecha && km && litros) {
            data.push({
                id: Date.now() + i,
                fecha: fecha.trim(),
                km: parseFloat(km),
                litros: parseFloat(litros),
                consumo: consumo ? parseFloat(consumo) : null
            });
        }
    }
    return data;
}

// EXPORTAR DATOS
function exportData(format) {
    const data = getAllData();

    if (data.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    let content, filename, type;

    if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `fuel-tracker-${new Date().toISOString().split('T')[0]}.json`;
        type = 'application/json';
    } else {
        // CSV
        const headers = 'Fecha,Km,Litros,Consumo(l/100km)\n';
        const rows = data.map(d => `${d.fecha},${d.km},${d.litros},${d.consumo || ''}`).join('\n');
        content = headers + rows;
        filename = `fuel-tracker-${new Date().toISOString().split('T')[0]}.csv`;
        type = 'text/csv;charset=utf-8;';
    }

    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// BORRAR TODO
function clearAllData() {
    if (confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
        localStorage.removeItem(STORAGE_KEY);
        loadData();
        renderStats();
        showMain();
        alert('Todos los datos han sido borrados');
    }
}

// SERVICE WORKER (PWA)
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        const sw = `
            self.addEventListener('install', (e) => {
                e.waitUntil(caches.open('fuel-tracker-v1').then((cache) => {
                    return cache.addAll(['/']);
                }));
            });

            self.addEventListener('fetch', (e) => {
                e.respondWith(
                    caches.match(e.request).then((res) => {
                        return res || fetch(e.request);
                    }).catch(() => {
                        return caches.match(e.request);
                    })
                );
            });
        `;

        const blob = new Blob([sw], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);

        navigator.serviceWorker.register(swUrl).catch(() => {
            // Service Worker opcional
        });
    }
}

// INICIAR
init();
