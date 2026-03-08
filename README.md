# ⛽ Fuel Tracker

Aplicación web progresiva (PWA) para registrar y analizar el consumo de combustible de tu vehículo. Funciona sin conexión y guarda los datos localmente en el navegador.

## Demo

👉 [**Abrir Fuel Tracker**](https://gconejer.github.io/fuel-tracker/fuel-tracker.html)

## Características

- **Registro de repostajes** — Fecha, kilómetros, litros y precio por litro
- **Cálculo automático** — Consumo en l/100km y coste total del repostaje
- **Estadísticas en tiempo real** — Promedio, máximo, mínimo, gasto total, €/litro medio, total km y número de repostajes
- **Gráfico de evolución** — Visualización del consumo a lo largo del tiempo con Chart.js
- **Sparkline** — Mini-gráfico de los últimos 10 repostajes en la pantalla principal
- **Edición de repostajes** — Toca cualquier registro para modificarlo; los consumos se recalculan automáticamente
- **Eliminación por swipe** — Desliza a la izquierda para borrar un repostaje
- **Filtros temporales** — Consulta estadísticas por período: todo, este mes o últimos 3 meses
- **Alertas de anomalías** — Aviso si introduces datos inconsistentes (fechas o km anteriores al último registro)
- **Nombre del vehículo** — Personaliza la app con el nombre de tu coche
- **Import/Export** — Descarga tus datos en JSON o CSV, e impórtalos en otro dispositivo
- **Funciona offline** — Service Worker para uso sin conexión
- **Instalable** — Manifest PWA para añadir a la pantalla de inicio del móvil

## Tecnologías

- HTML5, CSS3 y JavaScript vanilla (sin frameworks)
- [Chart.js](https://www.chartjs.org/) para gráficos
- LocalStorage para persistencia de datos
- GitHub Pages para hosting

## Uso

No requiere instalación. Abre el enlace de la demo en cualquier navegador (optimizado para móvil).

Para desarrollo local:

```bash
git clone https://github.com/gconejer/fuel-tracker.git
cd fuel-tracker
# Abre fuel-tracker.html en tu navegador
```

## Estructura del proyecto

```
fuel-tracker/
├── fuel-tracker.html   # Aplicación completa (HTML + CSS + JS)
├── manifest.json       # Configuración PWA
└── README.md           # Este archivo
```

## Roadmap

- [ ] Tema oscuro
- [ ] Gráfico de gasto mensual (€/mes)
- [ ] Estadística de coste por km
- [ ] Base de datos en la nube para sincronización entre dispositivos
- [ ] Soporte para múltiples vehículos

## Licencia

Este proyecto es de uso personal. Siéntete libre de hacer fork y adaptarlo a tus necesidades.
