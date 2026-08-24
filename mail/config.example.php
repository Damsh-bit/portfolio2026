<?php
/**
 * Copiá este archivo como config.php y completá tus datos reales.
 * config.php NO se sube a git (está en .gitignore) porque tiene credenciales.
 *
 * Pasos en hPanel (Hostinger):
 * 1. Emails → Crear cuenta de correo, ej: contacto@damiancoronel.com
 * 2. Anotá la contraseña que le pongas a esa cuenta.
 * 3. Completá los valores de abajo con esos datos.
 */

return [
    // Cuenta de correo creada en hPanel (la que envía el mail)
    'smtp_host'     => 'smtp.hostinger.com',
    'smtp_port'     => 465,
    'smtp_secure'   => 'ssl', // 'ssl' para puerto 465, 'tls' para puerto 587
    'smtp_username' => 'contacto@damiancoronel.com',
    'smtp_password' => 'TU_CONTRASEÑA_DE_LA_CASILLA',

    // Remitente que verán en el mail (normalmente la misma casilla)
    'from_email'    => 'contacto@damiancoronel.com',
    'from_name'     => 'Formulario damiancoronel.com',

    // A dónde llegan los mensajes del formulario
    'to_email'      => 'contacto@damiancoronel.com',
    'to_name'       => 'Damián Coronel',

    // Dominios permitidos a enviar (protección CORS/referer básica)
    'allowed_origin' => 'https://damiancoronel.com',
];
