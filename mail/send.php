<?php
/**
 * =========================================================================
 * CONTACT FORM MAIL ENDPOINT
 * =========================================================================
 * Recibe el POST del formulario de contacto (fetch JSON) y lo envía por
 * SMTP autenticado contra el mailer de Hostinger usando PHPMailer.
 * Requiere mail/config.php (ver config.example.php) con las credenciales
 * de la casilla creada en hPanel.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

function respond(bool $ok, string $message, int $status = 200): void
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Método no permitido.', 405);
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    respond(false, 'El formulario todavía no está configurado.', 500);
}
$config = require $configPath;

// Same-origin check (best-effort, not a real security boundary)
$origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
if (!empty($config['allowed_origin']) && $origin !== '' && strpos($origin, $config['allowed_origin']) !== 0) {
    respond(false, 'Origen no permitido.', 403);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$name = trim((string)($data['name'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$message = trim((string)($data['message'] ?? ''));
$honeypot = trim((string)($data['website'] ?? ''));

// Honeypot: los bots suelen completar campos ocultos. Fingimos éxito.
if ($honeypot !== '') {
    respond(true, 'Mensaje enviado.');
}

if ($name === '' || $email === '' || $message === '') {
    respond(false, 'Completá todos los campos.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'El email no es válido.', 422);
}

if (mb_strlen($name) > 150 || mb_strlen($message) > 5000) {
    respond(false, 'El mensaje es demasiado largo.', 422);
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = $config['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_username'];
    $mail->Password = $config['smtp_password'];
    $mail->SMTPSecure = $config['smtp_secure'];
    $mail->Port = $config['smtp_port'];
    $mail->CharSet = 'UTF-8';

    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($config['to_email'], $config['to_name']);
    $mail->addReplyTo($email, $name);

    $mail->isHTML(false);
    $mail->Subject = "Contacto desde damiancoronel.com — {$name}";
    $mail->Body = "Nombre: {$name}\nEmail: {$email}\n\nMensaje:\n{$message}";

    $mail->send();
    respond(true, 'Mensaje enviado. Te responderé a la brevedad.');
} catch (PHPMailerException $e) {
    error_log('Contact form mail error: ' . $mail->ErrorInfo);
    respond(false, 'No se pudo enviar el mensaje. Intentá de nuevo más tarde.', 500);
}
