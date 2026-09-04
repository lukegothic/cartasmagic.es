# Guía completa: Instalar y configurar Optima Elementor 3.2.8 en PrestaShop 8.2.3

## ⚠️ Información importante previa

**Versiones:**
- Tu PrestaShop: 8.2.3
- Theme Optima Elementor recomendado: 3.2.8 (compatible con PrestaShop 8.x)
- Fuente: ThemeForest (Plaza-Themes)

**📝 NOTA:** Optima Elementor es un tema premium. Necesitarás haberlo comprado en ThemeForest o tener acceso legítimo al archivo ZIP.

---

## FASE 1: Preparación y Backup

### Paso 1: Hacer backup completo

**⚠️ CRÍTICO - No omitas este paso:**

```bash
# Backup de archivos
cd /var/www
sudo tar -czf backup-prestashop-$(date +%Y%m%d).tar.gz comprarcartasmagic.es/

# Backup de base de datos
sudo mysqldump -u root -p prestashop_db > backup-prestashop-$(date +%Y%m%d).sql

# Verificar que los backups se crearon
ls -lh backup-*
```

**Guarda estos archivos en un lugar seguro** (descárgalos a tu PC local).

---

### Paso 2: Aumentar límites de PHP para uploads grandes

El theme Optima es pesado (puede superar 50MB), necesitamos aumentar los límites:

```bash
sudo nano /etc/php/8.1/fpm/php.ini
```

Busca y modifica estas líneas (usa Ctrl+W para buscar):

```ini
upload_max_filesize = 128M
post_max_size = 128M
max_execution_time = 600
max_input_time = 600
memory_limit = 512M
```

Guarda (Ctrl+O, Enter, Ctrl+X) y reinicia PHP:

```bash
sudo systemctl restart php8.1-fpm
```

---

### Paso 3: Verificar permisos de directorios

```bash
sudo chown -R www-data:www-data /var/www/comprarcartasmagic.es
sudo find /var/www/comprarcartasmagic.es -type d -exec chmod 755 {} \;
sudo find /var/www/comprarcartasmagic.es -type f -exec chmod 644 {} \;

# Permisos especiales para carpetas de escritura
sudo chmod -R 777 /var/www/comprarcartasmagic.es/var/cache/
sudo chmod -R 777 /var/www/comprarcartasmagic.es/var/logs/
sudo chmod -R 777 /var/www/comprarcartasmagic.es/themes/
sudo chmod -R 777 /var/www/comprarcartasmagic.es/modules/
sudo chmod -R 777 /var/www/comprarcartasmagic.es/img/
sudo chmod -R 777 /var/www/comprarcartasmagic.es/upload/
```

---

## FASE 2: Descargar y preparar el Theme

### Paso 4: Descargar Optima Elementor

**Opción A - Si lo compraste en ThemeForest:**
1. Ve a https://themeforest.net/downloads
2. Busca "Optima Elementor"
3. Descarga el archivo completo (All files & documentation)
4. Descomprime en tu PC local

**Estructura del paquete descargado:**
```
Optima_Elementor_v3.2.8/
├── Documentation/
├── theme/
│   └── leo_optima_elementor_vX.X.X.zip  ← Este es el que necesitas
├── quickstart_install/  (opcional, para instalación limpia)
└── licenses/
```

**📌 IMPORTANTE:** El archivo que subiremos es `leo_optima_elementor_vX.X.X.zip` que está dentro de la carpeta `theme/`

---

### Paso 5: Subir el theme al servidor

**Opción A - Usando SCP (recomendado para archivos grandes):**

Desde tu PC local (PowerShell en Windows o Terminal en Mac/Linux):

```bash
# Reemplaza con tus datos
scp leo_optima_elementor_v3.2.8.zip usuario@tu-ip-servidor:/tmp/
```

Luego en el servidor:

```bash
# Verificar que se subió correctamente
ls -lh /tmp/leo_optima_elementor_v3.2.8.zip
```

**Opción B - Usando FTP con FileZilla:**

1. Conecta con FileZilla a tu servidor
2. Navega a `/tmp/`
3. Sube el archivo `leo_optima_elementor_vX.X.X.zip`

---

## FASE 3: Instalación del Theme desde el BackOffice

### Paso 6: Acceder al panel de administración

1. Accede a tu backoffice: `https://comprarcartasmagic.es/admin127xzfwv2irkxzknozu`
2. Inicia sesión con tus credenciales

---

### Paso 7: Instalar el theme

**Método 1 - Importar desde FTP (recomendado para archivos grandes):**

1. En el backoffice, ve a: **Diseño → Tema y logotipo**
2. Haz clic en **"Añadir nuevo tema"**
3. Selecciona la pestaña **"Importar desde FTP"**
4. En el selector, busca: `leo_optima_elementor_v3.2.8.zip`
5. Haz clic en **"Guardar"**

**Método 2 - Importar desde ordenador (si el archivo no es muy grande):**

1. En el backoffice, ve a: **Diseño → Tema y logotipo**
2. Haz clic en **"Añadir nuevo tema"**
3. Selecciona **"Importar desde tu ordenador"**
4. Haz clic en **"Examinar"** y selecciona el ZIP
5. Haz clic en **"Guardar"**

**⏱️ PACIENCIA:** La subida e instalación puede tardar 2-5 minutos dependiendo del tamaño del theme.

---

### Paso 8: Instalación de módulos del theme

Una vez subido el theme, PrestaShop te mostrará una pantalla con:
- Lista de módulos incluidos en el theme
- Opción de instalar o no cada módulo

**Recomendación:**
- ✅ **Instala TODOS los módulos** que vienen con el theme (están diseñados específicamente para Optima)
- Los módulos principales de Optima suelen incluir:
  - `leo_elementor` (constructor de páginas)
  - `leoslideshow` (slider principal)
  - `leomegamenu` (menú mega)
  - `leo_product_carousel`
  - Y otros módulos específicos del theme

Haz clic en **"Guardar"** para instalar los módulos seleccionados.

---

### Paso 9: Activar el theme

1. Vuelve a **Diseño → Tema y logotipo**
2. Verás tu theme recién instalado: **"Leo Optima Elementor"**
3. Pasa el cursor sobre la miniatura del theme
4. Haz clic en **"Usar este tema"**
5. Confirma la acción

**⚠️ ADVERTENCIA:** Te puede avisar sobre el redimensionamiento de imágenes. Esto es normal en una instalación nueva.

---

## FASE 4: Configuración del Theme

### Paso 10: Configurar tema básico

Una vez activado el theme, ve a:

**Diseño → Tema y logotipo → Configurar "Leo Optima Elementor"**

O accede directamente al módulo de configuración:

**Módulos → Gestor de módulos → Buscar "Leo Theme Settings"**

---

### Paso 11: Configuración general del theme

En la configuración del theme encontrarás estas secciones principales:

**1. General Settings:**
- Layout width (ancho del sitio)
- Colors principales
- Typography (fuentes)
- Responsive settings

**2. Header Configuration:**
- Seleccionar estilo de header (Optima tiene múltiples variantes)
- Configurar sticky header
- Mini cart settings

**3. Footer Configuration:**
- Seleccionar layout de footer
- Configurar columnas
- Newsletter settings

**4. Product Page:**
- Layout de página de producto
- Image zoom settings
- Related products configuration

**5. Category/Listing Page:**
- Grid/List view options
- Sidebar position
- Filter settings

**📝 NOTA:** Guarda los cambios después de cada configuración.

---

### Paso 12: Configurar el Logo

**Diseño → Tema y logotipo → Sección "Logotipos"**

Sube tus logos:
- **Header logo:** Tu logo principal (recomendado: PNG transparente, ~250x80px)
- **Invoice logo:** Logo para facturas
- **Favicon:** Icono del navegador (16x16px o 32x32px)

---

### Paso 13: Configurar Leo Elementor (Page Builder)

Este es el constructor visual de páginas de Optima.

1. Ve a **Módulos → Gestor de módulos**
2. Busca **"Leo Elementor"**
3. Haz clic en **"Configurar"**

**Funciones principales de Leo Elementor:**
- Drag & drop para crear páginas
- Widgets personalizables
- Plantillas prediseñadas
- Responsive editing

---

### Paso 14: Configurar Leo Mega Menu

El menú principal del theme:

1. Ve a **Módulos → Gestor de módulos**
2. Busca **"Leo Megamenu"**
3. Haz clic en **"Configurar"**

**Configuración del menú:**
- Crea elementos de menú
- Asigna categorías o enlaces personalizados
- Configura submegamenús con imágenes
- Ajusta estilos y colores

---

### Paso 15: Configurar Leo Slideshow

El slider principal de la homepage:

1. Ve a **Módulos → Gestor de módulos**
2. Busca **"Leo Slideshow"**
3. Haz clic en **"Configurar"**

**Para añadir slides:**
- Haz clic en **"Add slide"**
- Sube imagen (recomendado: 1920x600px o según tu diseño)
- Añade título, descripción y enlace
- Configura animaciones y timing

---

## FASE 5: Importar Demo Content (Opcional pero recomendado)

### Paso 16: Importar contenido de demostración

Optima Elementor viene con múltiples demos (117+ layouts). Para importar uno:

**Opción A - Import desde el Theme Panel:**

1. Ve a **Diseño → Tema y logotipo**
2. Busca el botón o sección **"Import Demo Data"** o **"Sample Data"**
3. Selecciona el demo que deseas importar
4. Marca las opciones:
   - ✅ Import pages
   - ✅ Import products (solo si quieres productos de ejemplo)
   - ✅ Import theme settings
   - ✅ Import widgets
5. Haz clic en **"Import"**

**⏱️ TIEMPO:** La importación puede tardar 5-15 minutos. **NO cierres el navegador.**

**Opción B - Import manual desde QuickStart:**

Si descargaste el paquete completo, encontrarás una carpeta `quickstart_install/` con:
- Base de datos SQL de ejemplo
- Archivos de imágenes

**⚠️ ADVERTENCIA:** Usar QuickStart reemplazará TODA tu base de datos. Solo hazlo en una instalación completamente nueva.

---

## FASE 6: Optimización post-instalación

### Paso 17: Limpiar caché

```bash
# Limpiar caché de PrestaShop
sudo rm -rf /var/www/comprarcartasmagic.es/var/cache/prod/*
sudo rm -rf /var/www/comprarcartasmagic.es/var/cache/dev/*

# Limpiar caché de Smarty (templates)
sudo rm -rf /var/www/comprarcartasmagic.es/cache/smarty/cache/*
sudo rm -rf /var/www/comprarcartasmagic.es/cache/smarty/compile/*

# Restaurar permisos
sudo chown -R www-data:www-data /var/www/comprarcartasmagic.es/var/cache/
sudo chown -R www-data:www-data /var/www/comprarcartasmagic.es/cache/
```

También desde el backoffice:
**Parámetros Avanzados → Rendimiento → Limpiar caché**

---

### Paso 18: Regenerar imágenes

Con el nuevo theme, las dimensiones de las imágenes pueden haber cambiado:

1. Ve a **Diseño → Posiciones de imágenes**
2. Haz clic en **"Regenerar miniaturas"**
3. Selecciona **todas las opciones**
4. Haz clic en **"Regenerar miniaturas"**

**⏱️ TIEMPO:** Puede tardar varios minutos según la cantidad de imágenes.

---

### Paso 19: Configurar SEO y URLs

1. Ve a **Tráfico y SEO → SEO y URLs**
2. Activa **"URLs amigables"** (solo si funciona bien en tu servidor)
3. Configura meta títulos y descripciones

**Si tienes problemas con URLs amigables:**
```bash
sudo nano /var/www/comprarcartasmagic.es/.htaccess
```

Verifica que contenga las reglas de reescritura de PrestaShop.

---

### Paso 20: Optimización de rendimiento

**Configurar caché y compresión:**

1. Ve a **Parámetros Avanzados → Rendimiento**

**Configuración recomendada:**
- ✅ **Smarty:**
  - Cache: Sí
  - Compilación: Recompilar plantillas si los archivos han sido actualizados
  - Cache type: Sistema de archivos
- ✅ **CCC (Combine, Compress and Cache):**
  - Combinar, comprimir y cachear CSS: Sí
  - Combinar, comprimir y cachear JavaScript: Sí
- ✅ **Media servers:**
  - Configura CDN si lo tienes (opcional)

Haz clic en **"Guardar"**

---

## FASE 7: Verificaciones finales

### Paso 21: Checklist de verificación

Comprueba que todo funciona correctamente:

**Frontend (https://comprarcartasmagic.es):**
- ✅ El theme se muestra correctamente
- ✅ El slider principal funciona
- ✅ El menú mega menu se despliega bien
- ✅ Las páginas de producto se ven correctas
- ✅ El carrito funciona
- ✅ Las imágenes se cargan correctamente
- ✅ Responsive: prueba en móvil/tablet

**Backend:**
- ✅ Todos los módulos del theme están activos
- ✅ No hay errores en el dashboard
- ✅ Puedes editar páginas con Elementor
- ✅ Puedes configurar el menú y slideshow

---

### Paso 22: Configuración SSL forzado (si no lo hiciste antes)

Forzar HTTPS en todo el sitio:

1. Ve a **Configuración → Preferencias**
2. En **"Habilitar SSL"**: Selecciona **"Sí"**
3. Marca **"Habilitar SSL en todas las páginas"**
4. Guarda

---

## FASE 8: Personalización avanzada

### Paso 23: Crear tu primera página con Elementor

1. Ve a **Diseño → Páginas**
2. Haz clic en **"Añadir nueva página"**
3. Asigna un nombre (ej: "Home personalizada")
4. Haz clic en **"Editar con Elementor"**
5. Usa el editor drag & drop para diseñar tu página

**Widgets útiles de Optima Elementor:**
- Banner con enlace
- Productos destacados
- Carrusel de productos
- Categorías grid
- Newsletter
- Testimonios
- Instagram feed

---

### Paso 24: Personalizar colores globales

**Método rápido desde Theme Settings:**

1. Ve a **Módulos → Leo Theme Settings → Configure**
2. Pestaña **"General"**
3. Sección **"Color Scheme"**
4. Define:
   - Primary color (color principal de tu marca)
   - Secondary color
   - Link color
   - Button colors
5. Guarda

Los cambios se aplicarán globalmente a todo el theme.

---

### Paso 25: Configurar Homepage

**Asignar página de inicio personalizada:**

1. Ve a **Configuración → Preferencias**
2. En **"Página de inicio"**: Selecciona tu página creada con Elementor
3. O usa la homepage por defecto del theme

**Configurar módulos de homepage:**
- Ve a **Diseño → Posiciones**
- Aquí verás todos los módulos y sus posiciones
- Puedes activar/desactivar módulos
- Reordenar mediante drag & drop

---

## FASE 9: Solución de problemas comunes

### Problema 1: El theme no se muestra correctamente

**Solución:**
```bash
# Limpiar caché
sudo rm -rf /var/www/comprarcartasmagic.es/var/cache/*

# Regenerar assets
sudo -u www-data php /var/www/comprarcartasmagic.es/bin/console prestashop:cache:clear

# Verificar permisos
sudo chown -R www-data:www-data /var/www/comprarcartasmagic.es
```

---

### Problema 2: Módulos del theme no se instalan

**Solución:**

```bash
# Verificar logs de errores
sudo tail -f /var/www/comprarcartasmagic.es/var/logs/prod.log

# Instalar módulos manualmente vía CLI
cd /var/www/comprarcartasmagic.es
sudo -u www-data php bin/console prestashop:module install leo_elementor
```

---

### Problema 3: Imágenes rotas o no se cargan

**Solución:**
```bash
# Verificar permisos de carpeta img
sudo chmod -R 777 /var/www/comprarcartasmagic.es/img/

# Regenerar miniaturas desde backoffice
# Diseño → Posiciones de imágenes → Regenerar miniaturas
```

---

### Problema 4: Error 500 después de instalar el theme

**Solución:**
```bash
# Ver logs de PHP
sudo tail -f /var/log/php8.1-fpm.log

# Ver logs de Nginx
sudo tail -f /var/log/nginx/comprarcartasmagic_error.log

# Aumentar límites de memoria si es necesario
sudo nano /etc/php/8.1/fpm/php.ini
# memory_limit = 512M o 1024M
```

---

### Problema 5: Elementor no carga o da error

**Solución:**
```bash
# Verificar que las extensiones PHP necesarias están instaladas
php -m | grep -E 'json|xml|zip|curl|gd'

# Si falta alguna, instala:
sudo apt install php8.1-json php8.1-xml php8.1-zip php8.1-curl php8.1-gd
sudo systemctl restart php8.1-fpm
```

---

## FASE 10: Recursos adicionales

### Documentación oficial de Optima

**📚 Recursos:**
- Documentación incluida en el paquete descargado (carpeta `Documentation/`)
- Soporte de Plaza-Themes en ThemeForest
- Videos tutoriales (si están disponibles en tu descarga)

---

### Comandos útiles de mantenimiento

**Limpiar todo:**
```bash
# Script completo de limpieza
sudo rm -rf /var/www/comprarcartasmagic.es/var/cache/prod/*
sudo rm -rf /var/www/comprarcartasmagic.es/var/cache/dev/*
sudo rm -rf /var/www/comprarcartasmagic.es/cache/smarty/cache/*
sudo rm -rf /var/www/comprarcartasmagic.es/cache/smarty/compile/*
sudo chown -R www-data:www-data /var/www/comprarcartasmagic.es
sudo systemctl restart php8.1-fpm
sudo systemctl restart nginx
```

**Ver logs en tiempo real:**
```bash
# Terminal 1: Logs de Nginx
sudo tail -f /var/log/nginx/comprarcartasmagic_error.log

# Terminal 2: Logs de PHP
sudo tail -f /var/log/php8.1-fpm.log

# Terminal 3: Logs de PrestaShop
sudo tail -f /var/www/comprarcartasmagic.es/var/logs/prod.log
```

---

## ✅ Checklist final

Marca lo que has completado:

- [ ] Backup realizado
- [ ] Límites de PHP aumentados
- [ ] Theme descargado y subido al servidor
- [ ] Theme instalado desde backoffice
- [ ] Módulos del theme instalados
- [ ] Theme activado
- [ ] Logo personalizado subido
- [ ] Leo Elementor configurado
- [ ] Mega Menu configurado
- [ ] Slideshow configurado
- [ ] Demo content importado (opcional)
- [ ] Caché limpiada
- [ ] Imágenes regeneradas
- [ ] SEO configurado
- [ ] Rendimiento optimizado
- [ ] SSL activado y funcionando
- [ ] Frontend verificado en escritorio
- [ ] Frontend verificado en móvil
- [ ] Backend funcionando correctamente

---

## 🎉 ¡Felicidades!

Tu theme Optima Elementor 3.2.8 está instalado y configurado en PrestaShop 8.2.3.

**Próximos pasos sugeridos:**
1. Personaliza colores y tipografías a tu marca
2. Añade tus productos reales
3. Configura métodos de pago y envío
4. Crea páginas legales (términos, privacidad, etc.)
5. Configura email marketing
6. Optimiza SEO on-page
7. Configura Google Analytics

**¿Necesitas ayuda adicional?**
- Revisa la documentación del theme
- Contacta soporte de Plaza-Themes en ThemeForest
- Comprueba los logs de error si algo no funciona

---

## ⚠️ Puntos donde necesito tu confirmación

Si encuentras algún problema durante la instalación, compártelo aquí y te ayudaré a solucionarlo. Los problemas más comunes suelen ser:

1. **Tamaño del archivo ZIP muy grande:** Aumenta más los límites de PHP
2. **Módulos que no se instalan:** Revisar logs y permisos
3. **Theme no se muestra:** Limpiar caché y regenerar assets
4. **Elementor no carga:** Verificar extensiones PHP requeridas

¡Avísame si necesitas ayuda con algún paso específico!