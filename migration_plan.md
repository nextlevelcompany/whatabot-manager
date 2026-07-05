# Estado General de la Migración (Ascendo v3 a NextLead)

Este documento detalla el progreso actual del proceso de migración del sistema legado en PHP/MySQL (`ascendov3`) a la arquitectura moderna de **NextLead** (Spring Boot + PostgreSQL + Next.js), mostrando qué ha sido completado y qué está pendiente.

---

## 📊 Tablero de Control de Migración

| Módulo | Tipo / Archivos Legados | Estado Actual | Detalles de Implementación |
| :--- | :--- | :--- | :--- |
| **Ajustes Generales** | Configuración de Empresa | **✅ COMPLETADO** | Integrado en `system_settings` (Backend) y `/admin/general-settings` (Next.js). |
| **Zonas de Reparto** | Catálogo de Despacho | **✅ COMPLETADO** | CRUD en `ZonaController.java` y UI en `/admin/zones`. |
| **Flota (Vehículos/Choferes)** | Ajustes de Choferes/Flota | **✅ COMPLETADO** | Estructura en `conductores` expandida y CRUD en `/admin/fleet`. |
| **Proveedores** | Catálogo de Proveedores | **✅ COMPLETADO** | CRUD en `ProveedorController.java` y UI en `/finanzas/suppliers`. |
| **Registro de Gastos** | Egresos diarios y categorías | **✅ COMPLETADO** | CRUD en `GastoController.java` y UI en `/finanzas/expenses` con resumen mensual. |
| **Compras de Almacén** | Registro y entrada de mercadería | **✅ COMPLETADO** | CRUD en `CompraController.java` y UI en `/finanzas/purchases` con afectación automática de stock y egresos. |
| **Movimientos de Caja** | Tesorería y balances de cuentas | **🛠️ CÓDIGO LISTO** *(Pendiente Build)* | CRUD en `FinanceController.java` y UI en `/finanzas/cash-flow`. |
| **Deudas Bancarias** | Préstamos y cuotas | **🛠️ CÓDIGO LISTO** *(Pendiente Build)* | CRUD en `DeudaController.java` y UI en `/finanzas/debts` con auto-gastos. |
| **Personal y Asistencias** | Planillas y marcaciones RRHH | **✅ COMPLETADO** | Colaboradores, AFP, asistencias diarias/mensuales y planillas. |
| **CRM Oportunidades** | Inbound leads y embudo Kanban | **✅ COMPLETADO** | Kanban board en `/opportunities/view` y formulario en `/opportunities/create` vinculando contactos. |
| **Ventas e Informes** | Reportes de comisiones y rentabilidad | **✅ COMPLETADO** | Historial de facturación, checkout de venta directa en `/ventas/create` y reportes en `/ventas/reports`. |

---

## 🛠️ Detalle Técnico de lo Implementado

### 1. Base de Datos (PostgreSQL):
* Se expandió la tabla `conductores` para almacenar los datos técnicos y de mantenimiento de los vehículos de reparto.
* Se crearon las tablas de egresos y stock: `proveedores`, `gastos_categorias`, `gastos`, `compras` y `compras_detalles`.
* Se crearon las tablas de tesorería y préstamos: `caja_movimientos`, `deudas_bancarias` y `deudas_cuotas`.
* Se insertó un catálogo inicial de categorías contables de egresos.

### 2. Backend (Spring Boot):
* Se implementaron 5 controladores REST en Java:
  * `ConductorController` (Choferes y Flota)
  * `ZonaController` (Zonas de Reparto)
  * `ProveedorController` (Catálogo de Proveedores)
  * `GastoController` (Categorías y Egresos con reportes consolidados)
  * `CompraController` (Borradores de compra, detalle de ítems, y confirmación de ingreso al almacén con recalculo de stock físico)
  * `FinanceController` (Movimientos de arqueo, balances de cuentas, transferencias manuales y contra-asientos de anulación)
  * `DeudaController` (Desembolsos de préstamos bancarios, cronogramas de amortización, edición y liquidación de cuotas)

### 3. Frontend (Next.js):
* Se añadieron 5 nuevas vistas totalmente interactivas en la aplicación React/Next.js:
  * `/admin/fleet`: Gestión de conductores, licencias y mantenimientos del vehículo.
  * `/admin/zones`: Zonas logísticas.
  * `/finanzas/suppliers`: Catálogo de proveedores.
  * `/finanzas/expenses`: Egresos del mes actual con gráficos/resumen y catálogo contable.
  * `/finanzas/purchases`: Creador interactivo de facturas de compra, impuestos dinámicos y recepción.
  * `/finanzas/cash-flow`: Vista de tesorería, saldos de cuentas e ingresos/egresos.
  * `/finanzas/debts`: Cronogramas bancarios con acciones de amortización paso a paso.
* Se configuró el menú lateral en `SidebarMenu.jsx` para enlazar estos módulos.

---

## 📋 Lo que Falta por Migrar (Siguientes Fases)

Para concluir la migración en su totalidad, quedan pendientes los siguientes módulos:

### Fase 4: Recursos Humanos (Personal y Asistencias)
* **Objetivo:** Migrar la gestión de nómina (`planilla.php`) y control de personal (`personal.php`, `personal-asistencia.php`).
* **Modelos a crear:**
  * `trabajadores` (sueldo base, comisiones por venta/bidones, datos personales, placa de vehículo asignada).
  * `asistencias` (registros diarios de ingreso y salida por empleado, tardanzas, faltas justificadas).
* **Controladores a implementar:**
  * `PayrollController` (manejo de nómina, cálculo de comisiones devengadas por chofer de la carga de bidones entregados).
* **Pantallas a implementar:**
  * `/payroll/staff` (CRUD de personal).
  * `/payroll/attendance` (Marcación y hoja de asistencias).
  * `/payroll/payslip` (Cálculo de sueldo neto y comisiones).

### Fase 5: CRM Leads & Reportes de Ventas
* **Objetivo:** Migrar el embudo de oportunidades de venta (`oportunidades.php`) y comisiones históricas (`ventas.php`).
* **Modelos a crear:**
  * `oportunidades` (leads, contacto, producto de interés, etapa del embudo, monto estimado, observaciones).
* **Pantallas a implementar:**
  * `/crm/kanban` (Embudo comercial de prospectos).
  * `/sales/commissions` (Reportes consolidados de ventas y rentabilidad).
