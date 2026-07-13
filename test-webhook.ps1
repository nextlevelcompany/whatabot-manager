param (
    [string]$Phone = "51902801168",
    [string]$Message = "enviame costos"
)

# Generar un ID de mensaje único para evitar descartes por duplicados en la BD
$uniqueId = "wamid.simulated_" + (New-Guid).Guid.Replace("-", "")
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

$payload = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            id = "123456789"
            changes = @(
                @{
                    value = @{
                        messaging_product = "whatsapp"
                        metadata = @{
                            display_phone_number = "51902801168"
                            phone_number_id = "12345"
                        }
                        contacts = @(
                            @{
                                profile = @{
                                    name = "Simulado"
                                }
                                wa_id = $Phone
                            }
                        )
                        messages = @(
                            @{
                                from = $Phone
                                id = $uniqueId
                                timestamp = $timestamp
                                text = @{
                                    body = $Message
                                }
                                type = "text"
                            }
                        )
                    }
                    field = "messages"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Enviando payload simulado para el mensaje: '$Message' desde el teléfono: $Phone" -ForegroundColor Cyan
Write-Host "ID de mensaje único (wamid): $uniqueId" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/whatsapp/webhook" -Method Post -Body $payload -ContentType "application/json"
    Write-Host "Respuesta del Webhook: OK (200)" -ForegroundColor Green
    Write-Host "El bot procesará el mensaje en segundo plano. Revisa la consola de tu backend o el CRM web para ver los resultados." -ForegroundColor Gray
} catch {
    Write-Error "Error al conectar con el webhook del backend: $_"
}
