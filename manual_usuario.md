# Manual de Usuario - FADICC ERP v2.0
**Sistema de Gestión Comercial e Industrial**

---

## 1. Introducción

### 1.1. Descripción breve para el usuario final
**FADICC ERP v2.0** es la plataforma unificada de gestión comercial e industrial de **FADICC S.A.**, diseñada específicamente para automatizar y optimizar las operaciones de fabricación y comercialización de cocinas industriales y domésticas. 

El sistema integra de forma nativa los dos canales de ventas clave de la empresa:
*   **Canal Comercial:** Diseñado para la venta rápida en tienda física, permitiendo el control estricto de caja por turno, la validación en tiempo real del inventario físico y la emisión simplificada de comprobantes de pago (boletas y facturas).
*   **Canal Industrial:** Diseñado para el negocio de proyectos corporativos (hoteles, restaurantes, concesionarias). Permite la cotización personalizada (proformas), el registro de negociaciones de precios por volumen, y el seguimiento de los estados de producción en planta hasta la entrega final al cliente.

El sistema cuenta con un **patrón de base de datos dual (Dual-Mode)** que asegura la resiliencia operativa: ante caídas de internet, el canal comercial activa automáticamente el modo de contingencia (fallback offline) utilizando la memoria local del navegador (`localStorage`), garantizando que la tienda nunca deje de vender.

### 1.2. Público objetivo
Este sistema está dirigido a todo el personal operativo, comercial, logístico y directivo de **FADICC S.A.** Cada empleado cuenta con un rol definido que restringe o permite el acceso a ciertos módulos en cumplimiento con las directivas de seguridad de la empresa:

| Rol del Usuario | Perfil de Usuario | Módulos Autorizados |
| :--- | :--- | :--- |
| **ADMIN** | Administrador de Sistema / Gerencia | Todos los módulos, reportes avanzados, control de caja de todos los turnos y gestión de personal. |
| **VENDEDOR** | Cajeros y personal de venta directa en Tienda | Módulo Comercial, Catálogo, Historial de caja propio, Inventario (lectura) y Fichas de Clientes. |
| **REPRESENTANTE** | Ejecutivos de ventas industriales y corporativas | Canal Industrial (Kanban de Proformas), Catálogo de productos (lectura), Gestión de Clientes y Mis Ventas. |
| **ALMACEN** | Operadores logísticos y despachadores | Inventario (ajustes y entradas de stock), Planta y Despachos (seguimiento y entregas), Fichas de Clientes (lectura). |
| **PRODUCCION** | Jefes de planta y personal de manufactura | Centro de Producción (Planta), consulta de stock en almacén. |

---

## 2. Requisitos del Sistema

### 2.1. Hardware y Dispositivos Compatibles
FADICC ERP es una plataforma web responsiva optimizada para una variedad de dispositivos:
*   **Computadoras de Escritorio y Laptops:** Recomendado para todos los roles, especialmente ADMIN y REPRESENTANTE por el flujo de tableros y gráficos de control. (Pantalla mínima recomendada: 1280x720 px).
*   **Tablets (Modo Horizontal):** Ideal para vendedores en tienda física (Canal Comercial) y operadores en planta (Producción/Almacén), facilitando el registro en movilidad.
*   **Dispositivos Móviles:** La interfaz está adaptada para smartphones, facilitando la consulta rápida de stock o estados de entrega, aunque no se recomienda para procesos masivos como la facturación comercial diaria o la creación de proformas complejas.
*   **Periféricos de Tienda:** El sistema es compatible con lectores de código de barras USB/Bluetooth tradicionales y ticketera térmica estándar de 80mm para la impresión física de comprobantes.

### 2.2. Software y Conectividad
*   **Navegadores Web Compatibles:** Google Chrome (versión 100 o superior), Microsoft Edge (versión 100 o superior), Safari (versión 15 o superior) o Mozilla Firefox. *Es fundamental tener habilitada la persistencia de datos de navegación (no utilizar modo incógnito estricto si se planea operar offline, ya que esto podría borrar el localStorage fallback).*
*   **Conectividad de Red:**
    *   **Modo Online (Estándar):** Requiere conexión de banda ancha (ADSL/Fibra o redes móviles 4G/5G) estable para comunicarse con el servidor en la nube (Supabase).
    *   **Modo Offline (Contingencia):** Exclusivo para el *Canal Comercial*. Si se corta la red, el sistema sigue funcionando de forma local. No requiere acción manual; el cambio de conexión a base de datos local es automático.

---

## 3. Acceso al Sistema

### 3.1. Inicio de Sesión (Login)
Para ingresar al sistema, siga estos pasos:
1. Abra su navegador web e ingrese a la dirección URL provista por el departamento de sistemas de FADICC.
2. Visualizará la pantalla de **Login**. En el lateral izquierdo, observará el resumen de características del sistema y en el derecho, el formulario de ingreso.
3. Ingrese su **Correo Electrónico** asignado (ejemplo: `nombre@fadicc.com`).
4. Ingrese su **Contraseña** secreta.
    *   *Sugerencia:* Puede usar el botón con forma de ojo (`👁️` / `👁️‍🗨️`) a la derecha del campo para mostrar u ocultar los caracteres de su contraseña y verificar que esté escrita correctamente.
5. Presione el botón **Iniciar Sesión**.
    *   Si los datos son correctos, el sistema lo redireccionará al panel principal correspondiente a su rol.
    *   Si ingresó credenciales inválidas, se activará un recuadro de alerta color rojo con animación de vibración (shake) que describe el error (ej: *"Credenciales incorrectas o usuario inactivo"*).
6. **Recuperación de Contraseña:** Si olvidó su clave, haga clic en el botón *¿Olvidaste tu contraseña?* en la parte inferior del formulario. Se abrirá una ventana flotante donde deberá digitar su correo electrónico y presionar *Enviar*. El sistema le mandará un correo con instrucciones para restablecer su clave.

> [!NOTE]
> **Cuentas de demostración/prueba (Solo para evaluación):**  
> En la parte inferior del Login, encontrará un botón colapsable titulado **"Auto-llenar Credenciales de Prueba"**. Al desplegarlo, podrá hacer clic sobre cualquiera de los roles disponibles (Administrador, Vendedor, Representante, Jefe de Planta, etc.) y la plataforma completará automáticamente el correo y la contraseña universal (`123456`) para facilitar un acceso inmediato al prototipo.

### 3.2. Contacto para Soporte
Si presenta dificultades técnicas recurrentes para iniciar sesión o requiere la creación de un nuevo usuario, por favor comuníquese de inmediato con el Administrador de Sistemas enviando un correo electrónico a **soporte@fadicc.com** o llamando al anexo de TI **#400** desde los teléfonos de la tienda.

---

## 4. Descripción General de la Interfaz

### 4.1. Pantalla Principal – Panel del Sistema
Al ingresar de manera exitosa, el sistema presenta un esquema visual estructurado y moderno en tono claro premium con bordes tipo cristal (glassmorphism):

```
┌────────────────────────────────────────────────────────────────────────┐
│  FADICC S.A. Logo  │  [TopBar] TÍTULO DE SECCIÓN    Fecha / Hora (vía) │
├────────────────────┼───────────────────────────────────────────────────┤
│                    │                                                   │
│  • Dashboard       │  [Zona de Trabajo Principal]                       │
│  • Canal Comercial │                                                   │
│  • Canal Industrial│  Aquí se renderizan los catálogos, gráficos,      │
│  • Planta          │  Kanbans y tablas según la sección seleccionada.   │
│  • Inventario      │                                                   │
│  • Clientes        │                                                   │
│                    │                                                   │
├────────────────────┤                                                   │
│  [Usuario Logueado]│                                                   │
│  Cerrar Sesión     │                                                   │
└────────────────────┴───────────────────────────────────────────────────┘
```

La interfaz principal consta de las siguientes áreas funcionales:
1.  **Barra Lateral de Navegación (Sidebar):** Ubicada a la izquierda. Muestra el logotipo de FADICC S.A., los datos e iniciales del usuario logueado con su rol actual y los módulos permitidos según su perfil. Cuenta con un botón flotante de colapso (`◀` / `▶`) en la esquina derecha que permite contraer el menú para ganar espacio de visualización en pantallas compactas. En la base del Sidebar se encuentra el botón **Cerrar Sesión**.
2.  **Barra Superior (TopBar):** Muestra el nombre de la sección actual (ej. *"Centro de Producción"*) y en el extremo derecho muestra la fecha, día de la semana y la hora exacta del sistema en formato de reloj digital dinámico (actualizado segundo a segundo).
3.  **Área de Trabajo Principal:** El centro de la pantalla donde se ejecutan los procesos de venta, edición, filtros y consultas.

### 4.2. Panel de Administración
Exclusivo para usuarios con rol de **ADMIN** (disponible en la ruta `/dashboard/admin` desde la barra lateral):
*   **Estadísticas del Equipo:** Indicadores superiores que muestran el total de usuarios en la plataforma, personal activo, inactivo y un recuento de roles del personal de planta y ventas.
*   **Tabla de Usuarios:** Lista completa del personal con su nombre, correo electrónico, rol en el sistema y un interruptor (toggle) que activa o desactiva su cuenta en tiempo real.
*   **Acciones Administrativas:**
    *   **Crear Usuario:** Permite dar de alta a nuevos trabajadores asignando su correo, rol de acceso (VENDEDOR, PRODUCCION, etc.) y una contraseña temporal fija que deberá ser cambiada tras el primer acceso.
    *   **Editar Usuario:** Permite corregir el nombre, modificar el rol de seguridad o actualizar la contraseña en caso de bloqueos.
    *   **Configuración del Sistema:** Sección para configurar parámetros globales del sistema, incluyendo datos del servidor y control de IGV aplicable a las ventas.

---

## 5. Operaciones Básicas del Sistema

### 5.1. Canal Comercial: Control de Caja Turno (Apertura y Cierre)
Antes de procesar cualquier transacción en tienda física, el vendedor debe controlar el estado de la caja registradora a través del banner superior de la sección comercial:

1.  **Apertura de Caja:**
    *   Si visualiza el banner color rojo con el texto **"Caja Cerrada"**, significa que no podrá vender.
    *   Ingrese el monto físico inicial disponible en el cajón de monedas/billetes en el campo **"S/ Monto de apertura"** (ejemplo: `200.00`).
    *   Presione el botón **Abrir Turno**. El indicador cambiará a color verde con un pulso animado indicando **"Caja Activa"** e iniciará el contador de horas del turno.
2.  **Cierre de Caja:**
    *   Al finalizar la jornada laboral o el turno, presione el botón **Cerrar Turno** (color rojo).
    *   Aparecerá el **Modal Global de Confirmación de Cierre de Caja** que detalla el resumen financiero del turno:
        *   Monto de apertura registrado.
        *   Ventas totales cobradas (acumulado de boletas y facturas emitidas).
        *   Monto final esperado en efectivo en el cajón de dinero.
    *   Deberá presionar **"Confirmar Cierre"** para congelar las ventas de dicho turno y emitir el reporte de arqueo en el servidor.

### 5.2. Canal Comercial: Venta Directa en Tienda
Una vez activa la caja, la pantalla se divide en dos columnas principales:

```
┌─────────────────────────────────────────────────┬───────────────────────┐
│ [CATÁLOGO DE PRODUCTOS]                         │ [PANEL DE VENTA]      │
│ Buscador: [Buscar por nombre o SKU...         ] │ Cliente: [Juan Perez] │
│                                                 │ Comprobante: [Boleta] │
│ ┌──────────────────────┐ ┌──────────────────────┐ │ ┌───────────────────┐ │
│ │ SKU-001 Cocina Ind.  │ │ SKU-002 Cocina Dom.  │ │ │ Lista de Carrito  │ │
│ │ Stock: 5 uds         │ │ Stock: Sin Stock     │ │ │ Cocina Ind. x1    │ │
│ │ S/ 1500.00           │ │ (BLOQUEADO)          │ │ └───────────────────┘ │
│ │ [ + Agregar ]        │ │ [ No Disponible ]    │ │ Subtotal:  S/ 1271.19 │
│ └──────────────────────┘ └──────────────────────┘ │ IGV (18%): S/  228.81 │
│                                                 │ TOTAL:     S/ 1500.00 │
│                                                 │ [ CONFIRMAR VENTA ]   │
└─────────────────────────────────────────────────┴───────────────────────┘
```

1.  **Selección de Productos:** Use el buscador superior para filtrar por descripción del producto o código SKU. Las tarjetas con stock disponible muestran un botón naranja de **"+ Agregar al Carrito"**.
    *   *Alerta de Stock:* Si el inventario del producto es menor o igual al stock mínimo de seguridad, aparecerá un indicador amarillo que dice **"Bajo (N)"**. Si el stock es cero, la tarjeta se opaca, se bloquea y muestra un ícono de candado con el texto **"Sin Stock"**, impidiendo agregar el artículo al carrito.
2.  **Configuración del Pedido (Panel de Venta):**
    *   **Cliente:** Digite el número de documento (DNI/RUC) o el nombre del cliente en el buscador. El sistema filtrará instantáneamente. Si es un cliente nuevo, presione el botón **"+"** al lado del input para abrir el formulario de alta rápida de clientes sin salir del canal de venta.
    *   **Tipo de Comprobante:** Seleccione mediante el selector si emitirá una **Boleta** o una **Factura**.
3.  **Revisión y Ajuste del Carrito:**
    *   En la lista del carrito, puede ajustar la cantidad a vender digitando el número directamente. Si excede el stock máximo de seguridad en almacén, el cuadro del número vibrará en color rojo y saltará una notificación flotante indicando la capacidad máxima permitida.
    *   Si desea quitar un artículo, pase el cursor sobre el elemento y presione la **"X"** de eliminación.
4.  **Confirmación y Pago:** El sistema calcula de manera automática el Subtotal, el IGV (18%) y el Total general en soles.
    *   Presione el botón **Confirmar Venta**. Al realizarse la operación con éxito, se actualizará el stock de inventario, se limpiará el carrito y se generará una alerta de éxito con el código del comprobante listo para su registro o impresión.

### 5.3. Canal Industrial: Gestión de Proformas
Los representantes y administradores controlan el canal industrial a través de un **Tablero Kanban** estructurado en cinco fases o columnas de venta corporativa:

1.  **Visualización Kanban:**
    *   **Pendiente:** Cotizaciones recién registradas a la espera de evaluación del cliente.
    *   **En Negociación:** Proformas que han sufrido variaciones de precios y están bajo acuerdo de volumen.
    *   **Aprobada:** Proformas que el cliente aceptó y que el sistema convierte de forma automática en una **Orden de Pedido** (ej. `PED-2026-001`) derivando el trabajo a planta.
    *   **Rechazada:** Negociaciones frustradas.
    *   **Expirada:** Proformas que superaron su fecha límite de validez.
2.  **Acciones Rápidas en Tarjeta:** Cada tarjeta del Kanban muestra el código, razón social de la empresa, nombre del representante, monto total y fecha límite de validez. En la parte inferior cuenta con botones para cambiar el estado (ej: **Aprobar**, **Negociar**, **Rechazar**) con un sistema de doble confirmación inline para evitar clics accidentales.
3.  **Detalle Ampliado (Drawer):** Si hace clic en el cuerpo de una tarjeta del Kanban, se abrirá un panel lateral deslizable (Drawer) que detalla toda la información comercial de la cotización: datos fiscales del cliente, desglose de productos comparando el "precio de lista" vs. "precio pactado" indicando el descuento obtenido, y un historial cronológico (Timeline) de estados del proceso.
4.  **Creación de Proforma (Wizard de 3 pasos):**
    *   **Paso 1 (Cliente):** Busque a la empresa en la lista del sistema o presione el botón de agregar cliente si no existe.
    *   **Paso 2 (Productos):** Seleccione los artículos industriales que desea cotizar. En la tabla de la derecha, configure la cantidad y edite el **Precio Pactado** por volumen. Si otorga un descuento menor al precio de lista, el sistema lo resaltará en color verde indicando el ahorro. Si el precio excede el valor base, aparecerá una advertencia visual.
    *   **Paso 3 (Confirmación):** Revise el resumen no editable del documento, seleccione la fecha de expiración de la cotización (por defecto hoy más 15 días) y presione **Generar Proforma** para publicarla en el tablero.

### 5.4. Control de Inventario y Ajustes de Stock
Permite a los encargados de almacén y administradores controlar la existencia real de productos:
*   **Estados Semánticos de Inventario:** La tabla de artículos clasifica visualmente el stock mediante badges de colores:
    *   🟢 **OK:** Stock óptimo disponible.
    *   🟡 **Bajo:** Se superó el stock mínimo, requiere reabastecimiento pronto.
    *   🟠 **Limitado:** Stock extremadamente bajo.
    *   🔴 **Sin Stock:** Stock en cero.
*   **Registrar Movimiento de Inventario:** Haga clic en **Ajuste de Stock** para abrir la ventana modal.
    *   Seleccione el tipo de movimiento: **Entrada** (para ingresos de fábrica o compras) o **Ajuste Manual** (para correcciones de inventario físico o pérdidas).
    *   Seleccione el producto, ingrese la cantidad a modificar y digite de forma obligatoria la **Justificación o Motivo** del movimiento por motivos de auditoría.
*   **Historial de Movimientos:** En la pestaña secundaria o haciendo clic sobre una fila de producto, podrá desplegar el historial de ingresos, egresos y ajustes realizados sobre el stock del producto con fechas y nombres de los operadores responsables.

### 5.5. Centro de Producción y Despachos (Planta)
Los jefes de planta (Producción) y encargados de despacho (Almacén) gestionan el proceso de fabricación a través de este panel:
*   **Timeline de Órdenes:** Las órdenes de pedido aprobadas se muestran en una cola de trabajo vertical en formato de tarjetas individuales.
*   **Stepper Visual de Proceso:** Cada pedido muestra un indicador lineal de progreso en 4 pasos:
    1.  `Pendiente` ➔ 2. `En Fabricación` ➔ 3. `Listo para Despacho` ➔ 4. `Entregado`
*   **Actualización de Estado:** El jefe de producción actualiza las fases haciendo clic sobre el paso correspondiente en la tarjeta. El sistema actualiza los colores y activa pulsos de luz en el paso activo para mayor control visual en planta.
*   **Filtros de Control:** La barra superior permite filtrar rápidamente por código de pedido, rango de fechas y estado del pedido.

### 5.6. Gestión de Clientes y Trámites
Módulo unificado para mantener la base de datos de compradores:
*   **Ficha Completa:** Al seleccionar un cliente de la tabla, se abrirá un panel lateral derecho (Drawer) que muestra no solo sus datos de contacto y RUC/DNI, sino que lista de forma ordenada el histórico completo de sus compras realizadas en tienda y sus proformas activas en el canal industrial.
*   **Alta y Edición:** Cuenta con validación automática que impide guardar un cliente duplicado que posea el mismo número de documento nacional de identidad o registro único de contribuyentes.

---

## 6. Mensajes del Sistema y Manejo de Errores

El sistema de FADICC ERP utiliza notificaciones emergentes de color dinámico (**GradientToast**) y efectos físicos de interfaz para alertar al usuario:

1.  **Alertas de Confirmación de Operaciones:**
    *   🟢 **Verde (Éxito):** Se muestra al emitir ventas, registrar clientes, guardar usuarios o completar pasos de producción de manera exitosa.
    *   🔵 **Azul (Información):** Muestra el estado del sistema o avisos de tiempos estimados de fabricación.
    *   🟡 **Amarillo (Advertencia):** Avisa sobre stocks mínimos alcanzados o superación de límites de descuento durante cotizaciones.
2.  **Mensajes de Error e Interrupciones:**
    *   🔴 **Rojo (Peligro/Error):** Se activa ante problemas de validación de base de datos o fallos de red.
    *   **Efecto Vibración (Shake):** Si ingresa datos incorrectos en el formulario de login, si la caja está cerrada e intenta confirmar una venta, o si digita una cantidad superior al stock del catálogo, el input y el contenedor vibrarán lateralmente para indicarle visualmente que la acción no puede proceder.
3.  **Advertencia de Modo de Contingencia (Offline Fallback):**
    *   Si el sistema detecta que la conexión con el servidor Supabase en la nube se ha interrumpido, el canal comercial entrará en modo local. Aparecerá un aviso en la parte superior: *"Operando en modo de contingencia offline. Los datos se guardarán de forma local"*. Las transacciones se almacenan de manera temporal en el navegador y se sincronizarán al retornar el enlace a la red.

---

## 7. Preguntas Frecuentes

**¿Qué pasa si cierro la pestaña del navegador con la caja activa?**  
No perderá sus datos. El estado de la caja y el carrito de compras actual se guardan automáticamente en la base de datos local y en el servidor, por lo que al volver a abrir el sistema recuperará la información en el punto exacto en el que lo dejó.

**¿Puedo emitir una factura si el cliente está registrado solo con DNI?**  
No. De acuerdo con las normas tributarias configuradas en el sistema, para la emisión de Facturas es obligatorio que el cliente cuente con un número de RUC válido de 11 dígitos y razón social de empresa. Si es persona natural con DNI, la opción adecuada es Boleta de Venta.

**¿Cómo autorizo un descuento mayor al permitido a un cliente industrial?**  
El sistema genera una advertencia en color rojo en el Wizard de Proformas si el precio pactado reduce demasiado el margen del producto. El REPRESENTANTE puede registrar la propuesta, pero la proforma quedará en estado "Pendiente" o "En Negociación" hasta que un usuario con rol de **ADMIN** la autorice y cambie el estado en el Kanban de Aprobación.

**El sistema se siente lento o no muestra los productos actualizados. ¿Qué hago?**  
Es posible que tenga problemas de conectividad intermedia. Asegúrese de que el indicador de fecha y hora del TopBar se esté actualizando en vivo de forma fluida. Si no es así, recargue la página presionando la tecla `F5` o revise el estado de su conexión Wi-Fi/cable de red.

---

## 8. Glosario de Términos

*   **ERP (Enterprise Resource Planning):** Sistema informático de planificación de recursos empresariales que centraliza la administración comercial, facturación, control de inventario y fabricación.
*   **Dual-Mode (Base de datos dual):** Sistema híbrido de persistencia de datos. Funciona de manera primaria conectado en la nube (Supabase PostgreSQL) y de manera secundaria en el almacenamiento local del equipo (localStorage) cuando no hay red.
*   **RBAC (Role-Based Access Control):** Control de acceso basado en roles. Método de seguridad que restringe el uso de pantallas y acciones del sistema en base a los cargos asignados a cada empleado.
*   **Proforma:** Documento de cotización no vinculante de tipo industrial donde se detallan productos y precios especiales propuestos a un cliente corporativo antes de cerrar la venta.
*   **SKU (Stock Keeping Unit):** Código único de referencia alfanumérico utilizado en inventarios para identificar cada modelo específico de cocina comercial o doméstica de FADICC.
*   **IGV (Impuesto General a las Ventas):** Tributo del 18% aplicable a las transacciones de venta de bienes en el territorio peruano, calculado automáticamente en el checkout del sistema.

---

## 9. Contacto de Soporte

Para incidencias técnicas de segundo nivel, errores de base de datos o fallos de hardware en el terminal de ventas, dispone de las siguientes vías de soporte:
*   📧 **Correo Electrónico Principal:** soporte@fadicc.com
*   📞 **Teléfono y Anexos:** Central +51 (1) 500-1234 — Anexo Soporte TI: **400** (Horario de atención: Lunes a Sábado de 8:00 AM a 8:00 PM).
*   💻 **Área de Administración:** Para desbloqueos rápidos de cuentas y reseteo de claves del personal, acuda al personal con rol **ADMIN** en la oficina de administración de la tienda.

---

## 10. Guía para usar los botones de acción rápida y flujos del sistema

FADICC ERP v2.0 ha sido diseñado bajo estándares premium de experiencia de usuario, optimizando el uso de botones y gestos visuales para acelerar el trabajo diario en la empresa:

### 1. Botones de Acción Rápida en Tablas e Historiales
*   **Ver Detalle (`👁️`):** Localizado en las filas del historial de caja y de clientes. Al presionarlo, abre de manera inmediata el panel deslizante derecho sin recargar la página entera, permitiendo volver a la lista anterior con solo hacer clic en el fondo oscuro translúcido.
*   **Interruptor de Estado (Toggle Switch):** Exclusivo de la tabla de Administración de Usuarios. Un simple clic en el botón deslizable activa o desactiva la cuenta del trabajador de forma inmediata.
*   **Botón de Creación Rápida (`+`):** Ubicado junto a los selectores de clientes en los paneles de venta comercial y wizard industrial. Presionarlo suspende la tarea actual y despliega un formulario flotante simplificado para dar de alta al cliente en menos de 30 segundos.

### 2. Controles de Transición e Interacción
*   **Arrastrar y Mover en Kanban:** Las tarjetas de proforma en el Canal Industrial permiten visualizar el progreso comercial de las cotizaciones. El movimiento entre fases se realiza mediante los botones inferiores de la tarjeta (**Negociar**, **Aprobar**, **Rechazar**) que cambian el estado y trasladan automáticamente la tarjeta con una animación fluida hacia la columna correspondiente.
*   **Contadores Interactivos de la Barra de Filtros:** En los paneles de Producción e Inventario, las barras de filtros se complementan con botones redondos de reinicio (`🔄`) para limpiar instantáneamente las fechas y palabras buscadas, devolviendo la vista a su estado predeterminado.
*   **Barra de Pasos en Wizard (Navegación Stepper):** Al redactar una proforma nueva o revisar la producción en planta, observe el indicador de pasos superior. Los colores y checks le indicarán visualmente qué secciones están completas y correctas, impidiendo avanzar si existen campos obligatorios vacíos o errores de stock.
